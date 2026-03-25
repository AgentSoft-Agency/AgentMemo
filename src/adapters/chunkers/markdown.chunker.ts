import type { ChunkingStrategy } from '../../ports/chunking-strategy.port.js'
import type { Chunk, DocumentMetadata } from '../../types.js'

interface HeadingNode {
  level: number
  title: string
  content: string
  start: number
}

export class MarkdownChunker implements ChunkingStrategy {
  supports(filePath: string): boolean {
    return /\.mdx?$/.test(filePath)
  }

  chunk(content: string, metadata: DocumentMetadata): Chunk[] {
    const headings = this.parseHeadings(content)
    if (headings.length === 0) {
      return [{ content, metadata: { filePath: metadata.filePath, project: metadata.project, layer: metadata.layer, section: '' } }]
    }

    const chunks: Chunk[] = []
    const headingStack: HeadingNode[] = []

    for (const heading of headings) {
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= heading.level) {
        headingStack.pop()
      }
      headingStack.push(heading)

      const ancestorPrefix = headingStack
        .map(h => '#'.repeat(h.level) + ' ' + h.title)
        .join('\n\n')

      const sectionPath = headingStack.map(h => h.title).join(' > ')

      const chunkContent = headingStack.length > 1
        ? ancestorPrefix + '\n\n' + heading.content
        : '#'.repeat(heading.level) + ' ' + heading.title + '\n\n' + heading.content

      if (heading.content.trim() || headingStack.length === 1) {
        chunks.push({
          content: chunkContent,
          metadata: {
            filePath: metadata.filePath,
            project: metadata.project,
            layer: metadata.layer,
            section: sectionPath,
          },
        })
      }
    }

    return chunks
  }

  private parseHeadings(content: string): HeadingNode[] {
    const lines = content.split('\n')
    const headings: HeadingNode[] = []
    let currentContent: string[] = []
    let currentHeading: HeadingNode | null = null

    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        if (currentHeading) {
          currentHeading.content = currentContent.join('\n').trim()
        }
        currentHeading = {
          level: match[1].length,
          title: match[2],
          content: '',
          start: 0,
        }
        headings.push(currentHeading)
        currentContent = []
      } else {
        currentContent.push(line)
      }
    }

    if (currentHeading) {
      currentHeading.content = currentContent.join('\n').trim()
    }

    return headings
  }
}
