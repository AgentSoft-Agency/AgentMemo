import type { Chunk, DocumentMetadata } from '../types.js'

export interface ChunkingStrategy {
  supports(filePath: string, mimeType?: string): boolean
  chunk(content: string, metadata: DocumentMetadata): Chunk[]
}
