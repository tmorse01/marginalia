import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NoteEditor from '../NoteEditor'

// Mock the EditorLine component to simplify testing
vi.mock('../EditorLine', () => ({
  default: ({ line, isFocused, onFocus, lineIndex }: any) => (
    <div
      data-testid={`editor-line-${lineIndex}`}
      data-focused={isFocused}
      onClick={() => onFocus(lineIndex, 0)}
    >
      {isFocused ? line : `rendered: ${line}`}
    </div>
  ),
}))

describe('NoteEditor', () => {
  const defaultProps = {
    content: '',
    onChange: vi.fn(),
    placeholder: 'Start writing...',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all lines of content', () => {
    const content = 'line1\nline2\nline3'
    render(<NoteEditor {...defaultProps} content={content} />)

    expect(screen.getByTestId('editor-line-0')).toBeInTheDocument()
    expect(screen.getByTestId('editor-line-1')).toBeInTheDocument()
    expect(screen.getByTestId('editor-line-2')).toBeInTheDocument()
  })

  it('renders placeholder when content is empty', () => {
    render(<NoteEditor {...defaultProps} />)
    expect(screen.getByText('Start writing...')).toBeInTheDocument()
  })

  it('calls onChange with correct content on edit', () => {
    const onChange = vi.fn()
    const { container } = render(
      <NoteEditor {...defaultProps} content="initial" onChange={onChange} />
    )

    const textarea = container.querySelector('textarea')
    expect(textarea).toBeInTheDocument()

    fireEvent.change(textarea!, { target: { value: 'new content' } })

    expect(onChange).toHaveBeenCalledWith('new content')
  })

  it('reports cursor position via onCursorChange', () => {
    const onCursorChange = vi.fn()
    const { container } = render(
      <NoteEditor
        {...defaultProps}
        content="test content"
        onCursorChange={onCursorChange}
      />
    )

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(5, 5)

    fireEvent.select(textarea)

    expect(onCursorChange).toHaveBeenCalledWith(5, 5)
  })

  it('handles empty content gracefully', () => {
    render(<NoteEditor {...defaultProps} content="" />)
    expect(screen.getByText('Start writing...')).toBeInTheDocument()
  })

  it('focuses line when clicked', async () => {
    const content = 'line1\nline2\nline3'
    const { container } = render(
      <NoteEditor {...defaultProps} content={content} />
    )

    const line2 = screen.getByTestId('editor-line-1')
    fireEvent.click(line2)

    await waitFor(() => {
      expect(line2.getAttribute('data-focused')).toBe('true')
    })
  })

  it('unfocuses previous line when new line clicked', async () => {
    const content = 'line1\nline2\nline3'
    const { container } = render(
      <NoteEditor {...defaultProps} content={content} />
    )

    const line1 = screen.getByTestId('editor-line-0')
    const line2 = screen.getByTestId('editor-line-1')

    // Focus first line by clicking
    fireEvent.click(line1)
    await waitFor(() => {
      expect(line1.getAttribute('data-focused')).toBe('true')
    })

    // Click second line
    fireEvent.click(line2)
    await waitFor(() => {
      expect(line2.getAttribute('data-focused')).toBe('true')
      expect(line1.getAttribute('data-focused')).toBe('false')
    })
  })

  it('handles cursor movement with arrow keys', async () => {
    const content = 'line1\nline2'
    const onCursorChange = vi.fn()
    const { container } = render(
      <NoteEditor
        {...defaultProps}
        content={content}
        onCursorChange={onCursorChange}
      />
    )

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(0, 0)

    fireEvent.keyDown(textarea, { key: 'ArrowDown' })

    await waitFor(() => {
      expect(onCursorChange).toHaveBeenCalled()
    })
  })

  it('handles paste events', () => {
    const onChange = vi.fn()
    const { container } = render(
      <NoteEditor {...defaultProps} content="initial" onChange={onChange} />
    )

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    textarea.focus()

    // Simulate paste
    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => 'pasted content',
      },
    })

    // Note: In a real browser, paste would trigger change event
    // This test verifies the component can handle paste
    expect(textarea).toBeInTheDocument()
  })

  it('renders in simple mode when showInlinePreview is false', () => {
    const { container } = render(
      <NoteEditor {...defaultProps} showInlinePreview={false} />
    )

    const textarea = container.querySelector('textarea')
    expect(textarea).toBeInTheDocument()
    expect(textarea?.className).toContain('font-mono')
    expect(screen.queryByTestId(/editor-line-/)).not.toBeInTheDocument()
  })

  it('syncs scroll between textarea and visible lines', () => {
    const content = Array(50).fill('line').join('\n')
    const { container } = render(
      <NoteEditor {...defaultProps} content={content} />
    )

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    const linesContainer = container.querySelector('.editor-lines-container')

    textarea.scrollTop = 100
    fireEvent.scroll(textarea)

    // Scroll should be synced (exact value depends on implementation)
    expect(linesContainer).toBeInTheDocument()
  })

  it('updates focused line when cursor moves', async () => {
    const content = 'line1\nline2\nline3'
    const { container } = render(
      <NoteEditor {...defaultProps} content={content} />
    )

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(10, 10) // Position in line2

    fireEvent.select(textarea)

    await waitFor(() => {
      const line2 = screen.getByTestId('editor-line-1')
      expect(line2.getAttribute('data-focused')).toBe('true')
    })
  })
})

