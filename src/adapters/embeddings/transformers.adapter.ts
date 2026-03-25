import type { EmbeddingProvider } from '../../ports/embedding-provider.port.js'

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'
const DIMENSIONS = 384

export class TransformersAdapter implements EmbeddingProvider {
  private pipeline: any = null
  private initPromise: Promise<void> | null = null

  dimensions(): number {
    return DIMENSIONS
  }

  async embed(text: string): Promise<number[]> {
    const pipe = await this.getPipeline()
    const output = await pipe(text, { pooling: 'mean', normalize: true })
    return Array.from(output.data as Float32Array)
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const pipe = await this.getPipeline()
    const results: number[][] = []
    for (const text of texts) {
      const output = await pipe(text, { pooling: 'mean', normalize: true })
      results.push(Array.from(output.data as Float32Array))
    }
    return results
  }

  private async getPipeline(): Promise<any> {
    if (this.pipeline) return this.pipeline
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const { pipeline } = await import('@huggingface/transformers')
        this.pipeline = await pipeline('feature-extraction', MODEL_NAME)
      })()
    }
    await this.initPromise
    return this.pipeline
  }
}
