# agent-memo

Persistent vector-based documentation memory for AI coding agents. Ingest project docs, search semantically, analyze cross-project impact, and discover existing service capabilities — all via MCP.

## What it does

- **Semantic search** — Find relevant documentation using natural language queries
- **Cross-project impact analysis** — Understand the blast radius of changes across projects and layers
- **Service discovery** — Check what already exists before building something new
- **Incremental sync** — Re-ingesting skips unchanged files via checksums
- **Format-aware chunking** — Markdown, OpenAPI, code, and plain text each get optimal chunking
- **Generic tagging** — Define your own organizational dimensions (layers, teams, modules — whatever fits your workflow)

## Installation

### Claude Code

```bash
claude mcp add agent-memo -- npx -y @agentsoft/agent-memo --storage ~/.agent-memo
```

### Gemini CLI

Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "agent-memo": {
      "command": "npx",
      "args": ["-y", "@agentsoft/agent-memo", "--storage", "~/.agent-memo"]
    }
  }
}
```

### Codex CLI

Add to `~/.codex/config.json`:

```json
{
  "mcpServers": {
    "agent-memo": {
      "command": "npx",
      "args": ["-y", "@agentsoft/agent-memo", "--storage", "~/.agent-memo"]
    }
  }
}
```

## MCP Tools

### memo_ingest

Ingest files or directories into the knowledge base.

```
memo_ingest({ source: "./docs" })
memo_ingest({ source: ["./services/auth", "./services/payments"], project: "backend" })
memo_ingest({ source: "./api", tags: { layer: "api", team: "platform" } })
```

### memo_search

Semantic search across ingested documentation.

```
memo_search({ query: "JWT authentication" })
memo_search({ query: "payment processing", filter: { tags: { layer: "api" } } })
memo_search({ query: "user schema", limit: 5 })
```

### memo_analyze

Cross-project impact analysis combining vector search with relationship graph traversal.

```
memo_analyze({ query: "change user schema to add email verification" })
memo_analyze({ query: "remove payment gateway", depth: 3 })
```

### memo_find_existing

Discover existing service capabilities to prevent duplicate implementations.

```
memo_find_existing({ capability: "email sending" })
memo_find_existing({ capability: "file upload", filter: { project: "backend" } })
```

### memo_relate

Register explicit dependencies between documents.

```
memo_relate({ sourceId: "abc123-0", targetId: "def456-0", type: "consumes" })
```

## Configuration

Create `~/.agent-memo/config.json` to configure tag rules and projects:

```json
{
  "tagRules": [
    { "pattern": "docs/api", "tags": { "layer": "api" } },
    { "pattern": "docs/architecture", "tags": { "layer": "architecture" } },
    { "pattern": "services/auth", "tags": { "service": "auth", "team": "identity" } }
  ],
  "projects": [
    { "name": "backend", "paths": ["./services"] },
    { "name": "frontend", "paths": ["./apps/web"] },
    { "name": "mobile", "paths": ["./apps/mobile"] }
  ]
}
```

**Tag rules** auto-tag documents based on file path patterns. Patterns are case-insensitive substring matches.

**Projects** map file paths to project names for automatic project detection.

Tags can also be set via frontmatter in markdown files:

```yaml
---
project: auth-service
tags:
  layer: api
  team: identity
  domain: authentication
---
```

Priority: tag rules (lowest) < frontmatter < explicit overrides (highest).

## Architecture

```
┌─────────────────────────────────┐
│        AI Coding Tool           │
│ (Claude / Gemini CLI / Codex)   │
├─────────────────────────────────┤
│       stdio (JSON-RPC)          │
├─────────────────────────────────┤
│     MCP Server (5 tools)        │
├─────────────────────────────────┤
│          Memo Core              │
│  Ingestion · Search · Impact    │
├─────────────────────────────────┤
│      Ports & Adapters           │
│  LanceDB · Transformers.js     │
│  Markdown · OpenAPI · Code      │
└─────────────────────────────────┘
```

**Ports (swappable):**
- `VectorStore` — LanceDB (default), extensible to Pinecone/Qdrant/Weaviate
- `EmbeddingProvider` — Transformers.js local (default), OpenAI API (optional)
- `ChunkingStrategy` — Markdown, OpenAPI, Code, PlainText

**Storage:** All data persists at the `--storage` path (default `~/.agent-memo`). LanceDB files, document registry, and relationship graph are stored there. Multiple tool sessions share the same knowledge base.

## Embedding

By default, agent-memo uses [all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) via Transformers.js for local embeddings (~33MB model, downloaded on first use). No API keys required.

To use OpenAI embeddings instead, use the library API:

```typescript
import { createMemo, OpenAIAdapter } from '@agentsoft/agent-memo'

const memo = await createMemo({
  storagePath: './.agent-memo',
  embedding: new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY }),
})
```

## Library API

agent-memo can also be used as a TypeScript library:

```typescript
import { createMemo } from '@agentsoft/agent-memo'

const memo = await createMemo({
  storagePath: './.agent-memo',
  tagRules: [
    { pattern: /docs\/api/i, tags: { layer: 'api' } },
  ],
  projects: [
    { name: 'my-app', paths: ['./src'] },
  ],
})

await memo.ingest('./docs')
const results = await memo.search('authentication')
const report = await memo.analyze('change user schema')
await memo.dispose()
```

## License

MIT
