import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorBlockquote from '../EditorBlockquote'
import EditorText from '../EditorText'

describe('EditorBlockquote', () => {
  it('renders blockquote without syntax markers when showSyntax is false', () => {
    render(
      <EditorBlockquote indent={1} content={<EditorText content="Quote text" />} showSyntax={false} />
    )
    const blockquote = screen.getByText('Quote text').closest('.editor-blockquote')
    expect(blockquote).toBeInTheDocument()
    expect(screen.getByText('>')).toBeInTheDocument()
    expect(screen.queryByText('> ')).not.toBeInTheDocument() // No space after marker
  })

  it('renders blockquote with syntax markers when showSyntax is true', () => {
    const { container } = render(
      <EditorBlockquote indent={1} content={<EditorText content="Quote text" />} showSyntax={true} />
    )
    expect(screen.getByText('Quote text')).toBeInTheDocument()
    const marker = container.querySelector('.editor-syntax-marker')
    expect(marker).toBeInTheDocument()
    expect(marker?.textContent).toBe('> ')
  })

  it('renders with multiple indent levels', () => {
    const { container } = render(
      <EditorBlockquote indent={3} content={<EditorText content="Deep quote" />} showSyntax={true} />
    )
    const marker = container.querySelector('.editor-syntax-marker')
    expect(marker?.textContent).toBe('> > > ')
  })

  it('renders content in blockquote-content span', () => {
    const { container } = render(
      <EditorBlockquote indent={1} content={<EditorText content="Test" />} showSyntax={false} />
    )
    const contentSpan = container.querySelector('.editor-blockquote-content')
    expect(contentSpan).toBeInTheDocument()
    expect(contentSpan?.textContent).toBe('Test')
  })

  it('renders marker in blockquote-marker span', () => {
    const { container } = render(
      <EditorBlockquote indent={2} content={<EditorText content="Test" />} showSyntax={false} />
    )
    const markerSpan = container.querySelector('.editor-blockquote-marker')
    expect(markerSpan).toBeInTheDocument()
    expect(markerSpan?.textContent).toBe('>>')
  })
})
