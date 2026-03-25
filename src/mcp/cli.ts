#!/usr/bin/env node
// src/mcp/cli.ts
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMemo } from '../core/memo.js'
import { createMcpServer } from './server.js'
import { readFile } from 'node:fs/promises'
import { resolve, join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

async function main(): Promise<void> {
  const storagePath = parseStoragePath()
  const version = await readVersion()

  const memo = await createMemo({ storagePath })
  const server = createMcpServer(memo, version)
  const transport = new StdioServerTransport()

  const shutdown = async () => {
    await memo.dispose()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  await server.connect(transport)
}

function parseStoragePath(): string {
  const args = process.argv.slice(2)
  const storageIndex = args.indexOf('--storage')
  let storagePath = join(homedir(), '.agent-memo')
  if (storageIndex !== -1 && args[storageIndex + 1]) {
    storagePath = args[storageIndex + 1]
  }
  if (storagePath.startsWith('~')) {
    storagePath = join(homedir(), storagePath.slice(1))
  }
  return resolve(storagePath)
}

async function readVersion(): Promise<string> {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const pkgPath = join(__dirname, '..', '..', 'package.json')
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'))
    return pkg.version ?? '0.1.0'
  } catch {
    return '0.1.0'
  }
}

main().catch((err) => {
  console.error('agent-memo MCP server failed to start:', err)
  process.exit(1)
})
