import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorHeader from '../EditorHeader'
import EditorText from '../EditorText'

describe('EditorHeader', () => {
  describe('h1 headers', () => {
    it('renders h1 header without syntax markers when showSyntax is false', () => {
      render(
        <EditorHeader level={1} showSyntax={false}>
          <EditorText content="Header 1" />
        </EditorHeader>
      )
      const h1 = screen.getByText('Header 1').closest('h1')
      expect(h1).toBeInTheDocument()
      expect(h1).toHaveClass('editor-header')
      expect(h1).toHaveClass('editor-header-1')
      expect(screen.queryByText('#')).not.toBeInTheDocument()
    })

    it('renders h1 header with syntax markers when showSyntax is true', () => {
      const { container } = render(
        <EditorHeader level={1} showSyntax={true}>
          <EditorText content="Header 1" />
        </EditorHeader>
      )
      expect(screen.getByText('Header 1')).toBeInTheDocument()
      const marker = container.querySelector('.editor-syntax-marker')
      expect(marker).toBeInTheDocument()
      expect(marker?.textContent).toBe('# ')
    })
  })

  describe('h2 headers', () => {
    it('renders h2 header without syntax markers', () => {
      render(
        <EditorHeader level={2} showSyntax={false}>
          <EditorText content="Header 2" />
        </EditorHeader>
      )
      const h2 = screen.getByText('Header 2').closest('h2')
      expect(h2).toBeInTheDocument()
      expect(h2).toHaveClass('editor-header-2')
    })

    it('renders h2 header with ## syntax markers', () => {
      const { container } = render(
        <EditorHeader level={2} showSyntax={true}>
          <EditorText content="Header 2" />
        </EditorHeader>
      )
      const marker = container.querySelector('.editor-syntax-marker')
      expect(marker?.textContent).toBe('## ')
    })
  })

  describe('h3-h6 headers', () => {
    it.each([3, 4, 5, 6])('renders h%d header correctly', (level) => {
      render(
        <EditorHeader level={level} showSyntax={false}>
          <EditorText content={`Header ${level}`} />
        </EditorHeader>
      )
      const header = screen.getByText(`Header ${level}`).closest(`h${level}`)
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass(`editor-header-${level}`)
    })

    it.each([3, 4, 5, 6])('renders h%d with correct number of # markers', (level) => {
      const { container } = render(
        <EditorHeader level={level} showSyntax={true}>
          <EditorText content={`Header ${level}`} />
        </EditorHeader>
      )
      const marker = container.querySelector('.editor-syntax-marker')
      expect(marker?.textContent).toBe('#'.repeat(level) + ' ')
    })
  })

  it('renders with multiple children', () => {
    const { container } = render(
      <EditorHeader level={1} showSyntax={false}>
        <EditorText content="Bold " />
        <strong>Header</strong>
      </EditorHeader>
    )
    const h1 = container.querySelector('h1')
    expect(h1).toBeInTheDocument()
    expect(h1?.textContent).toBe('Bold Header')
    expect(screen.getByText('Header')).toBeInTheDocument()
  })

  it('has correct data attributes', () => {
    const { container } = render(
      <EditorHeader level={2} showSyntax={true}>
        <EditorText content="Test" />
      </EditorHeader>
    )
    const h2 = container.querySelector('h2')
    expect(h2).toHaveAttribute('data-header-level', '2')
    expect(h2).toHaveAttribute('data-show-syntax', 'true')
  })

  it('applies correct inline styles', () => {
    const { container } = render(
      <EditorHeader level={1} showSyntax={false}>
        <EditorText content="Test" />
      </EditorHeader>
    )
    const h1 = container.querySelector('h1')
    const styles = window.getComputedStyle(h1!)
    expect(styles.display).toBe('block')
    expect(styles.fontWeight).toBe('bold')
  })
})
