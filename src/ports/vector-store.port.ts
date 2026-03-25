import type { VectorDocument, SearchOptions, SearchResult, DocumentFilter, VectorStoreConfig } from '../types.js'

export interface VectorStore {
  initialize(config: VectorStoreConfig): Promise<void>
  addDocuments(docs: VectorDocument[]): Promise<void>
  search(query: number[], options: SearchOptions): Promise<SearchResult[]>
  delete(filter: DocumentFilter): Promise<void>
  dispose(): Promise<void>
}
