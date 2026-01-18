import { useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CommentableContentProps {
  content: string
  onCommentLine: (lineNumber: number, lineContent: string) => void
  commentCountsByLine?: Record<number, number>
  className?: string
}

/**
 * Renders markdown content with hover-to-comment functionality on each line
 */
export default function CommentableContent({
  content,
  onCommentLine,
  commentCountsByLine = {},
  className = '',
}: CommentableContentProps) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const lines = content.split('\n')

  return (
    <div className={`commentable-content ${className}`}>
      {lines.map((line, index) => {
        const hasComments = (commentCountsByLine[index] || 0) > 0
        const isHovered = hoveredLine === index
        
        return (
          <div
            key={index}
            className="commentable-line group relative"
            onMouseEnter={() => setHoveredLine(index)}
            onMouseLeave={() => setHoveredLine(null)}
          >
            {/* Comment indicator / add button in gutter */}
            <div className="commentable-line-gutter">
              {hasComments ? (
                <button
                  onClick={() => onCommentLine(index, line)}
                  className="comment-indicator"
                  title={`${commentCountsByLine[index]} comment${commentCountsByLine[index] > 1 ? 's' : ''}`}
                >
                  {commentCountsByLine[index]}
                </button>
              ) : (
                <button
                  onClick={() => onCommentLine(index, line)}
                  className={`comment-add-btn ${isHovered ? 'visible' : ''}`}
                  title="Add comment"
                >
                  <MessageSquarePlus size={14} />
                </button>
              )}
            </div>

            {/* Line content */}
            <div className={`commentable-line-content ${hasComments ? 'has-comments' : ''}`}>
              <LineContent line={line} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Renders a single line of markdown
 * Handles empty lines and basic markdown formatting
 */
function LineContent({ line }: { line: string }) {
  // Empty line
  if (!line.trim()) {
    return <div className="h-6">&nbsp;</div>
  }

  // Use ReactMarkdown for inline formatting only
  // We render each line separately to maintain line-level interactivity
  return (
    <div className="prose prose-sm max-w-none inline-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Prevent wrapping in <p> tags for inline rendering
          p: ({ children }) => <span>{children}</span>,
        }}
      >
        {line}
      </ReactMarkdown>
    </div>
  )
}

