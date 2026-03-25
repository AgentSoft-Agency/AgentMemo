import type { ChunkingStrategy } from '../../ports/chunking-strategy.port.js'
import type { Chunk, DocumentMetadata } from '../../types.js'

const DEFAULT_CHUNK_SIZE = 800  // characters (~200 tokens)
const DEFAULT_OVERLAP = 200     // characters (~50 tokens)

export class PlainTextChunker implements ChunkingStrategy {
  private chunkSize: number
  private overlap: number

  constructor(chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP) {
    this.chunkSize = chunkSize
    this.overlap = overlap
  }

  supports(): boolean {
    return true // fallback — supports everything
  }

  chunk(content: string, metadata: DocumentMetadata): Chunk[] {
    if (content.length <= this.chunkSize) {
      return [{ content, metadata: { filePath: metadata.filePath, project: metadata.project, layer: metadata.layer } }]
    }

    const chunks: Chunk[] = []
    let start = 0

    while (start < content.length) {
      const end = Math.min(start + this.chunkSize, content.length)
      chunks.push({
        content: content.slice(start, end),
        metadata: { filePath: metadata.filePath, project: metadata.project, layer: metadata.layer },
      })
      if (end === content.length) break
      start += this.chunkSize - this.overlap
    }

    return chunks
  }
}
