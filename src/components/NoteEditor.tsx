import { useEffect, useRef, useState, useCallback } from 'react'
import EditorLine from './EditorLine'
import { getLines, offsetToLineCol, lineColToOffset, getLineNumber } from '../lib/cursor-utils'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  showInlinePreview?: boolean
  onCursorChange?: (start: number, end: number) => void
}

export default function NoteEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  showInlinePreview = false,
  onCursorChange,
}: NoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  const [focusedLine, setFocusedLine] = useState<number | null>(null)
  const [editorHeight, setEditorHeight] = useState<number | undefined>(undefined)

  const lines = getLines(content)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const nextHeight = Math.max(textarea.scrollHeight, 400)
      textarea.style.height = `${nextHeight}px`
      setEditorHeight(nextHeight)
    }
  }, [content])

  // Sync scroll between textarea and visible lines
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (linesRef.current) {
      linesRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }, [])

  // Handle textarea changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    onChange(newContent)

    // Update focused line based on cursor position
    const cursorPos = e.target.selectionStart
    const lineNum = getLineNumber(newContent, cursorPos)
    setFocusedLine(lineNum)

    if (onCursorChange) {
      onCursorChange(e.target.selectionStart, e.target.selectionEnd)
    }
  }, [onChange, onCursorChange])

  // Handle selection changes
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    const cursorPos = target.selectionStart
    const lineNum = getLineNumber(content, cursorPos)
    setFocusedLine(lineNum)

    if (onCursorChange) {
      onCursorChange(target.selectionStart, target.selectionEnd)
    }
  }, [content, onCursorChange])

  // Handle key events to update focused line
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Let default behavior happen first, then update focus
    setTimeout(() => {
      const textarea = textareaRef.current
      if (textarea) {
        const cursorPos = textarea.selectionStart
        const lineNum = getLineNumber(content, cursorPos)
        setFocusedLine(lineNum)

        if (onCursorChange) {
          onCursorChange(textarea.selectionStart, textarea.selectionEnd)
        }
      }
    }, 0)
  }, [content, onCursorChange])

  // Handle focus on a line (click on rendered line)
  const handleLineFocus = useCallback((lineIndex: number, col?: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    setFocusedLine(lineIndex)

    // Calculate offset and set cursor position
    const offset = lineColToOffset(content, lineIndex, col ?? 0)
    textarea.focus()
    textarea.setSelectionRange(offset, offset)
  }, [content])

  // Track focused line from cursor position
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const updateFocusedLine = () => {
      const cursorPos = textarea.selectionStart
      const lineNum = getLineNumber(content, cursorPos)
      setFocusedLine(lineNum)
    }

    textarea.addEventListener('keyup', updateFocusedLine)
    textarea.addEventListener('click', updateFocusedLine)

    return () => {
      textarea.removeEventListener('keyup', updateFocusedLine)
      textarea.removeEventListener('click', updateFocusedLine)
    }
  }, [content])

  if (!showInlinePreview) {
    // Simple, reliable textarea mode
    useEffect(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.max(textarea.scrollHeight, 400)}px`
      }
    }, [content])

    return (
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
        placeholder={placeholder}
        className={`textarea textarea-bordered w-full min-h-[400px] resize-none focus:outline-none focus:border-primary font-mono text-sm bg-base-100 text-base-content ${className}`}
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
        }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full border border-base-300 rounded-lg bg-base-100 overflow-hidden ${className}`}
      style={editorHeight ? { height: `${editorHeight}px` } : undefined}
    >
      {/* Hidden textarea for input handling */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="absolute inset-0 w-full h-full resize-none focus:outline-none bg-transparent text-transparent caret-primary selection:bg-primary/20 placeholder:text-base-content/50"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          padding: '0.75rem 1rem',
          zIndex: 2,
        }}
        spellCheck={false}
      />

      {/* Visible line overlay */}
      <div
        ref={linesRef}
        className="absolute inset-0 overflow-auto pointer-events-none"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          zIndex: 1,
        }}
      >
        <div className="editor-lines-container" style={{ padding: '0.75rem 1rem' }}>
          {lines.length === 0 ? (
            <div className="editor-line editor-line-empty text-base-content/50 pointer-events-auto">
              {placeholder}
            </div>
          ) : (
            lines.map((line, index) => (
              <EditorLine
                key={index}
                line={line}
                lineIndex={index}
                isFocused={focusedLine === index}
                onFocus={handleLineFocus}
                className="editor-line-wrapper"
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
