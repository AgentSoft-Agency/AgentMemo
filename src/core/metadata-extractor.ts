import { createHash } from 'node:crypto'
import type { DocumentMetadata, ProjectConfig, TagRule } from '../types.js'

export class MetadataExtractor {
  constructor(
    private projects: ProjectConfig[],
    private tagRules: TagRule[] = [],
  ) {}

  extract(
    filePath: string,
    content: string,
    overrides?: { project?: string; tags?: Record<string, string | string[]> },
  ): DocumentMetadata {
    const frontmatter = this.parseFrontmatter(content)
    const project = overrides?.project ?? frontmatter.project ?? this.detectProject(filePath)
    const checksum = this.computeChecksum(content)

    // Build tags: tag rules first, frontmatter wins, overrides win
    const tags: Record<string, string | string[]> = {}

    // 1. Apply tag rules (lowest priority)
    for (const rule of this.tagRules) {
      const pattern = rule.pattern instanceof RegExp
        ? rule.pattern
        : new RegExp(rule.pattern, 'i')
      if (pattern.test(filePath)) {
        Object.assign(tags, rule.tags)
      }
    }

    // 2. Frontmatter tags (override rules)
    if (frontmatter.tags && typeof frontmatter.tags === 'object') {
      Object.assign(tags, frontmatter.tags)
    }

    // 3. Explicit overrides (highest priority)
    if (overrides?.tags) {
      Object.assign(tags, overrides.tags)
    }

    return {
      id: this.generateId(filePath),
      project,
      filePath,
      section: '',
      tags,
      checksum,
    }
  }

  private detectProject(filePath: string): string {
    for (const project of this.projects) {
      for (const projectPath of project.paths) {
        if (filePath.startsWith(projectPath)) {
          return project.name
        }
      }
    }
    return 'unknown'
  }

  private parseFrontmatter(content: string): Record<string, any> {
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return {}
    const result: Record<string, any> = {}
    let inTags = false
    const tagsObj: Record<string, string> = {}

    for (const line of match[1].split('\n')) {
      if (line === 'tags:') {
        inTags = true
        continue
      }
      if (inTags) {
        const tagMatch = line.match(/^\s+(\w+):\s*(.+)$/)
        if (tagMatch) {
          tagsObj[tagMatch[1]] = tagMatch[2]
          continue
        } else {
          inTags = false
        }
      }
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim()
        if (value) result[key] = value
      }
    }

    if (Object.keys(tagsObj).length > 0) {
      result.tags = tagsObj
    }

    return result
  }

  private computeChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 16)
  }

  private generateId(filePath: string): string {
    return createHash('sha256').update(filePath).digest('hex').slice(0, 12)
  }
}
