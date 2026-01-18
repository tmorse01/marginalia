import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import EditorCodeFence from '../EditorCodeFence'

describe('EditorCodeFence', () => {
  it('renders raw markdown code fence', () => {
    const { container } = render(<EditorCodeFence raw="```javascript\nconst x = 1;\n```" />)
    const codeFence = container.querySelector('.editor-line-code-fence')
    expect(codeFence).toBeInTheDocument()
    expect(codeFence?.textContent).toContain('javascript')
    expect(codeFence?.textContent).toContain('const x = 1')
  })

  it('renders code fence with language', () => {
    const { container } = render(<EditorCodeFence raw="```typescript\ninterface Test {}\n```" language="typescript" />)
    const codeFence = container.querySelector('.editor-line-code-fence')
    expect(codeFence).toBeInTheDocument()
    expect(codeFence?.textContent).toContain('typescript')
    expect(codeFence?.textContent).toContain('interface Test')
  })

  it('renders code fence without language', () => {
    const { container } = render(<EditorCodeFence raw="```\ncode here\n```" />)
    const codeFence = container.querySelector('.editor-line-code-fence')
    expect(codeFence).toBeInTheDocument()
    expect(codeFence?.textContent).toContain('code here')
  })

  it('renders empty code fence', () => {
    const { container } = render(<EditorCodeFence raw="```\n```" />)
    const codeFence = container.querySelector('.editor-line-code-fence')
    expect(codeFence).toBeInTheDocument()
    expect(codeFence?.textContent).toContain('```')
  })
})
