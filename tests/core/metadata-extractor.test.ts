import { describe, it, expect } from 'vitest'
import { MetadataExtractor } from '../../src/core/metadata-extractor.js'
import type { ProjectConfig, TagRule } from '../../src/types.js'

const projects: ProjectConfig[] = [
  { name: 'payments', paths: ['/workspace/services/payments'] },
  { name: 'users', paths: ['/workspace/services/users'] },
]

const tagRules: TagRule[] = [
  { pattern: /business_analysis/i, tags: { layer: 'business' } },
  { pattern: /software_architecture/i, tags: { layer: 'software-arch' } },
  { pattern: /infrastructure/i, tags: { layer: 'infrastructure' } },
]

describe('MetadataExtractor', () => {
  const extractor = new MetadataExtractor(projects, tagRules)

  it('detects project from file path', () => {
    const meta = extractor.extract('/workspace/services/payments/README.md', '')
    expect(meta.project).toBe('payments')
  })

  it('applies tag rules from file path', () => {
    const meta = extractor.extract('/workspace/Business_Analysis/overview.md', '')
    expect(meta.tags.layer).toBe('business')
  })

  it('applies software-arch tag rule', () => {
    const meta = extractor.extract('/workspace/Software_Architecture/api.md', '')
    expect(meta.tags.layer).toBe('software-arch')
  })

  it('extracts tags from frontmatter', () => {
    const content = '---\nproject: my-project\ntags:\n  layer: api\n  team: payments\n---\n\n# Hello'
    const meta = extractor.extract('/workspace/doc.md', content)
    expect(meta.project).toBe('my-project')
    expect(meta.tags.layer).toBe('api')
    expect(meta.tags.team).toBe('payments')
  })

  it('computes deterministic checksum', () => {
    const meta1 = extractor.extract('/workspace/doc.md', 'Hello world')
    const meta2 = extractor.extract('/workspace/doc.md', 'Hello world')
    expect(meta1.checksum).toBe(meta2.checksum)
    expect(meta1.checksum.length).toBeGreaterThan(0)
  })

  it('defaults to unknown project and empty tags', () => {
    const meta = extractor.extract('/other/random/file.md', '')
    expect(meta.project).toBe('unknown')
    expect(meta.tags).toEqual({})
  })

  it('merges: frontmatter wins over tag rules', () => {
    const content = '---\ntags:\n  layer: custom\n---\n'
    const meta = extractor.extract('/workspace/Business_Analysis/doc.md', content)
    expect(meta.tags.layer).toBe('custom')
  })

  it('merges: overrides win over everything', () => {
    const content = '---\ntags:\n  layer: from-frontmatter\n---\n'
    const meta = extractor.extract('/workspace/Business_Analysis/doc.md', content, {
      tags: { layer: 'override' },
    })
    expect(meta.tags.layer).toBe('override')
  })

  it('works with no tag rules', () => {
    const noRulesExtractor = new MetadataExtractor(projects)
    const meta = noRulesExtractor.extract('/workspace/services/payments/README.md', '')
    expect(meta.project).toBe('payments')
    expect(meta.tags).toEqual({})
  })
})
