import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorBold from '../EditorBold'

describe('EditorBold', () => {
  it('renders bold content without syntax markers when showSyntax is false', () => {
    render(<EditorBold content="bold text" raw="**bold text**" showSyntax={false} />)
    const strong = screen.getByText('bold text').closest('strong')
    expect(strong).toBeInTheDocument()
    expect(strong).toHaveClass('editor-bold')
    expect(screen.queryByText('**')).not.toBeInTheDocument()
  })

  it('renders bold content with syntax markers when showSyntax is true', () => {
    const { container } = render(
      <EditorBold content="bold text" raw="**bold text**" showSyntax={true} />
    )
    expect(screen.getByText('bold text')).toBeInTheDocument()
    const markers = container.querySelectorAll('.editor-syntax-marker')
    expect(markers).toHaveLength(2)
    expect(markers[0].textContent).toBe('**')
    expect(markers[1].textContent).toBe('**')
  })

  it('renders with __ markers', () => {
    const { container } = render(
      <EditorBold content="bold text" raw="__bold text__" showSyntax={true} />
    )
    const markers = container.querySelectorAll('.editor-syntax-marker')
    expect(markers).toHaveLength(2)
    expect(markers[0].textContent).toBe('__')
    expect(markers[1].textContent).toBe('__')
  })

  it('renders content correctly', () => {
    render(<EditorBold content="Hello World" raw="**Hello World**" showSyntax={false} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
