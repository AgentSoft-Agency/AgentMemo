// src/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { Memo } from '../core/memo.js'
import { handleIngest, handleSearch, handleAnalyze, handleFindExisting, handleRelate } from './tools.js'

export function createMcpServer(memo: Memo, version: string): McpServer {
  const server = new McpServer(
    { name: 'agent-memo', version },
    {
      instructions: 'agent-memo provides semantic search over project documentation. Use memo_search to find relevant docs, memo_ingest to add new docs, memo_analyze for cross-project impact analysis, memo_find_existing to discover existing service capabilities, and memo_relate to register dependencies between documents.',
    },
  )

  server.registerTool(
    'memo_ingest',
    {
      description: 'Ingest files or directories into the knowledge base. Supports markdown, OpenAPI YAML/JSON, and code files. Uses checksums for incremental sync — unchanged files are skipped on re-ingest.',
      inputSchema: {
        source: z.union([z.string(), z.array(z.string())]).describe('File paths, directory paths, or glob patterns to ingest'),
        project: z.string().optional().describe('Override auto-detected project name'),
        layer: z.string().optional().describe('Override auto-detected layer (business, data, software-arch, ux-ui, api, infrastructure)'),
      },
    },
    async (params) => handleIngest(memo, params),
  )

  server.registerTool(
    'memo_search',
    {
      description: 'Semantic search across ingested documentation. Returns ranked results with file paths, scores, and content snippets. Use filters to narrow by project, layer, or service.',
      inputSchema: {
        query: z.string().describe('Natural language search query'),
        limit: z.number().int().min(1).max(50).default(10).describe('Maximum number of results'),
        threshold: z.number().min(0).max(1).optional().describe('Minimum similarity score (0-1)'),
        filter: z.object({
          project: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by project name(s)'),
          layer: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by layer(s)'),
          service: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by service name(s)'),
        }).optional().describe('Metadata filters'),
      },
    },
    async (params) => handleSearch(memo, params),
  )

  server.registerTool(
    'memo_analyze',
    {
      description: 'Cross-project impact analysis. Combines semantic search with relationship graph traversal to show blast radius of a change. Returns affected projects, layers, and related documents.',
      inputSchema: {
        query: z.string().describe('What change or topic to analyze'),
        depth: z.number().int().min(0).max(5).default(2).describe('Relationship traversal depth'),
        project: z.union([z.string(), z.array(z.string())]).optional().describe('Limit analysis to specific project(s)'),
        includeIndirect: z.boolean().default(true).describe('Follow transitive relationships'),
      },
    },
    async (params) => handleAnalyze(memo, params),
  )

  server.registerTool(
    'memo_find_existing',
    {
      description: 'Discover existing service capabilities to prevent building duplicate functionality. Searches by capability description and returns matching services/modules. Use this before creating new services or endpoints.',
      inputSchema: {
        capability: z.string().describe('Capability description (e.g., "JWT authentication", "payment processing")'),
        filter: z.object({
          project: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by project name(s)'),
          layer: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by layer(s)'),
          service: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by service name(s)'),
        }).optional().describe('Metadata filters'),
      },
    },
    async (params) => handleFindExisting(memo, params),
  )

  server.registerTool(
    'memo_relate',
    {
      description: 'Register an explicit dependency between two documents/chunks. Use IDs from search results. This enriches impact analysis by adding known relationships that vector similarity alone cannot detect.',
      inputSchema: {
        sourceId: z.string().describe('Source document/chunk ID (from search result metadata.id)'),
        targetId: z.string().describe('Target document/chunk ID (from search result metadata.id)'),
        type: z.enum(['consumes', 'implements', 'extends', 'references', 'tests']).describe('Relationship type'),
      },
    },
    async (params) => handleRelate(memo, params),
  )

  return server
}
