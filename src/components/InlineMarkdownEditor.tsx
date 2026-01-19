import { useEffect } from 'react'
import { calculateDiff } from '../lib/diff-utils'
import EditorLine from './EditorLine'
import type { DiffResult } from '../lib/diff-utils'

interface InlineMarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  onCursorChange?: (start: number, end: number) => void
  suggestedContent?: string
  onApplySuggestion?: () => void
  onDismissSuggestion?: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
  focusedLine: number | null
  cursorCol: number | undefined
  lines: Array<string>
  handleLineFocus: (lineIndex: number, col?: number) => void
  handleLineChange: (lineIndex: number, newLine: string) => void
  handleKeyDown: (e: React.KeyboardEvent, lineIndex: number) => void
  handlePaste: (e: React.ClipboardEvent, lineIndex: number) => void
  handleContainerClick: () => void
}

export default function InlineMarkdownEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  onCursorChange,
  suggestedContent,
  onApplySuggestion,
  onDismissSuggestion,
  containerRef,
  focusedLine,
  cursorCol,
  lines,
  handleLineFocus,
  handleLineChange,
  handleKeyDown,
  handlePaste,
  handleContainerClick,
}: InlineMarkdownEditorProps) {
  // Calculate diff if suggested content is provided
  const diff = suggestedContent ? calculateDiff(content, suggestedContent) : null
  const shouldShowDiff = diff?.hasChanges ?? false

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!diff?.hasChanges || !onApplySuggestion || !onDismissSuggestion) return

    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      // Escape to dismiss (works everywhere)
      if (e.key === 'Escape') {
        e.preventDefault()
        onDismissSuggestion()
      }
      // Ctrl/Cmd + Enter to apply (only when not typing in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isInputElement) {
        e.preventDefault()
        onApplySuggestion()
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcut)
    return () => window.removeEventListener('keydown', handleKeyboardShortcut)
  }, [diff, onApplySuggestion, onDismissSuggestion])

  // Map original line indices to diff state and track added lines
  const lineDiffMap = new Map<number, 'removed' | 'unchanged'>()
  const addedLinesAfter = new Map<number, Array<string>>()
  
  if (shouldShowDiff && diff) {
    let originalLineIndex = 0
    let currentRemovedIndex: number | null = null
    
    diff.lines.forEach((diffLine) => {
      if (diffLine.type === 'removed') {
        lineDiffMap.set(originalLineIndex, 'removed')
        currentRemovedIndex = originalLineIndex
        originalLineIndex++
      } else if (diffLine.type === 'added') {
        // Attach added lines to the most recent removed line
        if (currentRemovedIndex !== null) {
          if (!addedLinesAfter.has(currentRemovedIndex)) {
            addedLinesAfter.set(currentRemovedIndex, [])
          }
          addedLinesAfter.get(currentRemovedIndex)?.push(diffLine.content)
        } else {
          // Added at the beginning or after unchanged lines
          const attachIndex = originalLineIndex > 0 ? originalLineIndex - 1 : 0
          if (!addedLinesAfter.has(attachIndex)) {
            addedLinesAfter.set(attachIndex, [])
          }
          addedLinesAfter.get(attachIndex)?.push(diffLine.content)
        }
      } else {
        // Unchanged line
        lineDiffMap.set(originalLineIndex, 'unchanged')
        currentRemovedIndex = null
        originalLineIndex++
      }
    })
  }

  // Show placeholder when empty
  if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
    return (
      <div
        ref={containerRef}
        className={`${className} min-h-[400px]`}
        onClick={handleContainerClick}
      >
        <div className="text-base-content/50 italic">{placeholder}</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`${className} editor-lines-container min-h-[400px] relative`}
      onClick={handleContainerClick}
    >
      {lines.map((line, index) => {
        const diffState = lineDiffMap.get(index)
        const addedLines = addedLinesAfter.get(index) || []
        
        return (
          <div key={index} className="relative">
            <EditorLine
              line={line}
              lineIndex={index}
              isFocused={focusedLine === index}
              cursorCol={focusedLine === index ? cursorCol : undefined}
              onFocus={handleLineFocus}
              onChange={handleLineChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              diffState={diffState === 'removed' ? 'removed' : undefined}
            />
            {/* Show added lines as preview after removed lines */}
            {diffState === 'removed' && addedLines.length > 0 && addedLines.map((addedLine, addedIdx) => (
              <div
                key={`added-${index}-${addedIdx}`}
                className="bg-success/20 border-l-2 border-success pl-2 ml-2 my-0.5"
              >
                <EditorLine
                  line={addedLine}
                  lineIndex={-1}
                  isFocused={false}
                  onFocus={() => {}}
                  onChange={() => {}}
                  onKeyDown={() => {}}
                  onPaste={() => {}}
                  diffState="added"
                />
              </div>
            ))}
          </div>
        )
      })}
      
      {/* Apply/dismiss buttons */}
      {shouldShowDiff && diff && onApplySuggestion && (
        <ApplyDismissButtons
          diff={diff}
          onApply={onApplySuggestion}
          onDismiss={onDismissSuggestion}
        />
      )}
    </div>
  )
}

function ApplyDismissButtons({
  diff,
  onApply,
  onDismiss,
}: {
  diff: DiffResult
  onApply: () => void
  onDismiss?: () => void
}) {
  return (
    <div className="sticky bottom-4 left-0 right-0 flex justify-center z-10 mt-4">
      <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 flex items-center gap-3">
        <div className="text-sm">
          <span className="text-error">{diff.removedCount} removed</span>
          {' • '}
          <span className="text-success">{diff.addedCount} added</span>
        </div>
        <div className="divider divider-horizontal"></div>
        <button
          onClick={onApply}
          className="btn btn-primary btn-sm"
          title="Apply suggestion (Ctrl/Cmd + Enter)"
        >
          Apply All
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="btn btn-ghost btn-sm"
            title="Dismiss suggestion (Esc)"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
