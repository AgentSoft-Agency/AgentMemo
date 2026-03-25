import { describe, it, expect, beforeAll } from 'vitest'
import { TransformersAdapter } from '../../src/adapters/embeddings/transformers.adapter.js'

describe('TransformersAdapter', () => {
  let adapter: TransformersAdapter

  beforeAll(async () => {
    adapter = new TransformersAdapter()
  })

  it('returns correct dimensions (384 for all-MiniLM-L6-v2)', () => {
    expect(adapter.dimensions()).toBe(384)
  })

  it('embeds a single text string', async () => {
    const vector = await adapter.embed('Hello world')
    expect(vector).toHaveLength(384)
    expect(vector.every(v => typeof v === 'number')).toBe(true)
  }, 60_000)

  it('embeds a batch of texts', async () => {
    const vectors = await adapter.embedBatch(['Hello', 'World'])
    expect(vectors).toHaveLength(2)
    expect(vectors[0]).toHaveLength(384)
    expect(vectors[1]).toHaveLength(384)
  }, 60_000)

  it('produces different vectors for different texts', async () => {
    const [v1, v2] = await adapter.embedBatch(['cats are cute', 'quantum mechanics'])
    const identical = v1.every((val, i) => val === v2[i])
    expect(identical).toBe(false)
  }, 60_000)
})
