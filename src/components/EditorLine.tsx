import React from 'react'
import { tokenizeLine } from '../lib/markdown-parser'
import type { ParsedLine, Token } from '../lib/markdown-parser'

interface EditorLineProps {
  line: string
  lineIndex: number
  isFocused: boolean
  cursorCol?: number
  onFocus: (lineIndex: number, col?: number) => void
  className?: string
}

export default function EditorLine({
  line,
  lineIndex,
  isFocused,
  onFocus,
  className = '',
}: EditorLineProps) {
  const parsed: ParsedLine = tokenizeLine(line)

  const handleClick = (e: React.MouseEvent) => {
    // Calculate column from click position
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Approximate column based on character width
    // This is a rough estimate - for better accuracy, we'd need to measure each character
    const charWidth = 8 // Approximate monospace character width
    const col = Math.floor(x / charWidth)

    onFocus(lineIndex, col)
  }

  if (isFocused) {
    // Render raw markdown code
    return (
      <div
        className={`editor-line editor-line-focused ${className} pointer-events-auto`}
        onClick={handleClick}
        style={{ 
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      >
        {line}
      </div>
    )
  }

  // Render parsed tokens
  return (
    <div
      className={`editor-line editor-line-rendered ${className} pointer-events-auto`}
      onClick={handleClick}
      style={{
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}
    >
      {renderTokens(parsed)}
    </div>
  )
}

function renderTokens(parsed: ParsedLine): React.ReactNode {
  const { lineType, tokens } = parsed

  // Handle empty lines
  if (lineType.type === 'empty') {
    return <span className="editor-line-empty">\u00A0</span>
  }

  // Handle code fences - show raw
  if (lineType.type === 'code-fence') {
    return <span className="editor-line-code-fence">{parsed.raw}</span>
  }

  // Handle horizontal rules
  if (lineType.type === 'horizontal-rule') {
    return <hr className="editor-hr" />
  }

  // Build the line content
  const content = tokens.map((token, i) => renderToken(token, i))

  // Wrap with line type styling
  if (lineType.type === 'header') {
    const HeaderTag = `h${lineType.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    return React.createElement(
      HeaderTag,
      { className: `editor-header editor-header-${lineType.level}` },
      content
    )
  }

  if (lineType.type === 'unordered-list') {
    return (
      <div className="editor-list-item editor-list-unordered">
        <span className="editor-list-marker">{lineType.marker}</span>
        <span className="editor-list-content">{content}</span>
      </div>
    )
  }

  if (lineType.type === 'ordered-list') {
    return (
      <div className="editor-list-item editor-list-ordered">
        <span className="editor-list-marker">{lineType.number}.</span>
        <span className="editor-list-content">{content}</span>
      </div>
    )
  }

  if (lineType.type === 'blockquote') {
    return (
      <div className="editor-blockquote">
        <span className="editor-blockquote-marker">&gt;</span>
        <span className="editor-blockquote-content">{content}</span>
      </div>
    )
  }

  // Regular paragraph
  return <div className="editor-paragraph">{content}</div>
}

function renderToken(token: Token, key: number): React.ReactNode {
  switch (token.type) {
    case 'text':
      return <span key={key}>{token.content}</span>

    case 'bold':
      return (
        <strong key={key} className="editor-bold">
          {token.content}
        </strong>
      )

    case 'italic':
      return (
        <em key={key} className="editor-italic">
          {token.content}
        </em>
      )

    case 'code':
      return (
        <code key={key} className="editor-inline-code">
          {token.content}
        </code>
      )

    case 'link':
      return (
        <a
          key={key}
          href={token.url}
          className="editor-link"
          onClick={(e) => {
            // Prevent navigation when in editor mode
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {token.text}
        </a>
      )

    case 'strikethrough':
      return (
        <del key={key} className="editor-strikethrough">
          {token.content}
        </del>
      )

    default: {
      // Fallback for unknown token types - should not happen with current Token type
      const tokenWithContent = token as { content?: string }
      return tokenWithContent.content ? (
        <span key={key}>{tokenWithContent.content}</span>
      ) : null
    }
  }
}

