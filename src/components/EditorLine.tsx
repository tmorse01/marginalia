import React, { useMemo, useRef, useEffect, useState } from 'react'
import { tokenizeLine } from '../lib/markdown-parser'
import type { ParsedLine, Token } from '../lib/markdown-parser'
import { measureCharWidth, clickPositionToColumn } from '../lib/cursor-utils'

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
  const parsed: ParsedLine = useMemo(() => tokenizeLine(line), [line])
  const lineRef = useRef<HTMLDivElement>(null)
  const [charWidth, setCharWidth] = useState<number | null>(null)

  // Measure actual character width on mount and when font changes
  useEffect(() => {
    if (!lineRef.current) return

    const fontSize = parseFloat(getComputedStyle(lineRef.current).fontSize)
    const fontFamily = getComputedStyle(lineRef.current).fontFamily
    const measuredWidth = measureCharWidth(fontSize, fontFamily)
    setCharWidth(measuredWidth)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Get padding from computed styles
    const styles = getComputedStyle(target)
    const paddingLeft = parseFloat(styles.paddingLeft) || 0

    // Use measured width if available, otherwise fallback
    const width = charWidth || 8.4 // Fallback to approximate width
    const col = clickPositionToColumn(x, paddingLeft, width)

    onFocus(lineIndex, col)
  }

  // Always render tokens, but overlay syntax markers when focused
  return (
    <div
      ref={lineRef}
      className={`editor-line ${isFocused ? 'editor-line-focused' : 'editor-line-rendered'} ${className} pointer-events-auto`}
      onClick={handleClick}
      style={{
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}
    >
      {renderTokensWithSyntax(parsed, isFocused)}
    </div>
  )
}

function renderTokensWithSyntax(parsed: ParsedLine, showSyntax: boolean): React.ReactNode {
  const { lineType, tokens } = parsed

  // Handle empty lines
  if (lineType.type === 'empty') {
    return <span className="editor-line-empty">\u00A0</span>
  }

  // Handle code fences - always show raw
  if (lineType.type === 'code-fence') {
    return <span className="editor-line-code-fence">{parsed.raw}</span>
  }

  // Handle horizontal rules
  if (lineType.type === 'horizontal-rule') {
    return <hr className="editor-hr" />
  }

  // Build the line content with syntax markers when focused
  const content = tokens.map((token, i) => renderTokenWithSyntax(token, i, showSyntax))

  // Wrap with line type styling and add syntax markers when focused
  if (lineType.type === 'header') {
    const HeaderTag = `h${lineType.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    const headerPrefix = showSyntax ? '#'.repeat(lineType.level) + ' ' : null
    return React.createElement(
      HeaderTag,
      { className: `editor-header editor-header-${lineType.level}` },
      <>
        {headerPrefix && <span className="editor-syntax-marker">{headerPrefix}</span>}
        {content}
      </>
    )
  }

  if (lineType.type === 'unordered-list') {
    const listPrefix = showSyntax ? `${lineType.marker} ` : null
    return (
      <div className="editor-list-item editor-list-unordered">
        <span className="editor-list-marker">
          {listPrefix ? <span className="editor-syntax-marker">{listPrefix}</span> : lineType.marker}
        </span>
        <span className="editor-list-content">{content}</span>
      </div>
    )
  }

  if (lineType.type === 'ordered-list') {
    const listPrefix = showSyntax ? `${lineType.number}. ` : null
    return (
      <div className="editor-list-item editor-list-ordered">
        <span className="editor-list-marker">
          {listPrefix ? <span className="editor-syntax-marker">{listPrefix}</span> : `${lineType.number}.`}
        </span>
        <span className="editor-list-content">{content}</span>
      </div>
    )
  }

  if (lineType.type === 'blockquote') {
    const blockquotePrefix = showSyntax ? '> ' : null
    return (
      <div className="editor-blockquote">
        <span className="editor-blockquote-marker">
          {blockquotePrefix ? <span className="editor-syntax-marker">{blockquotePrefix}</span> : '>'}
        </span>
        <span className="editor-blockquote-content">{content}</span>
      </div>
    )
  }

  // Regular paragraph
  return <div className="editor-paragraph">{content}</div>
}

function renderTokenWithSyntax(token: Token, key: number, showSyntax: boolean): React.ReactNode {
  switch (token.type) {
    case 'text':
      return <span key={key}>{token.content}</span>

    case 'bold':
      // Extract the markers from raw (could be ** or __)
      const boldMarkers = showSyntax && token.raw ? extractBoldMarkers(token.raw) : null
      return (
        <strong key={key} className="editor-bold">
          {boldMarkers && <span className="editor-syntax-marker">{boldMarkers[0]}</span>}
          {token.content}
          {boldMarkers && <span className="editor-syntax-marker">{boldMarkers[1]}</span>}
        </strong>
      )

    case 'italic':
      // Extract the markers from raw (could be * or _)
      const italicMarkers = showSyntax && token.raw ? extractItalicMarkers(token.raw) : null
      return (
        <em key={key} className="editor-italic">
          {italicMarkers && <span className="editor-syntax-marker">{italicMarkers[0]}</span>}
          {token.content}
          {italicMarkers && <span className="editor-syntax-marker">{italicMarkers[1]}</span>}
        </em>
      )

    case 'code':
      // Extract backticks from raw
      const codeMarkers = showSyntax && token.raw ? extractCodeMarkers(token.raw) : null
      return (
        <code key={key} className="editor-inline-code">
          {codeMarkers && <span className="editor-syntax-marker">{codeMarkers[0]}</span>}
          {token.content}
          {codeMarkers && <span className="editor-syntax-marker">{codeMarkers[1]}</span>}
        </code>
      )

    case 'link':
      // Show [text](url) syntax when focused, but keep link styling
      if (showSyntax) {
        return (
          <span key={key} className="editor-link">
            <span className="editor-syntax-marker">[</span>
            <span className="editor-link-text">{token.text}</span>
            <span className="editor-syntax-marker">](</span>
            <span className="editor-syntax-marker">{token.url}</span>
            <span className="editor-syntax-marker">)</span>
          </span>
        )
      }
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
      const strikethroughMarkers = showSyntax ? ['~~', '~~'] : null
      return (
        <del key={key} className="editor-strikethrough">
          {strikethroughMarkers && <span className="editor-syntax-marker">{strikethroughMarkers[0]}</span>}
          {token.content}
          {strikethroughMarkers && <span className="editor-syntax-marker">{strikethroughMarkers[1]}</span>}
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

// Helper functions to extract syntax markers from raw markdown
function extractBoldMarkers(raw: string): [string, string] | null {
  if (raw.startsWith('**') && raw.endsWith('**')) {
    return ['**', '**']
  }
  if (raw.startsWith('__') && raw.endsWith('__')) {
    return ['__', '__']
  }
  return null
}

function extractItalicMarkers(raw: string): [string, string] | null {
  if (raw.startsWith('*') && raw.endsWith('*') && !raw.startsWith('**')) {
    return ['*', '*']
  }
  if (raw.startsWith('_') && raw.endsWith('_') && !raw.startsWith('__')) {
    return ['_', '_']
  }
  return null
}

function extractCodeMarkers(raw: string): [string, string] | null {
  // Find the opening backticks
  let start = 0
  while (start < raw.length && raw[start] === '`') {
    start++
  }
  if (start === 0) return null

  // Find the closing backticks
  let end = raw.length - 1
  let closingCount = 0
  while (end >= 0 && raw[end] === '`') {
    closingCount++
    end--
  }
  if (closingCount === 0) return null

  const opening = raw.slice(0, start)
  const closing = raw.slice(end + 1)
  return [opening, closing]
}

