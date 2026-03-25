import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LanceDBAdapter } from '../../src/adapters/vector-stores/lancedb.adapter.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { VectorDocument, DocumentMetadata } from '../../src/types.js'

const makeMeta = (overrides: Partial<DocumentMetadata> = {}): DocumentMetadata => ({
  id: 'doc-1',
  project: 'test',
  filePath: '/test/file.md',
  section: 'intro',
  layer: 'business',
  entities: [],
  checksum: 'abc',
  ...overrides,
})

const makeDoc = (id: string, vector: number[]): VectorDocument => ({
  id,
  vector,
  metadata: makeMeta({ id }),
  content: `Content for ${id}`,
})

describe('LanceDBAdapter', () => {
  let tmpDir: string
  let adapter: LanceDBAdapter

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'lance-test-'))
    adapter = new LanceDBAdapter()
    await adapter.initialize({ path: tmpDir, dimensions: 4 })
  })

  afterEach(async () => {
    await adapter.dispose()
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('adds documents and searches by vector', async () => {
    await adapter.addDocuments([
      makeDoc('doc-1', [1, 0, 0, 0]),
      makeDoc('doc-2', [0, 1, 0, 0]),
    ])
    const results = await adapter.search([1, 0, 0, 0], { limit: 1 })
    expect(results).toHaveLength(1)
    expect(results[0].metadata.id).toBe('doc-1')
  })

  it('filters by project', async () => {
    await adapter.addDocuments([
      makeDoc('doc-1', [1, 0, 0, 0]),
      { ...makeDoc('doc-2', [1, 0, 0, 0]), metadata: makeMeta({ id: 'doc-2', project: 'other' }) },
    ])
    const results = await adapter.search([1, 0, 0, 0], {
      limit: 10,
      filter: { project: 'test' },
    })
    expect(results.every(r => r.metadata.project === 'test')).toBe(true)
  })

  it('deletes documents by filter', async () => {
    await adapter.addDocuments([makeDoc('doc-1', [1, 0, 0, 0])])
    await adapter.delete({ project: 'test' })
    const results = await adapter.search([1, 0, 0, 0], { limit: 10 })
    expect(results).toHaveLength(0)
  })
})
