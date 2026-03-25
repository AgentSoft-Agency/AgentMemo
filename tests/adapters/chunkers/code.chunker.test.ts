import { describe, it, expect } from 'vitest'
import { CodeChunker } from '../../../src/adapters/chunkers/code.chunker.js'
import type { DocumentMetadata } from '../../../src/types.js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const baseMeta: DocumentMetadata = {
  id: 'test-doc',
  project: 'test',
  filePath: '/test/service.ts',
  section: '',
  layer: 'api',
  entities: [],
  checksum: 'abc123',
}

describe('CodeChunker', () => {
  const chunker = new CodeChunker()

  it('supports common code file extensions', () => {
    expect(chunker.supports('file.ts')).toBe(true)
    expect(chunker.supports('file.js')).toBe(true)
    expect(chunker.supports('file.py')).toBe(true)
    expect(chunker.supports('file.md')).toBe(false)
  })

  it('splits by class and function boundaries', () => {
    const content = readFileSync(resolve(__dirname, '../../../tests/fixtures/sample-code.ts'), 'utf-8')
    const chunks = chunker.chunk(content, baseMeta)
    expect(chunks.length).toBeGreaterThanOrEqual(3)
  })

  it('includes entity name in section metadata', () => {
    const content = readFileSync(resolve(__dirname, '../../../tests/fixtures/sample-code.ts'), 'utf-8')
    const chunks = chunker.chunk(content, baseMeta)
    const classChunk = chunks.find(c => c.content.includes('class UserService'))
    expect(classChunk?.metadata.section).toContain('UserService')
  })
})
