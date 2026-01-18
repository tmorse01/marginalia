import { useEffect, useRef, useState, useCallback } from 'react'
import { getLines, lineColToOffset, getLineNumber } from '../lib/cursor-utils'
import EditorLine from './EditorLine'

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
  showInlinePreview = true,
  onCursorChange,
}: NoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  const [focusedLine, setFocusedLine] = useState<number | null>(null)
  const [editorHeight, setEditorHeight] = useState<number | undefined>(undefined)
  const updateFocusedLineRef = useRef<number | null>(null)

  const lines = getLines(content)
  const isContentEmpty = lines.length === 0 || (lines.length === 1 && lines[0] === '')

  // Consolidated function to update focused line
  const updateFocusedLine = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Cancel any pending update
    if (updateFocusedLineRef.current !== null) {
      cancelAnimationFrame(updateFocusedLineRef.current)
    }

    // Use requestAnimationFrame for smooth updates
    updateFocusedLineRef.current = requestAnimationFrame(() => {
      const cursorPos = textarea.selectionStart
      const currentContent = textarea.value
      const lineNum = getLineNumber(currentContent, cursorPos)
      setFocusedLine(lineNum)

      if (onCursorChange) {
        onCursorChange(textarea.selectionStart, textarea.selectionEnd)
      }

      updateFocusedLineRef.current = null
    })
  }, [onCursorChange])

  // Auto-resize textarea (inline preview uses container height)
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const nextHeight = Math.max(textarea.scrollHeight, 400)
    textarea.style.height = `${nextHeight}px`

    if (showInlinePreview) {
      setEditorHeight(nextHeight)
    }
  }, [content, showInlinePreview])

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
    updateFocusedLine()
  }, [onChange, updateFocusedLine])

  // Handle selection changes
  const handleSelect = useCallback(() => {
    updateFocusedLine()
  }, [updateFocusedLine])

  // Handle key events to update focused line
  const handleKeyDown = useCallback(() => {
    // Update after key press completes
    updateFocusedLine()
  }, [updateFocusedLine])

  // Handle focus on a line (click on rendered line)
  const handleLineFocus = useCallback((lineIndex: number, col?: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    setFocusedLine(lineIndex)

    // Calculate offset and set cursor position
    const offset = lineColToOffset(content, lineIndex, col ?? 0)
    textarea.focus()
    textarea.setSelectionRange(offset, offset)
    
    // Update after setting cursor
    updateFocusedLine()
  }, [content, updateFocusedLine])

  // Track focused line from cursor position - consolidated event listeners
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Use input event for all text changes
    textarea.addEventListener('input', updateFocusedLine)
    // Use selectionchange for cursor movements
    document.addEventListener('selectionchange', updateFocusedLine)
    // Use keyup for keyboard navigation
    textarea.addEventListener('keyup', updateFocusedLine)
    // Use click for mouse clicks
    textarea.addEventListener('click', updateFocusedLine)
    // Use mouseup for drag selections
    textarea.addEventListener('mouseup', updateFocusedLine)

    return () => {
      textarea.removeEventListener('input', updateFocusedLine)
      document.removeEventListener('selectionchange', updateFocusedLine)
      textarea.removeEventListener('keyup', updateFocusedLine)
      textarea.removeEventListener('click', updateFocusedLine)
      textarea.removeEventListener('mouseup', updateFocusedLine)
      
      // Cancel any pending animation frame
      if (updateFocusedLineRef.current !== null) {
        cancelAnimationFrame(updateFocusedLineRef.current)
      }
    }
  }, [updateFocusedLine])

  if (!showInlinePreview) {
    // Simple, reliable textarea mode
    return (
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
        placeholder={placeholder}
        className={`textarea textarea-bordered w-full min-h-[400px] resize-none focus:outline-none focus:border-primary font-mono text-sm bg-base-100 text-base-content ${className}`}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full border border-base-300 rounded-lg bg-base-100 overflow-hidden min-h-[400px] ${className}`}
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
        className="absolute inset-0 w-full h-full resize-none focus:outline-none bg-transparent text-transparent caret-primary selection:bg-primary/20 placeholder:text-base-content/50 overflow-hidden font-mono text-sm leading-6"
        style={{
          padding: '0.75rem 1rem',
          boxSizing: 'border-box',
          zIndex: 2,
        }}
        spellCheck={false}
      />

      {/* Visible line overlay */}
      <div
        ref={linesRef}
        className="absolute inset-0 overflow-auto pointer-events-none font-mono text-sm leading-6"
        style={{
          padding: '0.75rem 1rem',
          boxSizing: 'border-box',
          zIndex: 1,
        }}
      >
        <div className="editor-lines-container">
          {isContentEmpty ? (
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
