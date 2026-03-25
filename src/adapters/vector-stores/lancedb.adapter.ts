import * as lancedb from '@lancedb/lancedb'
import type { VectorStore } from '../../ports/vector-store.port.js'
import type {
  VectorDocument,
  SearchOptions,
  SearchResult,
  DocumentFilter,
  VectorStoreConfig,
} from '../../types.js'

export class LanceDBAdapter implements VectorStore {
  private db!: lancedb.Connection
  private table: lancedb.Table | null = null
  private dimensions!: number

  async initialize(config: VectorStoreConfig): Promise<void> {
    this.dimensions = config.dimensions
    this.db = await lancedb.connect(config.path)
    try {
      this.table = await this.db.openTable('documents')
    } catch {
      this.table = null
    }
  }

  async addDocuments(docs: VectorDocument[]): Promise<void> {
    const rows = docs.map(doc => ({
      id: doc.id,
      vector: doc.vector,
      content: doc.content,
      project: doc.metadata.project,
      filePath: doc.metadata.filePath,
      section: doc.metadata.section,
      tags: JSON.stringify(doc.metadata.tags),
      checksum: doc.metadata.checksum,
    }))

    if (!this.table) {
      this.table = await this.db.createTable('documents', rows)
    } else {
      await this.table.add(rows)
    }
  }

  async search(query: number[], options: SearchOptions): Promise<SearchResult[]> {
    if (!this.table) return []

    let vectorQuery = this.table.vectorSearch(query)

    if (options.limit) {
      vectorQuery = vectorQuery.limit(options.limit)
    }

    if (options.filter) {
      const where = this.buildWhereClause(options.filter)
      if (where) {
        vectorQuery = vectorQuery.where(where)
      }
    }

    const results = await vectorQuery.toArray()

    return results
      .filter(row => !options.threshold || (1 - (row._distance ?? 1)) >= options.threshold)
      .map(row => ({
        content: row.content as string,
        score: 1 - (row._distance ?? 0),
        metadata: {
          id: row.id as string,
          project: row.project as string,
          filePath: row.filePath as string,
          section: row.section as string,
          tags: JSON.parse(row.tags as string),
          checksum: row.checksum as string,
        },
        chunk: { index: 0, total: 1 },
      }))
  }

  async delete(filter: DocumentFilter): Promise<void> {
    if (!this.table) return
    const where = this.buildWhereClause(filter)
    if (where) {
      await this.table.delete(where)
    }
  }

  async dispose(): Promise<void> {
    this.table = null
  }

  private buildWhereClause(filter: DocumentFilter): string | null {
    const conditions: string[] = []

    if (filter.project) {
      const projects = Array.isArray(filter.project) ? filter.project : [filter.project]
      conditions.push(`project IN (${projects.map(p => `'${p}'`).join(', ')})`)
    }
    if (filter.tags) {
      for (const [key, value] of Object.entries(filter.tags)) {
        const values = Array.isArray(value) ? value : [value]
        for (const v of values) {
          conditions.push(`tags LIKE '%"${key}":"${v}"%'`)
        }
      }
    }
    if (filter.filePath) {
      conditions.push(`filePath LIKE '${filter.filePath.replace(/\*/g, '%')}'`)
    }

    return conditions.length > 0 ? conditions.join(' AND ') : null
  }
}
