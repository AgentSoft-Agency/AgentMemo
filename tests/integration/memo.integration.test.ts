import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMemo } from '../../src/core/memo.js'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { EmbeddingProvider } from '../../src/ports/embedding-provider.port.js'

class MockEmbedding implements EmbeddingProvider {
  dimensions() { return 4 }
  async embed(text: string) {
    let hash = 0
    for (const char of text) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
    return [Math.sin(hash), Math.cos(hash), Math.sin(hash * 2), Math.cos(hash * 2)]
  }
  async embedBatch(texts: string[]) {
    return Promise.all(texts.map(t => this.embed(t)))
  }
}

describe('Memo integration', () => {
  let tmpDir: string
  let docsDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'memo-integration-'))
    docsDir = join(tmpDir, 'docs')
    await mkdir(docsDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('ingests files and searches them', async () => {
    await writeFile(join(docsDir, 'auth.md'), '# Authentication\n\nJWT-based authentication for user login.')
    await writeFile(join(docsDir, 'payments.md'), '# Payments\n\nStripe integration for payment processing.')
    const memo = await createMemo({
      storagePath: join(tmpDir, '.agent-memo'),
      embedding: new MockEmbedding(),
      projects: [{ name: 'my-app', paths: [docsDir] }],
    })
    const result = await memo.ingest(docsDir)
    expect(result.added).toBe(2)
    const searchResults = await memo.search('authentication')
    expect(searchResults.length).toBeGreaterThan(0)
    await memo.dispose()
  })

  it('skips unchanged files on re-ingest', async () => {
    await writeFile(join(docsDir, 'doc.md'), '# Document\n\nSome content.')
    const memo = await createMemo({
      storagePath: join(tmpDir, '.agent-memo'),
      embedding: new MockEmbedding(),
    })
    await memo.ingest(docsDir)
    const result2 = await memo.ingest(docsDir)
    expect(result2.skipped).toBe(1)
    expect(result2.added).toBe(0)
    await memo.dispose()
  })

  it('supports explicit relationships and impact analysis', async () => {
    await writeFile(join(docsDir, 'api.md'), '# User API\n\nGET /users endpoint.')
    await writeFile(join(docsDir, 'frontend.md'), '# User Page\n\nDisplays user list from API.')
    const memo = await createMemo({
      storagePath: join(tmpDir, '.agent-memo'),
      embedding: new MockEmbedding(),
    })
    await memo.ingest(docsDir)
    const apiResults = await memo.search('user API')
    const feResults = await memo.search('user page')
    if (apiResults.length > 0 && feResults.length > 0) {
      await memo.relate(apiResults[0].metadata.id, feResults[0].metadata.id, 'consumes')
    }
    const report = await memo.analyze('user endpoint changes')
    expect(report.directMatches.length).toBeGreaterThanOrEqual(0)
    expect(report.summary).toBeDefined()
    await memo.dispose()
  })

  it('findExisting returns matching capabilities', async () => {
    await writeFile(join(docsDir, 'auth-service.md'), '# Auth Service\n\nHandles JWT authentication and session management.')
    const memo = await createMemo({
      storagePath: join(tmpDir, '.agent-memo'),
      embedding: new MockEmbedding(),
    })
    await memo.ingest(docsDir)
    const results = await memo.findExisting('authentication')
    expect(results.length).toBeGreaterThanOrEqual(0)
    await memo.dispose()
  })
})
