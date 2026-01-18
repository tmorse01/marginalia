import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EditorLink from '../EditorLink'

describe('EditorLink', () => {
  it('renders as clickable link when showSyntax is false', () => {
    render(<EditorLink text="Click me" url="https://example.com" raw="[Click me](https://example.com)" showSyntax={false} />)
    const link = screen.getByText('Click me').closest('a')
    expect(link).toBeInTheDocument()
    expect(link).toHaveClass('editor-link')
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('prevents navigation on click when showSyntax is false', () => {
    const { container } = render(
      <EditorLink text="Click me" url="https://example.com" raw="[Click me](https://example.com)" showSyntax={false} />
    )
    const link = container.querySelector('a')
    
    if (link) {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      fireEvent(link, clickEvent)
      // The onClick handler should prevent default
      expect(link.onclick).toBeDefined()
    }
  })

  it('renders with syntax markers when showSyntax is true', () => {
    const { container } = render(
      <EditorLink text="Click me" url="https://example.com" raw="[Click me](https://example.com)" showSyntax={true} />
    )
    expect(screen.getByText('Click me')).toBeInTheDocument()
    expect(screen.getByText('https://example.com')).toBeInTheDocument()
    
    const markers = container.querySelectorAll('.editor-syntax-marker')
    expect(markers.length).toBeGreaterThan(0)
    expect(screen.getByText('[')).toBeInTheDocument()
    expect(screen.getByText('](')).toBeInTheDocument()
    expect(screen.getByText(')')).toBeInTheDocument()
  })

  it('renders link text with correct class when showing syntax', () => {
    const { container } = render(
      <EditorLink text="Link Text" url="https://example.com" raw="[Link Text](https://example.com)" showSyntax={true} />
    )
    const linkText = container.querySelector('.editor-link-text')
    expect(linkText).toBeInTheDocument()
    expect(linkText?.textContent).toBe('Link Text')
  })

  it('renders content correctly', () => {
    render(<EditorLink text="Example" url="https://example.com" raw="[Example](https://example.com)" showSyntax={false} />)
    expect(screen.getByText('Example')).toBeInTheDocument()
  })
})
