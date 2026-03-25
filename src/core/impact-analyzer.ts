import type { AnalyzeOptions, ImpactReport, RelatedDocument, SearchOptions } from '../types.js'
import { SearchEngine } from './search-engine.js'
import { RelationshipGraph } from './relationship-graph.js'

export class ImpactAnalyzer {
  constructor(private searchEngine: SearchEngine, private graph: RelationshipGraph) {}

  async analyze(query: string, options?: AnalyzeOptions): Promise<ImpactReport> {
    const depth = options?.depth ?? 2
    const searchOpts: SearchOptions = {}
    if (options?.project) searchOpts.filter = { project: options.project as string }

    const directMatches = await this.searchEngine.search(query, searchOpts)
    const relatedDocuments: RelatedDocument[] = []

    if (depth > 0 && directMatches.length > 0) {
      const startIds = directMatches.map(m => m.metadata.id)
      const relationships = this.graph.traverse(startIds, depth)
      for (const rel of relationships) {
        const relatedId = startIds.includes(rel.sourceId) ? rel.targetId : rel.sourceId
        relatedDocuments.push({
          result: {
            content: '',
            score: 0,
            metadata: { id: relatedId, project: '', filePath: '', section: '', layer: '', entities: [], checksum: '' },
            chunk: { index: 0, total: 1 },
          },
          relationship: rel,
          depth: 1,
        })
      }
    }

    const allResults = [...directMatches, ...relatedDocuments.map(r => r.result)]
    const affectedProjects = [...new Set(allResults.map(r => r.metadata.project).filter(Boolean))]
    const affectedLayers = [...new Set(allResults.map(r => r.metadata.layer).filter(Boolean))]

    return {
      directMatches,
      relatedDocuments,
      affectedProjects,
      affectedLayers,
      summary: this.generateSummary(directMatches.length, relatedDocuments.length, affectedProjects, affectedLayers),
    }
  }

  private generateSummary(directCount: number, relatedCount: number, projects: string[], layers: string[]): string {
    const parts: string[] = []
    parts.push(`Found ${directCount} direct match${directCount !== 1 ? 'es' : ''}`)
    if (relatedCount > 0) parts.push(`${relatedCount} related document${relatedCount !== 1 ? 's' : ''}`)
    if (projects.length > 0) parts.push(`affecting ${projects.length} project${projects.length !== 1 ? 's' : ''} (${projects.join(', ')})`)
    if (layers.length > 0) parts.push(`across ${layers.length} layer${layers.length !== 1 ? 's' : ''} (${layers.join(', ')})`)
    return parts.join(', ') + '.'
  }
}
