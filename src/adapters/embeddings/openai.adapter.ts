import type { EmbeddingProvider } from '../../ports/embedding-provider.port.js'

interface OpenAIAdapterConfig {
  apiKey: string
  model?: string
}

export class OpenAIAdapter implements EmbeddingProvider {
  private client: any = null
  private initPromise: Promise<void> | null = null
  private model: string
  private dims: number

  constructor(config: OpenAIAdapterConfig) {
    this.model = config.model ?? 'text-embedding-3-small'
    this.dims = this.model === 'text-embedding-3-large' ? 3072 : 1536
    this.initPromise = (async () => {
      const { default: OpenAI } = await import('openai')
      this.client = new OpenAI({ apiKey: config.apiKey })
    })()
  }

  dimensions(): number {
    return this.dims
  }

  async embed(text: string): Promise<number[]> {
    const client = await this.getClient()
    const response = await client.embeddings.create({
      model: this.model,
      input: text,
    })
    return response.data[0].embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const client = await this.getClient()
    const response = await client.embeddings.create({
      model: this.model,
      input: texts,
    })
    return response.data.map((d: any) => d.embedding)
  }

  private async getClient(): Promise<any> {
    if (this.initPromise) {
      await this.initPromise
      this.initPromise = null
    }
    return this.client
  }
}
