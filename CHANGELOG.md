# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.1.0 (2026-03-25)


### Features

* add CLI entry point with --storage arg and graceful shutdown ([5e966f2](https://github.com/AgentSoft-Agency/AgentMemo/commit/5e966f2efd8be3b85a894f6cee97034648b914f1))
* add CodeChunker with regex-based function/class boundary splitting ([7b4bd93](https://github.com/AgentSoft-Agency/AgentMemo/commit/7b4bd93255f95871442ec829f77cbd29c06be4cd))
* add DocumentRegistry for checksum-based incremental sync ([c262bf5](https://github.com/AgentSoft-Agency/AgentMemo/commit/c262bf5b6d991fef50a3ef4bda95707b097dddcb))
* add FileWatcher with chokidar and debounced change detection ([577926c](https://github.com/AgentSoft-Agency/AgentMemo/commit/577926c40656841b4e1b681f5c62047739192061))
* add ImpactAnalyzer with vector search + graph traversal ([8b1bcd1](https://github.com/AgentSoft-Agency/AgentMemo/commit/8b1bcd14ce6b5d5375b09ba43db50c455b1abfc0))
* add IngestionEngine with incremental sync and chunker selection ([45f9320](https://github.com/AgentSoft-Agency/AgentMemo/commit/45f93206560caf5c2fa25601e650fe290aa1141d))
* add LanceDB adapter implementing VectorStore port ([befd70e](https://github.com/AgentSoft-Agency/AgentMemo/commit/befd70e09cc9e04779c20f575f90c5a078317b2c))
* add MarkdownChunker with heading-boundary splitting and hierarchy context ([1fe2ff6](https://github.com/AgentSoft-Agency/AgentMemo/commit/1fe2ff619e4438b9fbec48bbb2ae35b46dc2c1a4))
* add MCP server with 5 registered tools and zod schemas ([b9a0f54](https://github.com/AgentSoft-Agency/AgentMemo/commit/b9a0f5403b72995563623ca6c881ac0cd07460c1))
* add MCP tool handlers with output formatters ([c9c2def](https://github.com/AgentSoft-Agency/AgentMemo/commit/c9c2defdec09098cd7fb3d9d0463f3a1131739ff))
* add Memo class and createMemo factory wiring all components ([9a1625a](https://github.com/AgentSoft-Agency/AgentMemo/commit/9a1625a9026c9fe6d3843511648b7ec5c016aa46))
* add MetadataExtractor with frontmatter parsing and folder-convention detection ([c6f7261](https://github.com/AgentSoft-Agency/AgentMemo/commit/c6f7261f673f2fbc51cdc0698262e920448a4e2f))
* add OpenAI embedding adapter as optional provider ([b7beb7c](https://github.com/AgentSoft-Agency/AgentMemo/commit/b7beb7cad9e09b532b180637a17f085147d064b5))
* add OpenAPIChunker with path/operation splitting and service metadata extraction ([60f0034](https://github.com/AgentSoft-Agency/AgentMemo/commit/60f00349c42163cf3ef32b846e53cae19640f439))
* add PlainTextChunker with fixed-size overlap splitting ([5dcf7f8](https://github.com/AgentSoft-Agency/AgentMemo/commit/5dcf7f8c71033b236a8149e2591bef896503c4c2))
* add port interfaces for VectorStore, EmbeddingProvider, ChunkingStrategy ([b0f0a30](https://github.com/AgentSoft-Agency/AgentMemo/commit/b0f0a300a5fca8b46cb4d97e851427714a660651))
* add RelationshipGraph with BFS traversal and JSON persistence ([4c053ef](https://github.com/AgentSoft-Agency/AgentMemo/commit/4c053efe98ddf3e421891d34a87174512da8161e))
* add SearchEngine wrapping embedding + vector store query ([5c33787](https://github.com/AgentSoft-Agency/AgentMemo/commit/5c337875f19073ad76e2193bdc1344de858996d8))
* add TransformersAdapter for local embedding with all-MiniLM-L6-v2 ([58d4480](https://github.com/AgentSoft-Agency/AgentMemo/commit/58d4480e0d5ae1fdddde0b470d3378864c59dd52))


### Bug Fixes

* stabilize watcher test with init delay ([d5cdeb9](https://github.com/AgentSoft-Agency/AgentMemo/commit/d5cdeb9f5bd005738e1811bd93b0cbb8b2c0f791))
