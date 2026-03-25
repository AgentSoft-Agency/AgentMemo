import type {
  IngestOptions, IngestResult, SearchOptions, SearchResult,
  AnalyzeOptions, ImpactReport, WatchOptions, Watcher as WatcherInterface,
  ProjectConfig, RelationshipType, TagRule,
} from '../types.js'
import type { VectorStore } from '../ports/vector-store.port.js'
import type { EmbeddingProvider } from '../ports/embedding-provider.port.js'
import type { ChunkingStrategy } from '../ports/chunking-strategy.port.js'
import { LanceDBAdapter } from '../adapters/vector-stores/lancedb.adapter.js'
import { MarkdownChunker } from '../adapters/chunkers/markdown.chunker.js'
import { OpenAPIChunker } from '../adapters/chunkers/openapi.chunker.js'
import { CodeChunker } from '../adapters/chunkers/code.chunker.js'
import { PlainTextChunker } from '../adapters/chunkers/plaintext.chunker.js'
import { DocumentRegistry } from './document-registry.js'
import { RelationshipGraph } from './relationship-graph.js'
import { MetadataExtractor } from './metadata-extractor.js'
import { IngestionEngine } from './ingestion-engine.js'
import { SearchEngine } from './search-engine.js'
import { ImpactAnalyzer } from './impact-analyzer.js'
import { FileWatcher } from './watcher.js'
import { mkdir } from 'node:fs/promises'

export interface MemoConfig {
  storagePath: string
  vectorStore?: VectorStore
  embedding?: EmbeddingProvider
  chunkers?: ChunkingStrategy[]
  projects?: ProjectConfig[]
  tagRules?: TagRule[]
}

export class Memo {
  private ingestionEngine: IngestionEngine
  private searchEngine: SearchEngine
  private impactAnalyzer: ImpactAnalyzer
  private graph: RelationshipGraph
  private registry: DocumentRegistry
  private vectorStore: VectorStore
  private watchers: FileWatcher[] = []

  constructor(
    vectorStore: VectorStore, embedding: EmbeddingProvider, chunkers: ChunkingStrategy[],
    registry: DocumentRegistry, graph: RelationshipGraph, extractor: MetadataExtractor,
  ) {
    this.vectorStore = vectorStore
    this.registry = registry
    this.graph = graph
    this.ingestionEngine = new IngestionEngine(vectorStore, embedding, chunkers, registry, extractor)
    this.searchEngine = new SearchEngine(vectorStore, embedding)
    this.impactAnalyzer = new ImpactAnalyzer(this.searchEngine, graph)
  }

  async ingest(source: string | string[], options?: IngestOptions): Promise<IngestResult> {
    return this.ingestionEngine.ingest(source, options)
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    return this.searchEngine.search(query, options)
  }

  async analyze(query: string, options?: AnalyzeOptions): Promise<ImpactReport> {
    return this.impactAnalyzer.analyze(query, options)
  }

  async findExisting(capability: string, options?: SearchOptions): Promise<SearchResult[]> {
    return this.searchEngine.search(capability, { ...options, filter: { ...options?.filter } })
  }

  async relate(sourceId: string, targetId: string, type: RelationshipType): Promise<void> {
    this.graph.addRelationship({ sourceId, targetId, type })
    await this.graph.save()
  }

  watch(paths: string | string[], options?: WatchOptions): WatcherInterface {
    const pathArray = Array.isArray(paths) ? paths : [paths]
    const watcher = new FileWatcher(
      pathArray,
      (filePath) => { this.ingest(filePath).catch(() => {}) },
      (filePath) => { this.handleDelete(filePath).catch(() => {}) },
      options,
    )
    this.watchers.push(watcher)
    return watcher
  }

  async dispose(): Promise<void> {
    for (const watcher of this.watchers) await watcher.close()
    this.watchers = []
    await this.vectorStore.dispose()
  }

  private async handleDelete(filePath: string): Promise<void> {
    const chunkIds = this.registry.getChunkIds(filePath)
    if (chunkIds.length > 0) {
      await this.vectorStore.delete({ filePath })
      for (const id of chunkIds) this.graph.removeByNodeId(id)
      this.registry.remove(filePath)
      await this.registry.save()
      await this.graph.save()
    }
  }
}

export async function createMemo(config: MemoConfig): Promise<Memo> {
  await mkdir(config.storagePath, { recursive: true })
  const vectorStore = config.vectorStore ?? new LanceDBAdapter()
  const embedding = config.embedding ?? await getDefaultEmbedding()
  const chunkers = config.chunkers ?? [
    new MarkdownChunker(), new OpenAPIChunker(), new CodeChunker(), new PlainTextChunker(),
  ]
  await vectorStore.initialize({ path: config.storagePath, dimensions: embedding.dimensions() })
  const registry = new DocumentRegistry(config.storagePath)
  await registry.load()
  const graph = new RelationshipGraph(config.storagePath)
  await graph.load()
  const extractor = new MetadataExtractor(config.projects ?? [], config.tagRules ?? [])
  return new Memo(vectorStore, embedding, chunkers, registry, graph, extractor)
}

async function getDefaultEmbedding(): Promise<EmbeddingProvider> {
  const { TransformersAdapter } = await import('../adapters/embeddings/transformers.adapter.js')
  return new TransformersAdapter()
}
