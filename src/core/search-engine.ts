import type { VectorStore } from '../ports/vector-store.port.js'
import type { EmbeddingProvider } from '../ports/embedding-provider.port.js'
import type { SearchOptions, SearchResult } from '../types.js'

export class SearchEngine {
  constructor(private vectorStore: VectorStore, private embedding: EmbeddingProvider) {}

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const vector = await this.embedding.embed(query)
    const searchOptions: SearchOptions = {
      limit: options?.limit ?? 10,
      ...(options?.threshold && { threshold: options.threshold }),
      ...(options?.filter && { filter: options.filter }),
    }
    return this.vectorStore.search(vector, searchOptions)
  }
}
