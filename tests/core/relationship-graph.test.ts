import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { RelationshipGraph } from '../../src/core/relationship-graph.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('RelationshipGraph', () => {
  let tmpDir: string
  let graph: RelationshipGraph

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'knowledge-test-'))
    graph = new RelationshipGraph(tmpDir)
    await graph.load()
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('adds and retrieves a relationship', () => {
    graph.addRelationship({ sourceId: 'a', targetId: 'b', type: 'consumes' })
    const related = graph.getRelated('a')
    expect(related).toHaveLength(1)
    expect(related[0].targetId).toBe('b')
  })

  it('retrieves bidirectional relationships', () => {
    graph.addRelationship({ sourceId: 'a', targetId: 'b', type: 'consumes' })
    const related = graph.getRelated('b')
    expect(related).toHaveLength(1)
    expect(related[0].sourceId).toBe('a')
  })

  it('traverses relationships up to depth', () => {
    graph.addRelationship({ sourceId: 'a', targetId: 'b', type: 'consumes' })
    graph.addRelationship({ sourceId: 'b', targetId: 'c', type: 'references' })
    graph.addRelationship({ sourceId: 'c', targetId: 'd', type: 'implements' })

    const depth1 = graph.traverse(['a'], 1)
    expect(depth1.map(r => r.targetId)).toContain('b')
    expect(depth1.map(r => r.targetId)).not.toContain('c')

    const depth2 = graph.traverse(['a'], 2)
    const ids = depth2.map(r => r.targetId)
    expect(ids).toContain('b')
    expect(ids).toContain('c')
  })

  it('removes relationships by node ID', () => {
    graph.addRelationship({ sourceId: 'a', targetId: 'b', type: 'consumes' })
    graph.removeByNodeId('a')
    expect(graph.getRelated('b')).toHaveLength(0)
  })

  it('persists and reloads from disk', async () => {
    graph.addRelationship({ sourceId: 'a', targetId: 'b', type: 'consumes' })
    await graph.save()
    const graph2 = new RelationshipGraph(tmpDir)
    await graph2.load()
    expect(graph2.getRelated('a')).toHaveLength(1)
  })
})
