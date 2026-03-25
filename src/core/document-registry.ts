import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

interface RegistryEntry {
  checksum: string
  chunkIds: string[]
}

export class DocumentRegistry {
  private entries = new Map<string, RegistryEntry>()
  private filePath: string

  constructor(storagePath: string) {
    this.filePath = join(storagePath, 'registry.json')
  }

  async load(): Promise<void> {
    try {
      const data = await readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(data) as Record<string, RegistryEntry>
      this.entries = new Map(Object.entries(parsed))
    } catch {
      this.entries = new Map()
    }
  }

  async save(): Promise<void> {
    const dir = this.filePath.substring(0, this.filePath.lastIndexOf('/'))
    await mkdir(dir, { recursive: true })
    const data = Object.fromEntries(this.entries)
    await writeFile(this.filePath, JSON.stringify(data, null, 2))
  }

  register(filePath: string, checksum: string, chunkIds: string[]): void {
    this.entries.set(filePath, { checksum, chunkIds })
  }

  remove(filePath: string): void {
    this.entries.delete(filePath)
  }

  getChecksum(filePath: string): string | null {
    return this.entries.get(filePath)?.checksum ?? null
  }

  getChunkIds(filePath: string): string[] {
    return this.entries.get(filePath)?.chunkIds ?? []
  }

  hasChanged(filePath: string, checksum: string): boolean {
    const existing = this.entries.get(filePath)
    return !existing || existing.checksum !== checksum
  }

  getAllFilePaths(): string[] {
    return Array.from(this.entries.keys())
  }
}
