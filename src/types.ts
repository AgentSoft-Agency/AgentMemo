export interface DocumentMetadata {
  id: string
  project: string
  filePath: string
  section: string
  tags: Record<string, string | string[]>
  checksum: string
}

export interface DocumentFilter {
  project?: string | string[]
  tags?: Record<string, string | string[]>
  filePath?: string
}

export interface VectorDocument {
  id: string
  vector: number[]
  metadata: DocumentMetadata
  content: string
}

export interface SearchOptions {
  limit?: number
  threshold?: number
  filter?: DocumentFilter
}

export interface SearchResult {
  content: string
  score: number
  metadata: DocumentMetadata
  chunk: { index: number; total: number }
}

export interface IngestOptions {
  project?: string
  tags?: Record<string, string | string[]>
}

export interface IngestResult {
  added: number
  updated: number
  skipped: number
  errors: { filePath: string; error: string }[]
}

export interface Chunk {
  content: string
  metadata: Partial<DocumentMetadata>
}

export type RelationshipType = string

export interface Relationship {
  sourceId: string
  targetId: string
  type: RelationshipType
  metadata?: Record<string, string>
}

export interface AnalyzeOptions {
  depth?: number
  project?: string | string[]
  includeIndirect?: boolean
}

export interface RelatedDocument {
  result: SearchResult
  relationship: Relationship
  depth: number
}

export interface ImpactReport {
  directMatches: SearchResult[]
  relatedDocuments: RelatedDocument[]
  affectedProjects: string[]
  affectedTags: Record<string, string[]>
  summary: string
}

export interface WatchOptions {
  ignored?: string[]
  debounceMs?: number
  autoRelate?: boolean
}

export interface Watcher {
  close(): Promise<void>
}

export interface ProjectConfig {
  name: string
  paths: string[]
}

export interface TagRule {
  pattern: string | RegExp
  tags: Record<string, string | string[]>
}

export interface VectorStoreConfig {
  path: string
  dimensions: number
}
