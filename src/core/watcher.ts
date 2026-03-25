import chokidar from 'chokidar'
import type { FSWatcher } from 'chokidar'
import { basename, extname } from 'node:path'
import type { Watcher, WatchOptions } from '../types.js'

/**
 * Convert simple glob patterns (e.g. "**\/*.tmp", "*.log") to a predicate function.
 * Chokidar v4 removed glob support from the ignored option.
 */
function buildIgnoredFn(patterns: string[]): ((filePath: string) => boolean) | undefined {
  if (!patterns.length) return undefined
  return (filePath: string) => {
    const name = basename(filePath)
    return patterns.some(pattern => {
      // Handle "**/*.ext" and "*.ext" — match by file extension/name suffix
      const stripped = pattern.replace(/^\*\*\//, '').replace(/^\*\//, '')
      if (stripped.startsWith('*.')) {
        const ext = stripped.slice(1) // e.g. ".tmp"
        return extname(name) === ext || name.endsWith(ext)
      }
      // Handle exact name match
      return name === stripped || filePath.endsWith(`/${stripped}`)
    })
  }
}

export class FileWatcher implements Watcher {
  private watcher: FSWatcher
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private debounceMs: number

  constructor(
    paths: string[],
    private onChange: (filePath: string) => void,
    private onDelete: (filePath: string) => void,
    options: WatchOptions = {},
  ) {
    this.debounceMs = options.debounceMs ?? 1000
    const ignoredFn = buildIgnoredFn(options.ignored ?? [])
    this.watcher = chokidar.watch(paths, {
      ...(ignoredFn ? { ignored: ignoredFn } : {}),
      ignoreInitial: true,
      persistent: true,
    })
    this.watcher.on('add', (path) => this.debounce(path, 'change'))
    this.watcher.on('change', (path) => this.debounce(path, 'change'))
    this.watcher.on('unlink', (path) => this.debounce(path, 'delete'))
  }

  async close(): Promise<void> {
    for (const timer of this.debounceTimers.values()) clearTimeout(timer)
    this.debounceTimers.clear()
    await this.watcher.close()
  }

  private debounce(filePath: string, type: 'change' | 'delete'): void {
    const existing = this.debounceTimers.get(filePath)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath)
      if (type === 'change') this.onChange(filePath)
      else this.onDelete(filePath)
    }, this.debounceMs)
    this.debounceTimers.set(filePath, timer)
  }
}
