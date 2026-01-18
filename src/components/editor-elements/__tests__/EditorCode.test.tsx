import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorCode from '../EditorCode'

describe('EditorCode', () => {
  it('renders code content without syntax markers when showSyntax is false', () => {
    render(<EditorCode content="code text" raw="`code text`" showSyntax={false} />)
    const code = screen.getByText('code text').closest('code')
    expect(code).toBeInTheDocument()
    expect(code).toHaveClass('editor-inline-code')
    expect(screen.queryByText('`')).not.toBeInTheDocument()
  })

  it('renders code content with syntax markers when showSyntax is true', () => {
    const { container } = render(
      <EditorCode content="code text" raw="`code text`" showSyntax={true} />
    )
    expect(screen.getByText('code text')).toBeInTheDocument()
    const markers = container.querySelectorAll('.editor-syntax-marker')
    expect(markers).toHaveLength(2)
    expect(markers[0].textContent).toBe('`')
    expect(markers[1].textContent).toBe('`')
  })

  it('renders content correctly', () => {
    render(<EditorCode content="const x = 1" raw="`const x = 1`" showSyntax={false} />)
    expect(screen.getByText('const x = 1')).toBeInTheDocument()
  })

  it('handles code with special characters', () => {
    render(<EditorCode content="<div>" raw="`<div>`" showSyntax={false} />)
    expect(screen.getByText('<div>')).toBeInTheDocument()
  })
})
