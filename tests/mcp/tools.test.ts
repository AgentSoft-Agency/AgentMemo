// tests/mcp/tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleIngest,
  handleSearch,
  handleAnalyze,
  handleFindExisting,
  handleRelate,
} from '../../src/mcp/tools.js'
import type { Knowledge } from '../../src/core/knowledge.js'

const mockKnowledge = {
  ingest: vi.fn(),
  search: vi.fn(),
  analyze: vi.fn(),
  findExisting: vi.fn(),
  relate: vi.fn(),
} as unknown as Knowledge

describe('Tool Handlers', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('handleIngest', () => {
    it('calls knowledge.ingest and returns formatted result', async () => {
      mockKnowledge.ingest = vi.fn().mockResolvedValue({ added: 3, updated: 1, skipped: 2, errors: [] })
      const result = await handleIngest(mockKnowledge, { source: '/docs' })
      expect(mockKnowledge.ingest).toHaveBeenCalledWith('/docs', {})
      expect(result.content[0].text).toContain('3 added')
      expect(result.content[0].text).toContain('1 updated')
    })

    it('passes project and tags overrides', async () => {
      mockKnowledge.ingest = vi.fn().mockResolvedValue({ added: 1, updated: 0, skipped: 0, errors: [] })
      await handleIngest(mockKnowledge, { source: '/docs', project: 'my-app', tags: { layer: 'api' } })
      expect(mockKnowledge.ingest).toHaveBeenCalledWith('/docs', { project: 'my-app', tags: { layer: 'api' } })
    })

    it('reports errors in output', async () => {
      mockKnowledge.ingest = vi.fn().mockResolvedValue({
        added: 0, updated: 0, skipped: 0,
        errors: [{ filePath: '/bad.md', error: 'read failed' }],
      })
      const result = await handleIngest(mockKnowledge, { source: '/bad.md' })
      expect(result.content[0].text).toContain('1 error')
      expect(result.content[0].text).toContain('/bad.md')
    })
  })

  describe('handleSearch', () => {
    it('calls knowledge.search and returns formatted results', async () => {
      mockKnowledge.search = vi.fn().mockResolvedValue([{
        content: 'JWT authentication for login',
        score: 0.92,
        metadata: { id: 'doc-1', project: 'auth', filePath: '/auth/README.md', section: 'Auth', tags: {}, checksum: 'abc' },
        chunk: { index: 0, total: 1 },
      }])
      const result = await handleSearch(mockKnowledge, { query: 'authentication' })
      expect(mockKnowledge.search).toHaveBeenCalledWith('authentication', { limit: 10 })
      expect(result.content[0].text).toContain('0.92')
      expect(result.content[0].text).toContain('/auth/README.md')
    })

    it('passes filter options', async () => {
      mockKnowledge.search = vi.fn().mockResolvedValue([])
      await handleSearch(mockKnowledge, { query: 'test', limit: 5, filter: { project: 'my-app' } })
      expect(mockKnowledge.search).toHaveBeenCalledWith('test', { limit: 5, filter: { project: 'my-app' } })
    })

    it('returns no results message when empty', async () => {
      mockKnowledge.search = vi.fn().mockResolvedValue([])
      const result = await handleSearch(mockKnowledge, { query: 'nonexistent' })
      expect(result.content[0].text).toContain('No results')
    })
  })

  describe('handleAnalyze', () => {
    it('calls knowledge.analyze and returns formatted report', async () => {
      mockKnowledge.analyze = vi.fn().mockResolvedValue({
        directMatches: [{
          content: 'User API endpoint', score: 0.9,
          metadata: { id: 'doc-1', project: 'users', filePath: '/api.yaml', section: 'GET /users', tags: {}, checksum: 'abc' },
          chunk: { index: 0, total: 1 },
        }],
        relatedDocuments: [],
        affectedProjects: ['users'],
        affectedTags: { layer: ['api'] },
        summary: 'Found 1 direct match, affecting 1 project (users) across 1 layer (api).',
      })
      const result = await handleAnalyze(mockKnowledge, { query: 'user endpoint' })
      expect(result.content[0].text).toContain('Found 1 direct match')
      expect(result.content[0].text).toContain('/api.yaml')
    })
  })

  describe('handleFindExisting', () => {
    it('calls knowledge.findExisting and returns formatted results', async () => {
      mockKnowledge.findExisting = vi.fn().mockResolvedValue([])
      const result = await handleFindExisting(mockKnowledge, { capability: 'payment processing' })
      expect(mockKnowledge.findExisting).toHaveBeenCalledWith('payment processing', {})
      expect(result.content[0].text).toContain('No results')
    })
  })

  describe('handleRelate', () => {
    it('calls knowledge.relate and returns success', async () => {
      mockKnowledge.relate = vi.fn().mockResolvedValue(undefined)
      const result = await handleRelate(mockKnowledge, { sourceId: 'a', targetId: 'b', type: 'consumes' })
      expect(mockKnowledge.relate).toHaveBeenCalledWith('a', 'b', 'consumes')
      expect(result.content[0].text).toContain('Relationship registered')
    })
  })

  describe('error handling', () => {
    it('returns error content on exception', async () => {
      mockKnowledge.ingest = vi.fn().mockRejectedValue(new Error('disk full'))
      const result = await handleIngest(mockKnowledge, { source: '/docs' })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('disk full')
    })
  })
})
