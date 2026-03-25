// tests/mcp/tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleIngest,
  handleSearch,
  handleAnalyze,
  handleFindExisting,
  handleRelate,
} from '../../src/mcp/tools.js'
import type { Memo } from '../../src/core/memo.js'

const mockMemo = {
  ingest: vi.fn(),
  search: vi.fn(),
  analyze: vi.fn(),
  findExisting: vi.fn(),
  relate: vi.fn(),
} as unknown as Memo

describe('Tool Handlers', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('handleIngest', () => {
    it('calls memo.ingest and returns formatted result', async () => {
      mockMemo.ingest = vi.fn().mockResolvedValue({ added: 3, updated: 1, skipped: 2, errors: [] })
      const result = await handleIngest(mockMemo, { source: '/docs' })
      expect(mockMemo.ingest).toHaveBeenCalledWith('/docs', {})
      expect(result.content[0].text).toContain('3 added')
      expect(result.content[0].text).toContain('1 updated')
    })

    it('passes project and layer overrides', async () => {
      mockMemo.ingest = vi.fn().mockResolvedValue({ added: 1, updated: 0, skipped: 0, errors: [] })
      await handleIngest(mockMemo, { source: '/docs', project: 'my-app', layer: 'api' })
      expect(mockMemo.ingest).toHaveBeenCalledWith('/docs', { project: 'my-app', layer: 'api' })
    })

    it('reports errors in output', async () => {
      mockMemo.ingest = vi.fn().mockResolvedValue({
        added: 0, updated: 0, skipped: 0,
        errors: [{ filePath: '/bad.md', error: 'read failed' }],
      })
      const result = await handleIngest(mockMemo, { source: '/bad.md' })
      expect(result.content[0].text).toContain('1 error')
      expect(result.content[0].text).toContain('/bad.md')
    })
  })

  describe('handleSearch', () => {
    it('calls memo.search and returns formatted results', async () => {
      mockMemo.search = vi.fn().mockResolvedValue([{
        content: 'JWT authentication for login',
        score: 0.92,
        metadata: { id: 'doc-1', project: 'auth', filePath: '/auth/README.md', section: 'Auth', layer: 'api', entities: [], checksum: 'abc' },
        chunk: { index: 0, total: 1 },
      }])
      const result = await handleSearch(mockMemo, { query: 'authentication' })
      expect(mockMemo.search).toHaveBeenCalledWith('authentication', { limit: 10 })
      expect(result.content[0].text).toContain('0.92')
      expect(result.content[0].text).toContain('/auth/README.md')
    })

    it('passes filter options', async () => {
      mockMemo.search = vi.fn().mockResolvedValue([])
      await handleSearch(mockMemo, { query: 'test', limit: 5, filter: { project: 'my-app' } })
      expect(mockMemo.search).toHaveBeenCalledWith('test', { limit: 5, filter: { project: 'my-app' } })
    })

    it('returns no results message when empty', async () => {
      mockMemo.search = vi.fn().mockResolvedValue([])
      const result = await handleSearch(mockMemo, { query: 'nonexistent' })
      expect(result.content[0].text).toContain('No results')
    })
  })

  describe('handleAnalyze', () => {
    it('calls memo.analyze and returns formatted report', async () => {
      mockMemo.analyze = vi.fn().mockResolvedValue({
        directMatches: [{
          content: 'User API endpoint', score: 0.9,
          metadata: { id: 'doc-1', project: 'users', filePath: '/api.yaml', section: 'GET /users', layer: 'api', entities: [], checksum: 'abc' },
          chunk: { index: 0, total: 1 },
        }],
        relatedDocuments: [],
        affectedProjects: ['users'],
        affectedLayers: ['api'],
        summary: 'Found 1 direct match, affecting 1 project (users) across 1 layer (api).',
      })
      const result = await handleAnalyze(mockMemo, { query: 'user endpoint' })
      expect(result.content[0].text).toContain('Found 1 direct match')
      expect(result.content[0].text).toContain('/api.yaml')
    })
  })

  describe('handleFindExisting', () => {
    it('calls memo.findExisting and returns formatted results', async () => {
      mockMemo.findExisting = vi.fn().mockResolvedValue([])
      const result = await handleFindExisting(mockMemo, { capability: 'payment processing' })
      expect(mockMemo.findExisting).toHaveBeenCalledWith('payment processing', {})
      expect(result.content[0].text).toContain('No results')
    })
  })

  describe('handleRelate', () => {
    it('calls memo.relate and returns success', async () => {
      mockMemo.relate = vi.fn().mockResolvedValue(undefined)
      const result = await handleRelate(mockMemo, { sourceId: 'a', targetId: 'b', type: 'consumes' })
      expect(mockMemo.relate).toHaveBeenCalledWith('a', 'b', 'consumes')
      expect(result.content[0].text).toContain('Relationship registered')
    })
  })

  describe('error handling', () => {
    it('returns error content on exception', async () => {
      mockMemo.ingest = vi.fn().mockRejectedValue(new Error('disk full'))
      const result = await handleIngest(mockMemo, { source: '/docs' })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('disk full')
    })
  })
})
