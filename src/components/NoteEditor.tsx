import { useEffect, useRef } from 'react'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export default function NoteEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  className = '',
}: NoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`textarea textarea-bordered w-full min-h-[400px] font-mono text-sm resize-none focus:outline-none ${className}`}
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}
    />
  )
}

