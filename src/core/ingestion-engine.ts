import { readFile, stat, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { glob } from 'glob'
import type { VectorStore } from '../ports/vector-store.port.js'
import type { EmbeddingProvider } from '../ports/embedding-provider.port.js'
import type { ChunkingStrategy } from '../ports/chunking-strategy.port.js'
import type { IngestOptions, IngestResult, VectorDocument } from '../types.js'
import { DocumentRegistry } from './document-registry.js'
import { MetadataExtractor } from './metadata-extractor.js'

export class IngestionEngine {
  constructor(
    private vectorStore: VectorStore,
    private embedding: EmbeddingProvider,
    private chunkers: ChunkingStrategy[],
    private registry: DocumentRegistry,
    private extractor: MetadataExtractor,
  ) {}

  async ingest(source: string | string[], options?: IngestOptions): Promise<IngestResult> {
    const sources = Array.isArray(source) ? source : [source]
    const result: IngestResult = { added: 0, updated: 0, skipped: 0, errors: [] }
    const filePaths = await this.resolveFiles(sources)

    for (const filePath of filePaths) {
      try {
        const content = await readFile(filePath, 'utf-8')
        const metadata = this.extractor.extract(filePath, content, options)

        if (!this.registry.hasChanged(filePath, metadata.checksum)) {
          result.skipped++
          continue
        }

        const isUpdate = this.registry.getChecksum(filePath) !== null

        if (isUpdate) {
          const oldChunkIds = this.registry.getChunkIds(filePath)
          if (oldChunkIds.length > 0) {
            await this.vectorStore.delete({ filePath })
          }
        }

        const chunker = this.chunkers.find(c => c.supports(filePath)) ?? this.chunkers[this.chunkers.length - 1]
        const chunks = chunker.chunk(content, metadata)
        const texts = chunks.map(c => c.content)
        const vectors = await this.embedding.embedBatch(texts)

        const docs: VectorDocument[] = chunks.map((chunk, i) => ({
          id: `${metadata.id}-${i}`,
          vector: vectors[i],
          content: chunk.content,
          metadata: { ...metadata, ...chunk.metadata, id: `${metadata.id}-${i}` },
        }))

        await this.vectorStore.addDocuments(docs)
        this.registry.register(filePath, metadata.checksum, docs.map(d => d.id))
        await this.registry.save()

        if (isUpdate) result.updated++
        else result.added++
      } catch (err) {
        result.errors.push({ filePath, error: err instanceof Error ? err.message : String(err) })
      }
    }
    return result
  }

  private async resolveFiles(sources: string[]): Promise<string[]> {
    const files: string[] = []
    for (const source of sources) {
      try {
        const resolved = resolve(source)
        const stats = await stat(resolved)
        if (stats.isDirectory()) {
          files.push(...await this.walkDir(resolved))
        } else if (stats.isFile()) {
          files.push(resolved)
        }
      } catch {
        // Try as glob pattern — if no matches, treat as a missing file path
        const matches = await glob(source, { absolute: true })
        if (matches.length > 0) {
          files.push(...matches)
        } else {
          // Not a glob — push the raw path so it will error during readFile
          files.push(resolve(source))
        }
      }
    }
    return [...new Set(files)]
  }

  private async walkDir(dir: string): Promise<string[]> {
    const files: string[] = []
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          files.push(...await this.walkDir(fullPath))
        }
      } else if (entry.isFile()) {
        files.push(fullPath)
      }
    }
    return files
  }
}
