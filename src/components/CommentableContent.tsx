import { useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Id } from 'convex/_generated/dataModel'

interface CommentData {
  _id: Id<'comments'>
  noteId: Id<'notes'>
  authorId: Id<'users'>
  body: string
  lineNumber?: number
  lineContent?: string
  resolved: boolean
  createdAt: number
  author: { name: string; email: string } | null
}

interface CommentWithReplies extends CommentData {
  replies: Array<CommentData>
}

interface CommentableContentProps {
  content: string
  noteId: Id<'notes'>
  commentsByLine: Partial<Record<number, Array<CommentWithReplies>>>
  currentUserId?: Id<'users'> | null
  noteOwnerId?: Id<'users'>
  selectedLine?: number | null
  onLineSelect?: (lineNumber: number | null) => void
  onOpenComments?: () => void
  className?: string
}

/**
 * Renders markdown content with hover-to-comment and inline indicators
 * Clicking indicators opens the right sidebar with comments for that line
 */
export default function CommentableContent({
  content,
  noteId: _noteId,
  commentsByLine,
  currentUserId: _currentUserId,
  noteOwnerId: _noteOwnerId,
  selectedLine = null,
  onLineSelect,
  onOpenComments,
  className = '',
}: CommentableContentProps) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)

  const lines = content.split('\n')

  const handleIndicatorClick = (lineNumber: number) => {
    // Open comments sidebar if it's closed
    if (onOpenComments) {
      onOpenComments()
    }
    
    if (onLineSelect) {
      // Toggle: if clicking the same line, deselect it
      onLineSelect(selectedLine === lineNumber ? null : lineNumber)
    }
  }

  return (
    <div className={`commentable-content ${className}`}>
      {lines.map((line, index) => {
        const threads = commentsByLine[index] || []
        const unresolvedCount = threads.filter(t => !t.resolved).length
        const hasComments = threads.length > 0
        const hasUnresolvedComments = unresolvedCount > 0
        const hasOnlyResolvedComments = hasComments && unresolvedCount === 0
        const isHovered = hoveredLine === index
        const isSelected = selectedLine === index

        return (
          <div
            key={index}
            className={`commentable-line ${hasUnresolvedComments ? 'has-comments' : ''} ${hasOnlyResolvedComments ? 'has-resolved-comments' : ''} ${isSelected ? 'is-active' : ''}`}
            onMouseEnter={() => setHoveredLine(index)}
            onMouseLeave={() => setHoveredLine(null)}
          >
            {/* Line content */}
            <div className="commentable-line-content">
              <LineContent line={line} />
            </div>

            {/* Right-side comment indicator */}
            <button
              onClick={() => handleIndicatorClick(index)}
              className={`comment-indicator ${isHovered || hasComments ? 'visible' : ''} ${hasUnresolvedComments ? 'has-comments' : ''} ${hasOnlyResolvedComments ? 'has-resolved-comments' : ''} ${isSelected ? 'is-open' : ''}`}
              title={hasComments ? `${threads.length} comment${threads.length > 1 ? 's' : ''} (${unresolvedCount} unresolved)` : 'Add comment'}
            >
              {hasComments ? (
                <span className="comment-count">{unresolvedCount || <MessageSquare size={12} />}</span>
              ) : (
                <Plus size={14} />
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Renders a single line of markdown
 */
function LineContent({ line }: { line: string }) {
  if (!line.trim()) {
    return <div className="h-6">&nbsp;</div>
  }

  return (
    <div className="prose prose-sm max-w-none inline-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <span>{children}</span>,
        }}
      >
        {line}
      </ReactMarkdown>
    </div>
  )
}
