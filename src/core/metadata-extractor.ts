import { createHash } from 'node:crypto'
import type { DocumentMetadata, ProjectConfig } from '../types.js'

const LAYER_MAP: Record<string, string> = {
  'business_analysis': 'business',
  'business-analysis': 'business',
  'data_architecture': 'data',
  'data-architecture': 'data',
  'software_architecture': 'software-arch',
  'software-architecture': 'software-arch',
  'ux_ui_design': 'ux-ui',
  'ux-ui-design': 'ux-ui',
  'infrastructure': 'infrastructure',
  'api': 'api',
}

export class MetadataExtractor {
  constructor(private projects: ProjectConfig[]) {}

  extract(filePath: string, content: string, overrides?: { project?: string; layer?: string }): DocumentMetadata {
    const frontmatter = this.parseFrontmatter(content)
    const project = overrides?.project ?? frontmatter.project ?? this.detectProject(filePath)
    const layer = overrides?.layer ?? frontmatter.layer ?? this.detectLayer(filePath)
    const checksum = this.computeChecksum(content)

    return {
      id: this.generateId(filePath),
      project,
      filePath,
      section: '',
      layer,
      entities: [],
      checksum,
      ...(frontmatter.service && { service: frontmatter.service }),
      ...(frontmatter.capabilities && { capabilities: frontmatter.capabilities }),
      ...(frontmatter.boundedContext && { boundedContext: frontmatter.boundedContext }),
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

  private detectLayer(filePath: string): string {
    const lowerPath = filePath.toLowerCase()
    for (const [pattern, layer] of Object.entries(LAYER_MAP)) {
      if (lowerPath.includes(pattern)) return layer
    }
    return 'general'
  }

  private parseFrontmatter(content: string): Record<string, any> {
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return {}
    const result: Record<string, any> = {}
    for (const line of match[1].split('\n')) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim()
        result[key] = value
      }
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
