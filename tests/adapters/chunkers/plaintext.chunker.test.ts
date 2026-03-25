import { describe, it, expect } from 'vitest'
import { PlainTextChunker } from '../../../src/adapters/chunkers/plaintext.chunker.js'
import type { DocumentMetadata } from '../../../src/types.js'

const baseMeta: DocumentMetadata = {
  id: 'test-doc',
  project: 'test',
  filePath: '/test/file.txt',
  section: '',
  tags: {},
  checksum: 'abc123',
}

describe('PlainTextChunker', () => {
  const chunker = new PlainTextChunker()

  it('supports any file type', () => {
    expect(chunker.supports('file.txt')).toBe(true)
    expect(chunker.supports('file.xyz')).toBe(true)
  })

  it('returns single chunk for short content', () => {
    const chunks = chunker.chunk('Hello world', baseMeta)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].content).toBe('Hello world')
  })

  it('splits long content into overlapping chunks', () => {
    const longContent = Array(200).fill('word').join(' ')
    const chunks = chunker.chunk(longContent, baseMeta)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('preserves metadata partial in each chunk', () => {
    const chunks = chunker.chunk('Hello world', baseMeta)
    expect(chunks[0].metadata.filePath).toBe('/test/file.txt')
  })
})
