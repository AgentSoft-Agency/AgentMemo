import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Relationship } from '../types.js'

export class RelationshipGraph {
  private relationships: Relationship[] = []
  private filePath: string

  constructor(storagePath: string) {
    this.filePath = join(storagePath, 'relationships.json')
  }

  async load(): Promise<void> {
    try {
      const data = await readFile(this.filePath, 'utf-8')
      this.relationships = JSON.parse(data)
    } catch {
      this.relationships = []
    }
  }

  async save(): Promise<void> {
    const dir = this.filePath.substring(0, this.filePath.lastIndexOf('/'))
    await mkdir(dir, { recursive: true })
    await writeFile(this.filePath, JSON.stringify(this.relationships, null, 2))
  }

  addRelationship(rel: Relationship): void {
    const exists = this.relationships.some(
      r => r.sourceId === rel.sourceId && r.targetId === rel.targetId && r.type === rel.type
    )
    if (!exists) {
      this.relationships.push(rel)
    }
  }

  getRelated(nodeId: string): Relationship[] {
    return this.relationships.filter(r => r.sourceId === nodeId || r.targetId === nodeId)
  }

  traverse(startIds: string[], depth: number): Relationship[] {
    const visited = new Set<string>(startIds)
    const result: Relationship[] = []
    let frontier = new Set(startIds)

    for (let d = 0; d < depth; d++) {
      const nextFrontier = new Set<string>()
      for (const nodeId of frontier) {
        const related = this.getRelated(nodeId)
        for (const rel of related) {
          const otherId = rel.sourceId === nodeId ? rel.targetId : rel.sourceId
          if (!visited.has(otherId)) {
            visited.add(otherId)
            nextFrontier.add(otherId)
            result.push(rel)
          }
        }
      }
      frontier = nextFrontier
    }

    return result
  }

  removeByNodeId(nodeId: string): void {
    this.relationships = this.relationships.filter(
      r => r.sourceId !== nodeId && r.targetId !== nodeId
    )
  }
}
