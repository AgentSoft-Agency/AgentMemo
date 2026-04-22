import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DocumentRegistry } from '../../src/core/document-registry.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('DocumentRegistry', () => {
  let tmpDir: string
  let registry: DocumentRegistry

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'knowledge-test-'))
    registry = new DocumentRegistry(tmpDir)
    await registry.load()
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('registers a document and retrieves by checksum', () => {
    registry.register('/path/to/file.md', 'abc123', ['chunk-1', 'chunk-2'])
    expect(registry.getChecksum('/path/to/file.md')).toBe('abc123')
  })

  it('returns null checksum for unknown file', () => {
    expect(registry.getChecksum('/unknown.md')).toBeNull()
  })

  it('detects unchanged files', () => {
    registry.register('/path/to/file.md', 'abc123', ['chunk-1'])
    expect(registry.hasChanged('/path/to/file.md', 'abc123')).toBe(false)
  })

  it('detects changed files', () => {
    registry.register('/path/to/file.md', 'abc123', ['chunk-1'])
    expect(registry.hasChanged('/path/to/file.md', 'def456')).toBe(true)
  })

  it('returns chunk IDs for a file', () => {
    registry.register('/path/to/file.md', 'abc123', ['chunk-1', 'chunk-2'])
    expect(registry.getChunkIds('/path/to/file.md')).toEqual(['chunk-1', 'chunk-2'])
  })

  it('removes a file entry', () => {
    registry.register('/path/to/file.md', 'abc123', ['chunk-1'])
    registry.remove('/path/to/file.md')
    expect(registry.getChecksum('/path/to/file.md')).toBeNull()
  })

  it('persists and reloads from disk', async () => {
    registry.register('/path/to/file.md', 'abc123', ['chunk-1'])
    await registry.save()
    const registry2 = new DocumentRegistry(tmpDir)
    await registry2.load()
    expect(registry2.getChecksum('/path/to/file.md')).toBe('abc123')
  })
})
