import { describe, it, expect } from 'vitest'
import { MetadataExtractor } from '../../src/core/metadata-extractor.js'
import type { ProjectConfig } from '../../src/types.js'

const projects: ProjectConfig[] = [
  { name: 'payments', paths: ['/workspace/services/payments'] },
  { name: 'users', paths: ['/workspace/services/users'] },
]

describe('MetadataExtractor', () => {
  const extractor = new MetadataExtractor(projects)

  it('detects project from file path', () => {
    const meta = extractor.extract('/workspace/services/payments/README.md', '')
    expect(meta.project).toBe('payments')
  })

  it('detects layer from folder convention', () => {
    const meta = extractor.extract('/workspace/Business_Analysis/overview.md', '')
    expect(meta.layer).toBe('business')
  })

  it('detects layer: software-arch from Software_Architecture', () => {
    const meta = extractor.extract('/workspace/Software_Architecture/api.md', '')
    expect(meta.layer).toBe('software-arch')
  })

  it('extracts frontmatter metadata', () => {
    const content = '---\nproject: my-project\nlayer: api\n---\n\n# Hello'
    const meta = extractor.extract('/workspace/doc.md', content)
    expect(meta.project).toBe('my-project')
    expect(meta.layer).toBe('api')
  })

  it('computes checksum from content', () => {
    const meta = extractor.extract('/workspace/doc.md', 'Hello world')
    expect(meta.checksum).toBeDefined()
    expect(meta.checksum.length).toBeGreaterThan(0)
  })

  it('generates deterministic checksum', () => {
    const meta1 = extractor.extract('/workspace/doc.md', 'Hello world')
    const meta2 = extractor.extract('/workspace/doc.md', 'Hello world')
    expect(meta1.checksum).toBe(meta2.checksum)
  })

  it('defaults to unknown project and general layer', () => {
    const meta = extractor.extract('/other/random/file.md', '')
    expect(meta.project).toBe('unknown')
    expect(meta.layer).toBe('general')
  })
})
