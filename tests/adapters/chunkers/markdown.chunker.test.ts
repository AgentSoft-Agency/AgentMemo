import { describe, it, expect } from 'vitest'
import { MarkdownChunker } from '../../../src/adapters/chunkers/markdown.chunker.js'
import type { DocumentMetadata } from '../../../src/types.js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const baseMeta: DocumentMetadata = {
  id: 'test-doc',
  project: 'test',
  filePath: '/test/doc.md',
  section: '',
  tags: {},
  checksum: 'abc123',
}

describe('MarkdownChunker', () => {
  const chunker = new MarkdownChunker()

  it('supports .md and .mdx files', () => {
    expect(chunker.supports('doc.md')).toBe(true)
    expect(chunker.supports('doc.mdx')).toBe(true)
    expect(chunker.supports('doc.txt')).toBe(false)
  })

  it('splits on heading boundaries', () => {
    const content = readFileSync(resolve(__dirname, '../../fixtures/sample.md'), 'utf-8')
    const chunks = chunker.chunk(content, baseMeta)
    expect(chunks.length).toBeGreaterThanOrEqual(3)
  })

  it('preserves heading hierarchy in chunk content', () => {
    const content = '# Top\n\nIntro\n\n## Sub\n\nDetails'
    const chunks = chunker.chunk(content, baseMeta)
    const subChunk = chunks.find(c => c.content.includes('Details'))
    expect(subChunk?.content).toContain('# Top')
    expect(subChunk?.content).toContain('## Sub')
  })

  it('sets section metadata from heading', () => {
    const content = '# Main\n\nContent\n\n## Section A\n\nMore content'
    const chunks = chunker.chunk(content, baseMeta)
    const sectionChunk = chunks.find(c => c.content.includes('More content'))
    expect(sectionChunk?.metadata.section).toBe('Main > Section A')
  })
})
