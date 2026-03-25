import type { ChunkingStrategy } from '../../ports/chunking-strategy.port.js'
import type { Chunk, DocumentMetadata } from '../../types.js'
import { parse as parseYaml } from 'yaml'

export class OpenAPIChunker implements ChunkingStrategy {
  supports(filePath: string): boolean {
    if (!/\.(ya?ml|json)$/.test(filePath)) return false
    return true
  }

  chunk(content: string, metadata: DocumentMetadata): Chunk[] {
    let spec: any
    try {
      spec = metadata.filePath.endsWith('.json') ? JSON.parse(content) : parseYaml(content)
    } catch {
      spec = parseYaml(content)
    }

    if (!spec?.openapi && !spec?.swagger) {
      return [{ content, metadata: { filePath: metadata.filePath } }]
    }

    const serviceName = spec.info?.title ?? ''
    const chunks: Chunk[] = []

    for (const [path, methods] of Object.entries(spec.paths ?? {})) {
      for (const [method, operation] of Object.entries(methods as Record<string, any>)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          const operationTags = operation.tags ?? []
          const summary = operation.summary ?? ''
          const chunkContent = [
            `${method.toUpperCase()} ${path}`,
            summary ? `Summary: ${summary}` : '',
            operationTags.length ? `Tags: ${operationTags.join(', ')}` : '',
            operation.requestBody ? `Request Body: ${JSON.stringify(operation.requestBody, null, 2)}` : '',
            operation.responses ? `Responses: ${JSON.stringify(operation.responses, null, 2)}` : '',
          ].filter(Boolean).join('\n')

          chunks.push({
            content: chunkContent,
            metadata: {
              filePath: metadata.filePath,
              project: metadata.project,
              tags: { ...metadata.tags, service: serviceName, capabilities: operationTags },
              section: `${method.toUpperCase()} ${path}`,
            },
          })
        }
      }
    }

    return chunks
  }
}
