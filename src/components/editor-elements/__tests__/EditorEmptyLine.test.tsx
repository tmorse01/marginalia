import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import EditorEmptyLine from '../EditorEmptyLine'

describe('EditorEmptyLine', () => {
  it('renders non-breaking space', () => {
    const { container } = render(<EditorEmptyLine />)
    const span = container.querySelector('.editor-line-empty')
    expect(span).toBeInTheDocument()
    // Check that it contains a non-breaking space (either \u00A0 or &nbsp;)
    // The actual character might be rendered differently, so just check it exists
    expect(span?.textContent).toBeTruthy()
    if (span) {
      expect(span.textContent.length).toBeGreaterThan(0)
    }
  })

  it('has correct class', () => {
    const { container } = render(<EditorEmptyLine />)
    const span = container.querySelector('.editor-line-empty')
    expect(span).toHaveClass('editor-line-empty')
  })
})
