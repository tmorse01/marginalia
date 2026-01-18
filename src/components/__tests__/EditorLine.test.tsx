import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EditorLine from '../EditorLine'

describe('EditorLine', () => {
  it('renders raw markdown when focused', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    render(
      <EditorLine
        line="**bold**"
        lineIndex={0}
        isFocused={true}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    expect(screen.getByText('**bold**')).toBeInTheDocument()
  })

  it('renders formatted markdown when unfocused', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="**bold**"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const boldElement = container.querySelector('.editor-bold')
    expect(boldElement).toBeInTheDocument()
    expect(boldElement?.textContent).toBe('bold')
    expect(screen.queryByText('**')).not.toBeInTheDocument()
  })

  it('renders headers with correct size when unfocused', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="# Header 1"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const header = container.querySelector('h1.editor-header.editor-header-1')
    expect(header).toBeInTheDocument()
    expect(header?.textContent).toContain('Header 1')
  })

  it('renders links as clickable when unfocused', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="[link text](https://example.com)"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const link = container.querySelector('.editor-link')
    expect(link).toBeInTheDocument()
    expect(link?.textContent).toBe('link text')
    expect(link?.getAttribute('href')).toBe('https://example.com')
  })

  it('calls onFocus when clicked', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="test line"
        lineIndex={5}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const lineElement = container.querySelector('.editor-line')
    if (!lineElement) {
      throw new Error('Expected editor line element to exist')
    }
    fireEvent.click(lineElement)
    expect(onFocus).toHaveBeenCalledWith(5, expect.any(Number))
  })

  it('preserves whitespace and indentation', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="    indented text"
        lineIndex={0}
        isFocused={true}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const lineElement = container.querySelector('.editor-line')
    expect(lineElement?.textContent).toBe('    indented text')
  })

  it('renders italic text when unfocused', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="*italic*"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const italicElement = container.querySelector('.editor-italic')
    expect(italicElement).toBeInTheDocument()
    expect(italicElement?.textContent).toBe('italic')
  })

  it('renders inline code when unfocused', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="`code`"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const codeElement = container.querySelector('.editor-inline-code')
    expect(codeElement).toBeInTheDocument()
    expect(codeElement?.textContent).toBe('code')
  })

  it('renders strikethrough when unfocused', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="~~strikethrough~~"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const delElement = container.querySelector('.editor-strikethrough')
    expect(delElement).toBeInTheDocument()
    expect(delElement?.textContent).toBe('strikethrough')
  })

  it('renders list items correctly', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="- list item"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const listItem = container.querySelector('.editor-list-item')
    expect(listItem).toBeInTheDocument()
    const marker = container.querySelector('.editor-list-marker')
    expect(marker?.textContent).toBe('-')
  })

  it('renders blockquotes correctly', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="> quote"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const blockquote = container.querySelector('.editor-blockquote')
    expect(blockquote).toBeInTheDocument()
  })

  it('renders empty lines', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line=""
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const emptyLine = container.querySelector('.editor-line-empty')
    expect(emptyLine).toBeInTheDocument()
  })

  it('renders code fences as raw', () => {
    const onFocus = vi.fn()
    const onChange = vi.fn()
    const { container } = render(
      <EditorLine
        line="```javascript"
        lineIndex={0}
        isFocused={false}
        onFocus={onFocus}
        onChange={onChange}
      />
    )
    const codeFence = container.querySelector('.editor-line-code-fence')
    expect(codeFence).toBeInTheDocument()
    expect(codeFence?.textContent).toBe('```javascript')
  })
})

