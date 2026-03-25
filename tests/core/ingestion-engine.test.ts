import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { IngestionEngine } from '../../src/core/ingestion-engine.js'
import { DocumentRegistry } from '../../src/core/document-registry.js'
import { MetadataExtractor } from '../../src/core/metadata-extractor.js'
import { PlainTextChunker } from '../../src/adapters/chunkers/plaintext.chunker.js'
import type { VectorStore } from '../../src/ports/vector-store.port.js'
import type { EmbeddingProvider } from '../../src/ports/embedding-provider.port.js'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const mockEmbedding: EmbeddingProvider = {
  embed: vi.fn(async () => [1, 0, 0, 0]),
  embedBatch: vi.fn(async (texts) => texts.map(() => [1, 0, 0, 0])),
  dimensions: () => 4,
}

const mockStore: VectorStore = {
  initialize: vi.fn(async () => {}),
  addDocuments: vi.fn(async () => {}),
  search: vi.fn(async () => []),
  delete: vi.fn(async () => {}),
  dispose: vi.fn(async () => {}),
}

describe('IngestionEngine', () => {
  let tmpDir: string
  let storagePath: string
  let registry: DocumentRegistry
  let engine: IngestionEngine

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'ingest-test-'))
    storagePath = join(tmpDir, 'storage')
    await mkdir(storagePath, { recursive: true })
    registry = new DocumentRegistry(storagePath)
    await registry.load()
    const extractor = new MetadataExtractor([])
    engine = new IngestionEngine(mockStore, mockEmbedding, [new PlainTextChunker()], registry, extractor)
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('ingests a single file', async () => {
    const filePath = join(tmpDir, 'doc.txt')
    await writeFile(filePath, 'Hello world')
    const result = await engine.ingest(filePath)
    expect(result.added).toBe(1)
    expect(result.errors).toHaveLength(0)
    expect(mockStore.addDocuments).toHaveBeenCalled()
  })

  it('ingests a directory', async () => {
    const dir = join(tmpDir, 'docs')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'a.txt'), 'File A')
    await writeFile(join(dir, 'b.txt'), 'File B')
    const result = await engine.ingest(dir)
    expect(result.added).toBe(2)
  })

  it('skips unchanged files on re-ingest', async () => {
    const filePath = join(tmpDir, 'doc.txt')
    await writeFile(filePath, 'Hello world')
    await engine.ingest(filePath)
    vi.clearAllMocks()
    const result = await engine.ingest(filePath)
    expect(result.skipped).toBe(1)
    expect(result.added).toBe(0)
    expect(mockStore.addDocuments).not.toHaveBeenCalled()
  })

  it('re-ingests changed files', async () => {
    const filePath = join(tmpDir, 'doc.txt')
    await writeFile(filePath, 'Hello world')
    await engine.ingest(filePath)
    await writeFile(filePath, 'Updated content')
    vi.clearAllMocks()
    const result = await engine.ingest(filePath)
    expect(result.updated).toBe(1)
  })

  it('reports errors for missing files', async () => {
    const result = await engine.ingest(join(tmpDir, 'nonexistent.txt'))
    expect(result.errors).toHaveLength(1)
  })
})
