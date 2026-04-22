// src/mcp/tools.ts
import type { Knowledge } from '../core/knowledge.js'
import type { SearchResult, ImpactReport, IngestResult } from '../types.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

type ToolResult = Pick<CallToolResult, 'content' | 'isError'>

export async function handleIngest(
  knowledge: Knowledge,
  params: { source: string | string[]; project?: string; tags?: Record<string, string | string[]> },
): Promise<ToolResult> {
  try {
    const options: Record<string, unknown> = {}
    if (params.project) options.project = params.project
    if (params.tags) options.tags = params.tags
    const result = await knowledge.ingest(params.source, options)
    return { content: [{ type: 'text', text: formatIngestResult(result) }] }
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Ingestion failed: ${err instanceof Error ? err.message : String(err)}` }] }
  }
}

export async function handleSearch(
  knowledge: Knowledge,
  params: { query: string; limit?: number; threshold?: number; filter?: Record<string, unknown> },
): Promise<ToolResult> {
  try {
    const options: Record<string, unknown> = { limit: params.limit ?? 10 }
    if (params.threshold) options.threshold = params.threshold
    if (params.filter) options.filter = params.filter
    const results = await knowledge.search(params.query, options)
    return { content: [{ type: 'text', text: formatSearchResults(results) }] }
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Search failed: ${err instanceof Error ? err.message : String(err)}` }] }
  }
}

export async function handleAnalyze(
  knowledge: Knowledge,
  params: { query: string; depth?: number; project?: string | string[]; includeIndirect?: boolean },
): Promise<ToolResult> {
  try {
    const options: Record<string, unknown> = {}
    if (params.depth !== undefined) options.depth = params.depth
    if (params.project) options.project = params.project
    if (params.includeIndirect !== undefined) options.includeIndirect = params.includeIndirect
    const report = await knowledge.analyze(params.query, options)
    return { content: [{ type: 'text', text: formatAnalyzeReport(report) }] }
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Analysis failed: ${err instanceof Error ? err.message : String(err)}` }] }
  }
}

export async function handleFindExisting(
  knowledge: Knowledge,
  params: { capability: string; filter?: Record<string, unknown> },
): Promise<ToolResult> {
  try {
    const options: Record<string, unknown> = {}
    if (params.filter) options.filter = params.filter
    const results = await knowledge.findExisting(params.capability, options)
    return { content: [{ type: 'text', text: formatSearchResults(results) }] }
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Find existing failed: ${err instanceof Error ? err.message : String(err)}` }] }
  }
}

export async function handleRelate(
  knowledge: Knowledge,
  params: { sourceId: string; targetId: string; type: string },
): Promise<ToolResult> {
  try {
    await knowledge.relate(params.sourceId, params.targetId, params.type as never)
    return { content: [{ type: 'text', text: `Relationship registered: ${params.sourceId} --[${params.type}]--> ${params.targetId}` }] }
  } catch (err) {
    return { isError: true, content: [{ type: 'text', text: `Relate failed: ${err instanceof Error ? err.message : String(err)}` }] }
  }
}

export function formatIngestResult(result: IngestResult): string {
  const parts = [`Ingestion complete: ${result.added} added, ${result.updated} updated, ${result.skipped} skipped`]
  if (result.errors.length > 0) {
    parts[0] += `, ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`
    parts.push('')
    parts.push('Errors:')
    for (const err of result.errors) {
      parts.push(`  - ${err.filePath}: ${err.error}`)
    }
  }
  return parts.join('\n')
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No results found.'
  const lines: string[] = [`Found ${results.length} result${results.length !== 1 ? 's' : ''}:`, '']
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const section = r.metadata.section ? ` > ${r.metadata.section}` : ''
    lines.push(`${i + 1}. [${r.score.toFixed(2)}] ${r.metadata.filePath}${section}`)
    const snippet = r.content.slice(0, 200).replace(/\n/g, ' ')
    lines.push(`   ${snippet}${r.content.length > 200 ? '...' : ''}`)
    lines.push('')
  }
  return lines.join('\n').trim()
}

export function formatAnalyzeReport(report: ImpactReport): string {
  const lines: string[] = [report.summary, '']
  if (report.directMatches.length > 0) {
    lines.push('Direct matches:')
    for (let i = 0; i < report.directMatches.length; i++) {
      const m = report.directMatches[i]
      const section = m.metadata.section ? ` > ${m.metadata.section}` : ''
      lines.push(`${i + 1}. [${m.score.toFixed(2)}] ${m.metadata.filePath}${section}`)
      const snippet = m.content.slice(0, 150).replace(/\n/g, ' ')
      lines.push(`   ${snippet}${m.content.length > 150 ? '...' : ''}`)
    }
    lines.push('')
  }
  if (report.relatedDocuments.length > 0) {
    lines.push('Related (via graph):')
    for (let i = 0; i < report.relatedDocuments.length; i++) {
      const rd = report.relatedDocuments[i]
      lines.push(`${i + 1}. ${rd.result.metadata.id} (${rd.relationship.type}, depth ${rd.depth})`)
    }
    lines.push('')
  }
  if (report.affectedTags && Object.keys(report.affectedTags).length > 0) {
    const tagParts = Object.entries(report.affectedTags)
      .map(([key, values]) => `${key}: ${values.join(', ')}`)
      .join('; ')
    lines.push(`Tags: ${tagParts}`)
    lines.push('')
  }
  return lines.join('\n').trim()
}
