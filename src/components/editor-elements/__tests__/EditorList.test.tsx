import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorList from '../EditorList'
import EditorText from '../EditorText'

describe('EditorList', () => {
  describe('unordered lists', () => {
    it('renders unordered list item without syntax markers when showSyntax is false', () => {
      render(
        <EditorList type="unordered" marker="-" content={<EditorText content="List item" />} showSyntax={false} />
      )
      const listItem = screen.getByText('List item').closest('.editor-list-item')
      expect(listItem).toBeInTheDocument()
      expect(listItem).toHaveClass('editor-list-unordered')
      expect(screen.getByText('-')).toBeInTheDocument()
      expect(screen.queryByText('- ')).not.toBeInTheDocument() // No space after marker
    })

    it('renders unordered list item with syntax markers when showSyntax is true', () => {
      const { container } = render(
        <EditorList type="unordered" marker="-" content={<EditorText content="List item" />} showSyntax={true} />
      )
      expect(screen.getByText('List item')).toBeInTheDocument()
      const marker = container.querySelector('.editor-syntax-marker')
      expect(marker).toBeInTheDocument()
      expect(marker?.textContent).toBe('- ')
    })

    it('renders with * marker', () => {
      render(
        <EditorList type="unordered" marker="*" content={<EditorText content="Item" />} showSyntax={false} />
      )
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('renders with + marker', () => {
      render(
        <EditorList type="unordered" marker="+" content={<EditorText content="Item" />} showSyntax={false} />
      )
      expect(screen.getByText('+')).toBeInTheDocument()
    })
  })

  describe('ordered lists', () => {
    it('renders ordered list item without syntax markers when showSyntax is false', () => {
      render(
        <EditorList type="ordered" number={1} content={<EditorText content="First item" />} showSyntax={false} />
      )
      const listItem = screen.getByText('First item').closest('.editor-list-item')
      expect(listItem).toBeInTheDocument()
      expect(listItem).toHaveClass('editor-list-ordered')
      expect(screen.getByText('1.')).toBeInTheDocument()
    })

    it('renders ordered list item with syntax markers when showSyntax is true', () => {
      const { container } = render(
        <EditorList type="ordered" number={1} content={<EditorText content="First item" />} showSyntax={true} />
      )
      expect(screen.getByText('First item')).toBeInTheDocument()
      const marker = container.querySelector('.editor-syntax-marker')
      expect(marker).toBeInTheDocument()
      expect(marker?.textContent).toBe('1. ')
    })

    it('renders with different numbers', () => {
      render(
        <EditorList type="ordered" number={42} content={<EditorText content="Item" />} showSyntax={false} />
      )
      expect(screen.getByText('42.')).toBeInTheDocument()
    })
  })

  it('renders content in list-content span', () => {
    const { container } = render(
      <EditorList type="unordered" marker="-" content={<EditorText content="Test" />} showSyntax={false} />
    )
    const contentSpan = container.querySelector('.editor-list-content')
    expect(contentSpan).toBeInTheDocument()
    expect(contentSpan?.textContent).toBe('Test')
  })

  it('renders marker in list-marker span', () => {
    const { container } = render(
      <EditorList type="unordered" marker="-" content={<EditorText content="Test" />} showSyntax={false} />
    )
    const markerSpan = container.querySelector('.editor-list-marker')
    expect(markerSpan).toBeInTheDocument()
    expect(markerSpan?.textContent).toBe('-')
  })
})
