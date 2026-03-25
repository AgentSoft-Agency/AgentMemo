export type {
  DocumentMetadata,
  DocumentFilter,
  VectorDocument,
  SearchOptions,
  SearchResult,
  IngestOptions,
  IngestResult,
  Chunk,
  Relationship,
  RelationshipType,
  AnalyzeOptions,
  RelatedDocument,
  ImpactReport,
  WatchOptions,
  Watcher,
  ProjectConfig,
  TagRule,
  VectorStoreConfig,
} from './types.js'

export type { VectorStore } from './ports/vector-store.port.js'
export type { EmbeddingProvider } from './ports/embedding-provider.port.js'
export type { ChunkingStrategy } from './ports/chunking-strategy.port.js'

// Adapters (exported for custom wiring)
export { LanceDBAdapter } from './adapters/vector-stores/lancedb.adapter.js'
export { TransformersAdapter } from './adapters/embeddings/transformers.adapter.js'
export { OpenAIAdapter } from './adapters/embeddings/openai.adapter.js'
export { MarkdownChunker } from './adapters/chunkers/markdown.chunker.js'
export { OpenAPIChunker } from './adapters/chunkers/openapi.chunker.js'
export { CodeChunker } from './adapters/chunkers/code.chunker.js'
export { PlainTextChunker } from './adapters/chunkers/plaintext.chunker.js'

// Factory
export { createMemo } from './core/memo.js'
