import React, { useMemo } from 'react'
import { tokenizeLine } from '../lib/markdown-parser'
import { useEditorLine } from '../hooks/useEditorLine'
import {
  EditorText,
  EditorBold,
  EditorItalic,
  EditorCode,
  EditorLink,
  EditorStrikethrough,
  EditorHeader,
  EditorList,
  EditorBlockquote,
  EditorCodeFence,
  EditorHorizontalRule,
  EditorParagraph,
  EditorEmptyLine,
} from './editor-elements'
import type { ParsedLine, Token } from '../lib/markdown-parser'


interface EditorLineProps {
  line: string
  lineIndex: number
  isFocused: boolean
  cursorCol?: number
  onFocus: (lineIndex: number, col?: number) => void
  onChange: (lineIndex: number, newLine: string) => void
  onKeyDown?: (e: React.KeyboardEvent, lineIndex: number) => void
  onPaste?: (e: React.ClipboardEvent, lineIndex: number) => void
  className?: string
  diffState?: 'added' | 'removed' // For inline diff highlighting
}

export default function EditorLine({
  line,
  lineIndex,
  isFocused,
  cursorCol,
  onFocus,
  onChange,
  onKeyDown,
  onPaste,
  className = '',
  diffState,
}: EditorLineProps) {
  const parsed: ParsedLine = useMemo(() => {
    const result = tokenizeLine(line)
    console.log(`[EditorLine:${lineIndex}] Parsed line:`, {
      line,
      lineType: result.lineType,
      tokenCount: result.tokens.length,
      tokens: result.tokens.map((t) => ({ 
        type: t.type, 
        content: t.type === 'link' ? t.text.substring(0, 20) : t.content.substring(0, 20) 
      })),
    })
    return result
  }, [line, lineIndex])

  const editorHook = useEditorLine({
    line,
    lineIndex,
    isFocused,
    cursorCol,
    onFocus,
    onChange,
    onKeyDown,
    onPaste,
  })

  // Render the line content using element components
  const renderedContent = useMemo(() => {
    console.log(`[EditorLine:${lineIndex}] Rendering content:`, {
      isFocused,
      lineType: parsed.lineType.type,
      tokenCount: parsed.tokens.length,
    })
    return renderLineContent(parsed, isFocused)
  }, [parsed, isFocused, lineIndex])

  // Get diff styling classes
  const getDiffClasses = () => {
    if (diffState === 'removed') {
      return 'bg-error/20 border-l-2 border-error opacity-75'
    } else if (diffState === 'added') {
      return 'bg-success/20 border-l-2 border-success'
    }
    return ''
  }

  return (
    <div
      ref={editorHook.lineRef}
      contentEditable={isFocused && lineIndex >= 0 && diffState !== 'added'} // Don't allow editing preview lines or added diff lines
      suppressContentEditableWarning
      className={`editor-line ${isFocused ? 'editor-line-focused' : 'editor-line-rendered'} ${getDiffClasses()} ${className}`}
      onInput={editorHook.handleInput}
      onCompositionStart={editorHook.handleCompositionStart}
      onCompositionEnd={editorHook.handleCompositionEnd}
      onKeyDown={editorHook.handleKeyDown}
      onPaste={editorHook.handlePaste}
      onFocus={editorHook.handleFocus}
      onClick={editorHook.handleClick}
      style={{
        fontSize: '0.875rem',
        lineHeight: '1.5',
        outline: 'none',
        minHeight: '1.5em',
        ...(diffState === 'added' ? { pointerEvents: 'none', userSelect: 'none' } : {}),
      }}
      data-is-focused={isFocused}
      data-line-index={lineIndex}
    >
      {diffState === 'removed' && (
        <span className="text-error/60 mr-2 select-none">-</span>
      )}
      {diffState === 'added' && (
        <span className="text-success/60 mr-2 select-none">+</span>
      )}
      {renderedContent}
    </div>
  )
}

