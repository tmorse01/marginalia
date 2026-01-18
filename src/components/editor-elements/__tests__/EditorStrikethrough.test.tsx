import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorStrikethrough from '../EditorStrikethrough'

describe('EditorStrikethrough', () => {
  it('renders strikethrough content without syntax markers when showSyntax is false', () => {
    render(<EditorStrikethrough content="deleted text" raw="~~deleted text~~" showSyntax={false} />)
    const del = screen.getByText('deleted text').closest('del')
    expect(del).toBeInTheDocument()
    expect(del).toHaveClass('editor-strikethrough')
    expect(screen.queryByText('~~')).not.toBeInTheDocument()
  })

  it('renders strikethrough content with syntax markers when showSyntax is true', () => {
    const { container } = render(
      <EditorStrikethrough content="deleted text" raw="~~deleted text~~" showSyntax={true} />
    )
    expect(screen.getByText('deleted text')).toBeInTheDocument()
    const markers = container.querySelectorAll('.editor-syntax-marker')
    expect(markers).toHaveLength(2)
    expect(markers[0].textContent).toBe('~~')
    expect(markers[1].textContent).toBe('~~')
  })

  it('renders content correctly', () => {
    render(<EditorStrikethrough content="Hello World" raw="~~Hello World~~" showSyntax={false} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
