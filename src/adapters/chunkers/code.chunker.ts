import type { ChunkingStrategy } from '../../ports/chunking-strategy.port.js'
import type { Chunk, DocumentMetadata } from '../../types.js'

const CODE_EXTENSIONS = /\.(ts|tsx|js|jsx|py|go|rs|java|kt|cs|rb)$/
const DECLARATION_PATTERN = /^(?:export\s+)?(?:abstract\s+)?(?:class|function|interface|type|enum|const|async\s+function)\s+(\w+)/

export class CodeChunker implements ChunkingStrategy {
  supports(filePath: string): boolean {
    return CODE_EXTENSIONS.test(filePath)
  }

  chunk(content: string, metadata: DocumentMetadata): Chunk[] {
    const lines = content.split('\n')
    const boundaries: { name: string; startLine: number }[] = []

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(DECLARATION_PATTERN)
      if (match) {
        boundaries.push({ name: match[1], startLine: i })
      }
    }

    if (boundaries.length === 0) {
      return [{ content, metadata: { filePath: metadata.filePath, project: metadata.project, tags: { ...metadata.tags } } }]
    }

    const chunks: Chunk[] = []
    for (let i = 0; i < boundaries.length; i++) {
      const start = boundaries[i].startLine
      const end = i + 1 < boundaries.length ? boundaries[i + 1].startLine : lines.length
      const chunkContent = lines.slice(start, end).join('\n').trim()

      chunks.push({
        content: chunkContent,
        metadata: {
          filePath: metadata.filePath,
          project: metadata.project,
          tags: { ...metadata.tags, entities: [boundaries[i].name] },
          section: boundaries[i].name,
        },
      })
    }

    return chunks
  }
}