function renderLineContent(parsed: ParsedLine, showSyntax: boolean): React.ReactNode {
  const { lineType, tokens } = parsed

  console.log(`[renderLineContent] Rendering:`, {
    lineType: lineType.type,
    showSyntax,
    tokenCount: tokens.length,
  })

  // Handle empty lines
  if (lineType.type === 'empty') {
    return <EditorEmptyLine />
  }

  // Handle code fences - always show raw
  if (lineType.type === 'code-fence') {
    return <EditorCodeFence raw={parsed.raw} language={lineType.language} />
  }

  // Handle horizontal rules
  if (lineType.type === 'horizontal-rule') {
    return <EditorHorizontalRule />
  }

  // Build the line content by mapping tokens to element components
  const content = tokens.map((token, i) => renderToken(token, i, showSyntax))

  // Wrap with line type styling and add syntax markers when focused
  if (lineType.type === 'header') {
    console.log(`[renderLineContent] Rendering header level ${lineType.level}:`, {
      showSyntax,
      contentLength: Array.isArray(content) ? content.length : 'not array',
      contentType: typeof content,
      contentItems: Array.isArray(content)
        ? content.map((item, i) => ({
            index: i,
            type: typeof item,
            isElement: React.isValidElement(item),
            props: React.isValidElement(item) ? Object.keys(item.props || {}) : 'N/A',
          }))
        : 'not array',
      rawLine: parsed.raw,
      tokens: tokens.map((t) => ({ 
        type: t.type, 
        content: t.type === 'link' ? t.text.substring(0, 30) : t.content.substring(0, 30) 
      })),
    })
    return (
      <EditorHeader level={lineType.level} showSyntax={showSyntax}>
        {content}
      </EditorHeader>
    )
  }

  if (lineType.type === 'unordered-list') {
    return (
      <EditorList
        type="unordered"
        marker={lineType.marker}
        content={content}
        showSyntax={showSyntax}
      />
    )
  }

  if (lineType.type === 'ordered-list') {
    return (
      <EditorList
        type="ordered"
        number={lineType.number}
        content={content}
        showSyntax={showSyntax}
      />
    )
  }

  if (lineType.type === 'blockquote') {
    return (
      <EditorBlockquote indent={lineType.indent} content={content} showSyntax={showSyntax} />
    )
  }

  // Regular paragraph
  return <EditorParagraph content={content} />
}

function renderToken(token: Token, key: number, showSyntax: boolean): React.ReactNode {
  console.log(`[renderToken:${key}] Rendering:`, {
    type: token.type,
    showSyntax,
    content: token.type === 'link' ? token.text.substring(0, 30) : token.content.substring(0, 30),
    hasRaw: 'raw' in token && !!token.raw,
  })

  switch (token.type) {
    case 'text':
      return <EditorText key={key} content={token.content} />

    case 'bold':
      return (
        <EditorBold
          key={key}
          content={token.content}
          raw={token.raw}
          showSyntax={showSyntax}
        />
      )

    case 'italic':
      return (
        <EditorItalic
          key={key}
          content={token.content}
          raw={token.raw}
          showSyntax={showSyntax}
        />
      )

    case 'code':
      return (
        <EditorCode
          key={key}
          content={token.content}
          raw={token.raw}
          showSyntax={showSyntax}
        />
      )

    case 'link':
      return (
        <EditorLink
          key={key}
          text={token.text}
          url={token.url}
          raw={token.raw}
          showSyntax={showSyntax}
        />
      )

    case 'strikethrough':
      return (
        <EditorStrikethrough
          key={key}
          content={token.content}
          raw={token.raw}
          showSyntax={showSyntax}
        />
      )

    default: {
      // Fallback for unknown token types
      const tokenWithContent = token as { content?: string }
      return tokenWithContent.content ? (
        <EditorText key={key} content={tokenWithContent.content} />
      ) : null
    }
  }
}
