import { useNoteEditor } from '../hooks/useNoteEditor'
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
  onCursorChange,
}: NoteEditorProps) {
  const {
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
  } = useNoteEditor({
    content,
    onChange,
    onCursorChange,
  })

  // Basic textarea editor (fallback when inline editor is disabled)
  if (!enableInlineEditor) {
    return (
      <div className={`${className} editor-lines-container w-full max-w-full`}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onSelect={handleTextareaSelect}
          onKeyDown={handleTextareaKeyDown}
          onMouseUp={handleTextareaSelect}
          placeholder={placeholder}
          className="w-full min-h-[60vh] resize-none border-none outline-none bg-transparent text-sm leading-relaxed overflow-y-auto overflow-x-hidden break-words whitespace-pre-wrap"
          style={{
            fontFamily: '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>
    )
  }

  // Inline editor (when feature flag is enabled)

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
      className={`${className} editor-lines-container min-h-[400px]`}
      onClick={handleContainerClick}
    >
      {lines.map((line, index) => (
        <EditorLine
          key={index}
          line={line}
          lineIndex={index}
          isFocused={focusedLine === index}
          cursorCol={focusedLine === index ? cursorCol : undefined}
          onFocus={handleLineFocus}
          onChange={handleLineChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
      ))}
    </div>
  )
}
