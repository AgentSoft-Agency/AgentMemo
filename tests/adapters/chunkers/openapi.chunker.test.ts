import { describe, it, expect } from 'vitest'
import { OpenAPIChunker } from '../../../src/adapters/chunkers/openapi.chunker.js'
import type { DocumentMetadata } from '../../../src/types.js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const baseMeta: DocumentMetadata = {
  id: 'test-doc',
  project: 'test',
  filePath: '/test/api.yaml',
  section: '',
  tags: {},
  checksum: 'abc123',
}

describe('OpenAPIChunker', () => {
  const chunker = new OpenAPIChunker()

  it('supports .yaml, .yml, and .json files', () => {
    expect(chunker.supports('api.yaml')).toBe(true)
    expect(chunker.supports('api.yml')).toBe(true)
    expect(chunker.supports('api.json')).toBe(true)
    expect(chunker.supports('readme.md')).toBe(false)
  })

  it('splits by path and operation', () => {
    const content = readFileSync(resolve(__dirname, '../../../tests/fixtures/sample-openapi.yaml'), 'utf-8')
    const chunks = chunker.chunk(content, baseMeta)
    expect(chunks.length).toBe(3)
  })

  it('includes path and method in chunk content', () => {
    const content = readFileSync(resolve(__dirname, '../../../tests/fixtures/sample-openapi.yaml'), 'utf-8')
    const chunks = chunker.chunk(content, baseMeta)
    const getUsersChunk = chunks.find(c => c.content.includes('GET /users'))
    expect(getUsersChunk).toBeDefined()
  })

  it('extracts service name from info.title', () => {
    const content = readFileSync(resolve(__dirname, '../../../tests/fixtures/sample-openapi.yaml'), 'utf-8')
    const chunks = chunker.chunk(content, baseMeta)
    expect(chunks[0].metadata.tags?.service).toBe('User Service')
  })

  it('extracts capabilities from tags', () => {
    const content = readFileSync(resolve(__dirname, '../../../tests/fixtures/sample-openapi.yaml'), 'utf-8')
    const chunks = chunker.chunk(content, baseMeta)
    const authChunk = chunks.find(c => c.content.includes('/auth/login'))
    expect(authChunk?.metadata.tags?.capabilities as string[]).toContain('auth')
  })
})
