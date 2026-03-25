import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FileWatcher } from '../../src/core/watcher.js'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('FileWatcher', () => {
  let tmpDir: string
  let onChangeMock: ReturnType<typeof vi.fn>
  let onDeleteMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'watcher-test-'))
    onChangeMock = vi.fn()
    onDeleteMock = vi.fn()
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('detects file creation', async () => {
    const watcher = new FileWatcher([tmpDir], onChangeMock, onDeleteMock, { debounceMs: 100 })
    await new Promise(resolve => setTimeout(resolve, 300))
    await writeFile(join(tmpDir, 'new.md'), 'hello')
    await new Promise(resolve => setTimeout(resolve, 500))
    expect(onChangeMock).toHaveBeenCalledWith(expect.stringContaining('new.md'))
    await watcher.close()
  })

  it('detects file modification', async () => {
    const filePath = join(tmpDir, 'existing.md')
    await writeFile(filePath, 'original')
    const watcher = new FileWatcher([tmpDir], onChangeMock, onDeleteMock, { debounceMs: 100 })
    await new Promise(resolve => setTimeout(resolve, 200))
    vi.clearAllMocks()
    await writeFile(filePath, 'modified')
    await new Promise(resolve => setTimeout(resolve, 500))
    expect(onChangeMock).toHaveBeenCalledWith(filePath)
    await watcher.close()
  })

  it('respects ignored patterns', async () => {
    const watcher = new FileWatcher([tmpDir], onChangeMock, onDeleteMock, { debounceMs: 100, ignored: ['**/*.tmp'] })
    await writeFile(join(tmpDir, 'file.tmp'), 'temp')
    await new Promise(resolve => setTimeout(resolve, 500))
    expect(onChangeMock).not.toHaveBeenCalled()
    await watcher.close()
  })
})
