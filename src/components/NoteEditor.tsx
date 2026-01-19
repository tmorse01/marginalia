import { useNoteEditor } from '../hooks/useNoteEditor'
import BasicTextEditor from './BasicTextEditor'
import InlineMarkdownEditor from './InlineMarkdownEditor'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  showInlinePreview?: boolean
  onCursorChange?: (start: number, end: number) => void
  suggestedContent?: string // Optional suggested content for diff highlighting
  onApplySuggestion?: () => void // Callback when user accepts suggestion
  onDismissSuggestion?: () => void // Callback when user dismisses suggestion
}

export default function NoteEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  onCursorChange,
  suggestedContent,
  onApplySuggestion,
  onDismissSuggestion,
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

  // Render basic textarea editor or advanced inline editor based on feature flag
  if (!enableInlineEditor) {
    return (
      <BasicTextEditor
        content={content}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        onCursorChange={onCursorChange}
        suggestedContent={suggestedContent}
        onApplySuggestion={onApplySuggestion}
        onDismissSuggestion={onDismissSuggestion}
        textareaRef={textareaRef}
        handleTextareaChange={handleTextareaChange}
        handleTextareaSelect={handleTextareaSelect}
        handleTextareaKeyDown={handleTextareaKeyDown}
      />
    )
  }

  return (
    <InlineMarkdownEditor
      content={content}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      onCursorChange={onCursorChange}
      suggestedContent={suggestedContent}
      onApplySuggestion={onApplySuggestion}
      onDismissSuggestion={onDismissSuggestion}
      containerRef={containerRef}
      focusedLine={focusedLine}
      cursorCol={cursorCol}
      lines={lines}
      handleLineFocus={handleLineFocus}
      handleLineChange={handleLineChange}
      handleKeyDown={handleKeyDown}
      handlePaste={handlePaste}
      handleContainerClick={handleContainerClick}
    />
  )
}
