import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { getLines, lineColToOffset } from '../lib/cursor-utils'
import { useInlineEditorFlag } from '../lib/feature-flags'

interface UseNoteEditorOptions {
  content: string
  onChange: (content: string) => void
  onCursorChange?: (start: number, end: number) => void
}

interface UseNoteEditorReturn {
  // Feature flag
  enableInlineEditor: boolean
  
  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  
  // State
  focusedLine: number | null
  cursorCol: number | undefined
  
  // Computed
  lines: Array<string>
  
  // Event handlers for inline editor
  handleLineFocus: (lineIndex: number, col?: number) => void
  handleLineChange: (lineIndex: number, newRawLine: string) => void
  handleKeyDown: (e: React.KeyboardEvent, lineIndex: number) => void
  handlePaste: (e: React.ClipboardEvent, lineIndex: number) => void
  handleContainerClick: () => void
  
  // Event handlers for textarea fallback
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleTextareaSelect: () => void
  handleTextareaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export function useNoteEditor({
  content,
  onChange,
  onCursorChange,
}: UseNoteEditorOptions): UseNoteEditorReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusedLine, setFocusedLine] = useState<number | null>(null)
  const [cursorCol, setCursorCol] = useState<number | undefined>(undefined)
  
  // Get feature flag from Convex (runtime) or env var (build-time)
  const enableInlineEditor = useInlineEditorFlag()

  // Split content into lines
  const lines = useMemo(() => {
    if (!content) return ['']
    return getLines(content)
  }, [content])

  // Handle line focus
  const handleLineFocus = useCallback(
    (lineIndex: number, col?: number) => {
      setFocusedLine(lineIndex)
      setCursorCol(col)
      
      // Calculate cursor offset for onCursorChange
      if (onCursorChange) {
        const offset = lineColToOffset(content, lineIndex, col ?? 0)
        onCursorChange(offset, offset)
      }
    },
    [content, onCursorChange]
  )

  // Handle line change (when content is edited)
  const handleLineChange = useCallback(
    (lineIndex: number, newRawLine: string) => {
      const newLines = [...lines]
      newLines[lineIndex] = newRawLine
      const newContent = newLines.join('\n')
      onChange(newContent)
    },
    [lines, onChange]
  )

  // Handle key down events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, lineIndex: number) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        
        // Get current line content
        const currentLine = lines[lineIndex] || ''
        
        // Determine indentation/prefix to carry over
        let prefix = ''
        
        // Check for list markers
        const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+/)
        if (listMatch) {
          prefix = listMatch[1] + listMatch[2] + ' '
        }
        // Check for blockquote
        else if (currentLine.match(/^>+\s*/)) {
          const blockquoteMatch = currentLine.match(/^(>+)\s*/)
          if (blockquoteMatch) {
            prefix = blockquoteMatch[1] + ' '
          }
        }
        
        // Insert new line
        const newLines = [...lines]
        const beforeCursor = currentLine.slice(0, cursorCol ?? currentLine.length)
        const afterCursor = currentLine.slice(cursorCol ?? currentLine.length)
        
        newLines[lineIndex] = beforeCursor
        newLines.splice(lineIndex + 1, 0, prefix + afterCursor)
        
        onChange(newLines.join('\n'))
        
        // Focus the new line
        setTimeout(() => {
          setFocusedLine(lineIndex + 1)
          setCursorCol(prefix.length)
        }, 0)
      } else if (e.key === 'Backspace' && cursorCol === 0 && lineIndex > 0) {
        // Merge with previous line
        e.preventDefault()
        
        const newLines = [...lines]
        const prevLine = newLines[lineIndex - 1]
        const currentLine = newLines[lineIndex] || ''
        
        newLines[lineIndex - 1] = prevLine + currentLine
        newLines.splice(lineIndex, 1)
        
        onChange(newLines.join('\n'))
        
        // Focus previous line at the merge point
        setTimeout(() => {
          setFocusedLine(lineIndex - 1)
          setCursorCol(prevLine.length)
        }, 0)
      } else if (e.key === 'ArrowUp' && lineIndex > 0) {
        // Move to previous line, maintain column
        e.preventDefault()
        const prevLine = lines[lineIndex - 1] || ''
        const targetCol = Math.min(cursorCol ?? 0, prevLine.length)
        setFocusedLine(lineIndex - 1)
        setCursorCol(targetCol)
      } else if (e.key === 'ArrowDown' && lineIndex < lines.length - 1) {
        // Move to next line, maintain column
        e.preventDefault()
        const nextLine = lines[lineIndex + 1] || ''
        const targetCol = Math.min(cursorCol ?? 0, nextLine.length)
        setFocusedLine(lineIndex + 1)
        setCursorCol(targetCol)
      } else if (e.key === 'Tab') {
        // Handle tab for indentation
        e.preventDefault()
        const currentLine = lines[lineIndex] || ''
        const indent = '  ' // 2 spaces
        
        if (e.shiftKey) {
          // Shift+Tab: unindent
          if (currentLine.startsWith('  ')) {
            const newLine = currentLine.slice(2)
            handleLineChange(lineIndex, newLine)
            setCursorCol(Math.max(0, (cursorCol ?? 0) - 2))
          } else if (currentLine.startsWith('\t')) {
            const newLine = currentLine.slice(1)
            handleLineChange(lineIndex, newLine)
            setCursorCol(Math.max(0, (cursorCol ?? 0) - 1))
          }
        } else {
          // Tab: indent
          const newLine = indent + currentLine
          handleLineChange(lineIndex, newLine)
          setCursorCol((cursorCol ?? 0) + indent.length)
        }
      }
    },
    [lines, cursorCol, onChange, handleLineChange]
  )

  // Handle paste events
  const handlePaste = useCallback(
    (e: React.ClipboardEvent, lineIndex: number) => {
      e.preventDefault()
      
      const pastedText = e.clipboardData.getData('text/plain')
      const currentLine = lines[lineIndex] || ''
      
      // Insert pasted text at cursor position
      const beforeCursor = currentLine.slice(0, cursorCol ?? currentLine.length)
      const afterCursor = currentLine.slice(cursorCol ?? currentLine.length)
      const newLine = beforeCursor + pastedText + afterCursor
      
      handleLineChange(lineIndex, newLine)
      
      // Update cursor position
      const newCol = (cursorCol ?? 0) + pastedText.length
      setCursorCol(newCol)
    },
    [lines, cursorCol, handleLineChange]
  )

  // Update cursor offset when focused line or column changes
  useEffect(() => {
    if (focusedLine !== null && onCursorChange) {
      const offset = lineColToOffset(content, focusedLine, cursorCol ?? 0)
      onCursorChange(offset, offset)
    }
  }, [focusedLine, cursorCol, content, onCursorChange])

  // Handle container click to focus
  const handleContainerClick = useCallback(() => {
    if (focusedLine === null && lines.length > 0) {
      setFocusedLine(lines.length - 1)
      setCursorCol(lines[lines.length - 1]?.length ?? 0)
    }
  }, [focusedLine, lines])

  // Textarea event handlers (for fallback mode)
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleTextareaSelect = useCallback(() => {
    if (textareaRef.current && onCursorChange) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      onCursorChange(start, end)
    }
  }, [onCursorChange])

  const handleTextareaKeyDown = useCallback(
    (_e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Update cursor on any key that might change selection
      if (onCursorChange) {
        // Use setTimeout to get updated selection after browser processes the key
        setTimeout(() => {
          if (textareaRef.current) {
            const start = textareaRef.current.selectionStart
            const end = textareaRef.current.selectionEnd
            onCursorChange(start, end)
          }
        }, 0)
      }
    },
    [onCursorChange]
  )

  return {
    enableInlineEditor,
    textareaRef,
    containerRef,
    focusedLine,
    cursorCol,
    lines,
    handleLineFocus,
    handleLineChange,
    handleKeyDown,
    handlePaste,
    handleContainerClick,
    handleTextareaChange,
    handleTextareaSelect,
    handleTextareaKeyDown,
  }
}
