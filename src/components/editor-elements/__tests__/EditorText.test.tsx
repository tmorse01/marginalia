import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorText from '../EditorText'

describe('EditorText', () => {
  it('renders text content', () => {
    render(<EditorText content="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders empty string', () => {
    const { container } = render(<EditorText content="" />)
    const span = container.querySelector('span')
    expect(span).toBeInTheDocument()
    expect(span?.textContent).toBe('')
  })

  it('renders special characters', () => {
    render(<EditorText content="Hello & <world>" />)
    expect(screen.getByText('Hello & <world>')).toBeInTheDocument()
  })

  it('renders multiline text', () => {
    const { container } = render(<EditorText content="Line 1\nLine 2" />)
    const span = container.querySelector('span')
    expect(span).toBeInTheDocument()
    expect(span?.textContent).toContain('Line 1')
    expect(span?.textContent).toContain('Line 2')
  })
})
