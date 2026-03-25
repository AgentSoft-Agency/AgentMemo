import { describe, it, expect, vi } from 'vitest'
import { SearchEngine } from '../../src/core/search-engine.js'
import type { VectorStore } from '../../src/ports/vector-store.port.js'
import type { EmbeddingProvider } from '../../src/ports/embedding-provider.port.js'
import type { SearchResult } from '../../src/types.js'

const mockResult: SearchResult = {
  content: 'test content',
  score: 0.9,
  metadata: {
    id: 'doc-1',
    project: 'myproject',
    filePath: '/path/to/doc.md',
    section: 'intro',
    tags: {},
    checksum: 'abc123',
  },
  chunk: { index: 0, total: 1 },
}

const mockEmbedding: EmbeddingProvider = {
  embed: vi.fn(async () => [0.1, 0.2, 0.3, 0.4]),
  embedBatch: vi.fn(async (texts) => texts.map(() => [0.1, 0.2, 0.3, 0.4])),
  dimensions: () => 4,
}

const mockStore: VectorStore = {
  initialize: vi.fn(async () => {}),
  addDocuments: vi.fn(async () => {}),
  search: vi.fn(async () => [mockResult]),
  delete: vi.fn(async () => {}),
  dispose: vi.fn(async () => {}),
}

describe('SearchEngine', () => {
  it('embeds the query and calls vector store search', async () => {
    const engine = new SearchEngine(mockStore, mockEmbedding)
    const results = await engine.search('my query')
    expect(mockEmbedding.embed).toHaveBeenCalledWith('my query')
    expect(mockStore.search).toHaveBeenCalledWith([0.1, 0.2, 0.3, 0.4], expect.any(Object))
    expect(results).toHaveLength(1)
    expect(results[0].content).toBe('test content')
  })

  it('passes search options to the vector store', async () => {
    const engine = new SearchEngine(mockStore, mockEmbedding)
    await engine.search('query', { limit: 5, threshold: 0.7, filter: { project: 'myproject' } })
    expect(mockStore.search).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ limit: 5, threshold: 0.7, filter: { project: 'myproject' } }),
    )
  })

  it('uses a default limit of 10 when no options provided', async () => {
    const engine = new SearchEngine(mockStore, mockEmbedding)
    await engine.search('query')
    expect(mockStore.search).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ limit: 10 }),
    )
  })
})
