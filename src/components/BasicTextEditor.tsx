import { useEffect } from 'react'
import { calculateDiff } from '../lib/diff-utils'
import type { DiffResult } from '../lib/diff-utils'

interface BasicTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  onCursorChange?: (start: number, end: number) => void
  suggestedContent?: string
  onApplySuggestion?: () => void
  onDismissSuggestion?: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleTextareaSelect: () => void
  handleTextareaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export default function BasicTextEditor({
  content,
  onChange: _onChange,
  placeholder = 'Start writing...',
  className = '',
  onCursorChange: _onCursorChange,
  suggestedContent,
  onApplySuggestion,
  onDismissSuggestion,
  textareaRef,
  handleTextareaChange,
  handleTextareaSelect,
  handleTextareaKeyDown,
}: BasicTextEditorProps) {
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

  return (
    <div className={`${className} editor-lines-container w-full max-w-full relative`}>
      {/* Show diff preview above textarea if suggestion exists */}
      {shouldShowDiff && diff && <TextareaDiffPreview diff={diff} />}
      
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleTextareaChange}
        onSelect={handleTextareaSelect}
        onKeyDown={handleTextareaKeyDown}
        onMouseUp={handleTextareaSelect}
        placeholder={placeholder}
        className="w-full min-h-[60vh] resize-none border-none outline-none bg-transparent text-sm leading-relaxed overflow-y-auto overflow-x-hidden wrap-break-word whitespace-pre-wrap"
        style={{
          fontFamily: '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          boxSizing: 'border-box',
        }}
      />
      
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

function TextareaDiffPreview({ diff }: { diff: DiffResult }) {
  return (
    <div className="mb-4 border border-base-300 rounded-lg overflow-hidden bg-base-100">
      <div className="bg-base-200 px-3 py-2 border-b border-base-300 text-xs">
        <span className="text-base-content/70">
          Preview: <span className="text-error">{diff.removedCount} removed</span>
          {' • '}
          <span className="text-success">{diff.addedCount} added</span>
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto p-2 font-mono text-xs">
        {diff.lines.slice(0, 100).map((diffLine, idx) => {
          const getLineClass = () => {
            switch (diffLine.type) {
              case 'added':
                return 'bg-success/20 border-l-2 border-success pl-2 py-0.5'
              case 'removed':
                return 'bg-error/20 border-l-2 border-error opacity-75 pl-2 py-0.5'
              default:
                return 'pl-2 py-0.5'
            }
          }
          
          const getPrefix = () => {
            switch (diffLine.type) {
              case 'added':
                return <span className="text-success font-bold mr-2">+</span>
              case 'removed':
                return <span className="text-error font-bold mr-2">-</span>
              default:
                return <span className="text-base-content/30 mr-2"> </span>
            }
          }
          
          return (
            <div key={idx} className={getLineClass()}>
              {getPrefix()}
              <span className="whitespace-pre-wrap wrap-break-word">
                {diffLine.content || ' '}
              </span>
            </div>
          )
        })}
        {diff.lines.length > 100 && (
          <div className="text-center text-xs text-base-content/50 py-2">
            ... {diff.lines.length - 100} more lines
          </div>
        )}
      </div>
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
