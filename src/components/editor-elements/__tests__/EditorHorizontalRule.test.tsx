import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import EditorHorizontalRule from '../EditorHorizontalRule'

describe('EditorHorizontalRule', () => {
  it('renders horizontal rule', () => {
    const { container } = render(<EditorHorizontalRule />)
    const hr = container.querySelector('hr')
    expect(hr).toBeInTheDocument()
    expect(hr).toHaveClass('editor-hr')
  })

  it('renders as self-closing tag', () => {
    const { container } = render(<EditorHorizontalRule />)
    const hr = container.querySelector('hr')
    expect(hr).toBeInTheDocument()
    expect(hr?.children.length).toBe(0)
  })
})
