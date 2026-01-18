import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorItalic from '../EditorItalic'

describe('EditorItalic', () => {
  it('renders italic content without syntax markers when showSyntax is false', () => {
    render(<EditorItalic content="italic text" raw="*italic text*" showSyntax={false} />)
    const em = screen.getByText('italic text').closest('em')
    expect(em).toBeInTheDocument()
    expect(em).toHaveClass('editor-italic')
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('renders italic content with syntax markers when showSyntax is true', () => {
    const { container } = render(
      <EditorItalic content="italic text" raw="*italic text*" showSyntax={true} />
    )
    expect(screen.getByText('italic text')).toBeInTheDocument()
    const markers = container.querySelectorAll('.editor-syntax-marker')
    expect(markers).toHaveLength(2)
    expect(markers[0].textContent).toBe('*')
    expect(markers[1].textContent).toBe('*')
  })

  it('renders with _ markers', () => {
    const { container } = render(
      <EditorItalic content="italic text" raw="_italic text_" showSyntax={true} />
    )
    const markers = container.querySelectorAll('.editor-syntax-marker')
    expect(markers).toHaveLength(2)
    expect(markers[0].textContent).toBe('_')
    expect(markers[1].textContent).toBe('_')
  })

  it('renders content correctly', () => {
    render(<EditorItalic content="Hello World" raw="*Hello World*" showSyntax={false} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
