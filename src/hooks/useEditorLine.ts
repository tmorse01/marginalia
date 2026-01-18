import { useRef, useState, useEffect, useCallback } from 'react'
import { extractTextFromRenderedLine, getRawOffsetFromRendered, getRenderedOffsetFromRaw } from '../lib/editor-content-utils'
import { findTextNodeAtOffset, getRenderedTextOffsetUpToRange } from '../lib/editor-utils'
import { tokenizeLine } from '../lib/markdown-parser'

interface UseEditorLineOptions {
  line: string
  lineIndex: number
  isFocused: boolean
  cursorCol?: number
  onFocus: (lineIndex: number, col?: number) => void
  onChange: (lineIndex: number, newLine: string) => void
  onKeyDown?: (e: React.KeyboardEvent, lineIndex: number) => void
  onPaste?: (e: React.ClipboardEvent, lineIndex: number) => void
}

interface UseEditorLineReturn {
  lineRef: React.RefObject<HTMLDivElement>
  isComposing: boolean
  handleInput: (e: React.FormEvent<HTMLDivElement>) => void
  handleCompositionStart: (e: React.CompositionEvent<HTMLDivElement>) => void
  handleCompositionEnd: (e: React.CompositionEvent<HTMLDivElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void
  handleFocus: () => void
  handleClick: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function useEditorLine({
  line,
  lineIndex,
  isFocused,
  cursorCol,
  onFocus,
  onChange,
  onKeyDown,
  onPaste,
}: UseEditorLineOptions): UseEditorLineReturn {
  const lineRef = useRef<HTMLDivElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  // Handle input events - extract markdown from rendered content
  const handleInput = useCallback(
    (_e: React.FormEvent<HTMLDivElement>) => {
      if (!lineRef.current || isComposing) {
        console.log(`[useEditorLine:${lineIndex}] Input skipped - no ref or composing:`, {
          hasRef: !!lineRef.current,
          isComposing,
        })
        return
      }

      const newRawLine = extractTextFromRenderedLine(lineRef.current)
      console.log(`[useEditorLine:${lineIndex}] Input detected, extracted markdown:`, {
        oldLine: line,
        newRawLine,
        changed: line !== newRawLine,
      })
      onChange(lineIndex, newRawLine)
    },
    [lineIndex, onChange, isComposing, line]
  )

  // Handle composition start (for IME input)
  const handleCompositionStart = useCallback((_e: React.CompositionEvent<HTMLDivElement>) => {
    setIsComposing(true)
  }, [])

  // Handle composition end
  const handleCompositionEnd = useCallback(
    (_e: React.CompositionEvent<HTMLDivElement>) => {
      console.log(`[useEditorLine:${lineIndex}] Composition ended`)
      setIsComposing(false)
      if (lineRef.current) {
        const newRawLine = extractTextFromRenderedLine(lineRef.current)
        console.log(`[useEditorLine:${lineIndex}] Composition end - extracted markdown:`, newRawLine)
        onChange(lineIndex, newRawLine)
      }
    },
    [lineIndex, onChange]
  )

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) {
        onKeyDown(e, lineIndex)
      }
    },
    [onKeyDown, lineIndex]
  )

  // Handle paste
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (onPaste) {
        onPaste(e, lineIndex)
      }
    },
    [onPaste, lineIndex]
  )

  // Handle focus
  const handleFocus = useCallback(() => {
    onFocus(lineIndex, cursorCol)
  }, [onFocus, lineIndex, cursorCol])

  // Handle click to set cursor position
  const handleClick = useCallback(
    (_e: React.MouseEvent<HTMLDivElement>) => {
      if (!lineRef.current) {
        console.log(`[useEditorLine:${lineIndex}] Click - no ref`)
        return
      }

      // Use a small delay to let the browser's native selection settle
      // This is especially important when the line becomes focused and DOM changes
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
          console.log(`[useEditorLine:${lineIndex}] Click - no selection after delay`)
          return
        }

        const range = selection.getRangeAt(0)
        
        // Verify the range is within our line element
        if (!lineRef.current?.contains(range.commonAncestorContainer)) {
          console.log(`[useEditorLine:${lineIndex}] Click - selection outside line`)
          return
        }
        
        // Calculate rendered offset from the selection
        // Use the same method as findTextNodeAtOffset to ensure consistency
        const renderedOffset = getRenderedTextOffsetUpToRange(lineRef.current, range)
        
        // Parse the line to get token structure
        const parsed = tokenizeLine(line)
        
        // Convert rendered offset to raw column
        // Use the current focus state - if line just became focused, isFocused should be true now
        const currentIsFocused = lineRef.current.contentEditable === 'true'
        const rawCol = getRawOffsetFromRendered(parsed, renderedOffset, currentIsFocused)

        console.log(`[useEditorLine:${lineIndex}] Click - setting cursor to col:`, rawCol, {
          renderedOffset,
          rawCol,
          wasFocused: isFocused,
          nowFocused: currentIsFocused,
          currentCursorCol: cursorCol,
        })
        
        // Update the cursor column
        // The useEffect will then set the cursor position programmatically to ensure accuracy
        onFocus(lineIndex, rawCol)
      }, 0) // No delay needed - let the useEffect handle cursor positioning
    },
    [onFocus, lineIndex, cursorCol, line, isFocused]
  )

  // Set cursor position when focused or cursorCol changes
  // This is used for keyboard navigation and programmatic cursor setting
  // For clicks, we let the browser's native selection work and then extract the column
  useEffect(() => {
    if (!lineRef.current || !isFocused || cursorCol === undefined) {
      console.log(`[useEditorLine:${lineIndex}] Cursor position effect skipped:`, {
        hasRef: !!lineRef.current,
        isFocused,
        cursorCol,
      })
      return
    }

    console.log(`[useEditorLine:${lineIndex}] Setting cursor position:`, {
      rawCol: cursorCol,
      isFocused,
      line,
    })

    const setCursorPosition = () => {
      const selection = window.getSelection()
      if (!selection || !lineRef.current) {
        console.log(`[useEditorLine:${lineIndex}] No selection available`)
        return
      }

      // Check if the current selection is already at the correct position
      // This prevents overriding the browser's native selection from clicks
      // But we require an EXACT match - any mismatch will be corrected
      if (selection.rangeCount > 0) {
        const currentRange = selection.getRangeAt(0)
        if (lineRef.current.contains(currentRange.commonAncestorContainer)) {
          // Calculate what the current selection's raw column is
          // Use the same method as findTextNodeAtOffset to ensure consistency
          const currentRenderedOffset = getRenderedTextOffsetUpToRange(lineRef.current, currentRange)
          
          // Parse and convert to raw column
          const parsed = tokenizeLine(line)
          const currentRawCol = getRawOffsetFromRendered(parsed, currentRenderedOffset, isFocused)
          
          // Only skip if it's an EXACT match - any mismatch must be corrected
          if (currentRawCol === cursorCol) {
            console.log(`[useEditorLine:${lineIndex}] Cursor already at correct position (exact match), skipping:`, {
              currentRawCol,
              targetRawCol: cursorCol,
            })
            return
          } else {
            console.log(`[useEditorLine:${lineIndex}] Cursor position mismatch, correcting:`, {
              currentRawCol,
              targetRawCol: cursorCol,
              difference: Math.abs(currentRawCol - cursorCol),
            })
          }
        }
      }

      // Parse the line to use token-based conversion (same as click handler)
      const parsed = tokenizeLine(line)
      
      // Map raw markdown cursorCol to rendered DOM position using token-based conversion
      // This ensures consistency with getRawOffsetFromRendered used in click handler
      const renderedOffset = getRenderedOffsetFromRaw(parsed, cursorCol, isFocused)
      console.log(`[useEditorLine:${lineIndex}] Mapped cursor position:`, {
        rawCol: cursorCol,
        renderedOffset,
        isFocused,
      })

      // Find the text node and offset in the DOM
      const { node, offset } = findTextNodeAtOffset(lineRef.current, renderedOffset)
      console.log(`[useEditorLine:${lineIndex}] Found text node:`, {
        hasNode: !!node,
        nodeType: node?.nodeType,
        offset,
        nodeText: node?.textContent?.substring(0, 20),
      })

      if (node) {
        const range = document.createRange()
        range.setStart(node, offset)
        range.collapse(true)

        selection.removeAllRanges()
        selection.addRange(range)
        console.log(`[useEditorLine:${lineIndex}] Cursor position set successfully`)
      } else {
        console.warn(`[useEditorLine:${lineIndex}] Failed to find text node for cursor position`)
      }
    }

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(setCursorPosition, 0)
    return () => clearTimeout(timeoutId)
  }, [isFocused, cursorCol, line, lineIndex])

  return {
    lineRef: lineRef as React.RefObject<HTMLDivElement>,
    isComposing,
    handleInput,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    handlePaste,
    handleFocus,
    handleClick,
  }
}
