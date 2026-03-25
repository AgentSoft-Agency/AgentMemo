import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImpactAnalyzer } from '../../src/core/impact-analyzer.js'
import { SearchEngine } from '../../src/core/search-engine.js'
import { RelationshipGraph } from '../../src/core/relationship-graph.js'
import type { SearchResult } from '../../src/types.js'

function makeResult(id: string, project: string, layer: string): SearchResult {
  return {
    content: `content for ${id}`,
    score: 0.9,
    metadata: {
      id,
      project,
      filePath: `/path/${id}.md`,
      section: 'main',
      layer,
      entities: [],
      checksum: `checksum-${id}`,
    },
    chunk: { index: 0, total: 1 },
  }
}

describe('ImpactAnalyzer', () => {
  let graph: RelationshipGraph
  let searchEngine: SearchEngine
  let analyzer: ImpactAnalyzer

  beforeEach(() => {
    graph = new RelationshipGraph('/tmp/test-storage')
    searchEngine = {
      search: vi.fn(),
    } as unknown as SearchEngine
    analyzer = new ImpactAnalyzer(searchEngine, graph)
  })

  it('returns direct matches from vector search', async () => {
    const results = [makeResult('doc-1', 'projectA', 'domain')]
    vi.mocked(searchEngine.search).mockResolvedValue(results)

    const report = await analyzer.analyze('my query')

    expect(report.directMatches).toHaveLength(1)
    expect(report.directMatches[0].metadata.id).toBe('doc-1')
    expect(report.relatedDocuments).toHaveLength(0)
  })

  it('follows graph relationships to find related documents', async () => {
    const results = [makeResult('doc-1', 'projectA', 'domain')]
    vi.mocked(searchEngine.search).mockResolvedValue(results)

    graph.addRelationship({ sourceId: 'doc-1', targetId: 'doc-2', type: 'references' })

    const report = await analyzer.analyze('my query')

    expect(report.directMatches).toHaveLength(1)
    expect(report.relatedDocuments).toHaveLength(1)
    expect(report.relatedDocuments[0].relationship.targetId).toBe('doc-2')
  })

  it('lists affected projects and layers', async () => {
    const results = [
      makeResult('doc-1', 'projectA', 'domain'),
      makeResult('doc-2', 'projectB', 'application'),
    ]
    vi.mocked(searchEngine.search).mockResolvedValue(results)

    const report = await analyzer.analyze('my query')

    expect(report.affectedProjects).toContain('projectA')
    expect(report.affectedProjects).toContain('projectB')
    expect(report.affectedLayers).toContain('domain')
    expect(report.affectedLayers).toContain('application')
  })

  it('generates a summary string', async () => {
    const results = [makeResult('doc-1', 'projectA', 'domain')]
    vi.mocked(searchEngine.search).mockResolvedValue(results)

    const report = await analyzer.analyze('my query')

    expect(report.summary).toContain('1 direct match')
    expect(typeof report.summary).toBe('string')
  })

  it('respects depth option — depth 0 skips graph traversal', async () => {
    const results = [makeResult('doc-1', 'projectA', 'domain')]
    vi.mocked(searchEngine.search).mockResolvedValue(results)
    graph.addRelationship({ sourceId: 'doc-1', targetId: 'doc-2', type: 'references' })

    const report = await analyzer.analyze('my query', { depth: 0 })

    expect(report.relatedDocuments).toHaveLength(0)
  })
})
