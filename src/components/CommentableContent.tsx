import { useState, useEffect } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CommentPopover from './CommentPopover'
import type { Id } from 'convex/_generated/dataModel'

interface CommentData {
  _id: Id<'comments'>
  noteId: Id<'notes'>
  authorId: Id<'users'>
  body: string
  lineNumber: number
  lineContent: string
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
  commentsByLine: Record<number, Array<CommentWithReplies>>
  currentUserId?: Id<'users'>
  noteOwnerId?: Id<'users'>
  className?: string
}

/**
 * Renders markdown content with hover-to-comment and inline popovers (like Word)
 */
export default function CommentableContent({
  content,
  noteId,
  commentsByLine,
  currentUserId,
  noteOwnerId,
  className = '',
}: CommentableContentProps) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const [openPopover, setOpenPopover] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const lines = content.split('\n')

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close popover on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPopover(null)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleIndicatorClick = (lineNumber: number) => {
    setOpenPopover(openPopover === lineNumber ? null : lineNumber)
  }

  return (
    <>
      <div className={`commentable-content ${className}`}>
        {lines.map((line, index) => {
          const threads = commentsByLine[index] || []
          const unresolvedCount = threads.filter(t => !t.resolved).length
          const hasComments = threads.length > 0
          const isHovered = hoveredLine === index
          const isOpen = openPopover === index

          return (
            <div
              key={index}
              className={`commentable-line ${hasComments ? 'has-comments' : ''} ${isOpen ? 'is-active' : ''}`}
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
                className={`comment-indicator ${isHovered || hasComments ? 'visible' : ''} ${hasComments ? 'has-comments' : ''} ${isOpen ? 'is-open' : ''}`}
                title={hasComments ? `${threads.length} comment${threads.length > 1 ? 's' : ''}` : 'Add comment'}
              >
                {hasComments ? (
                  <span className="comment-count">{unresolvedCount || <MessageSquare size={12} />}</span>
                ) : (
                  <Plus size={14} />
                )}
              </button>

              {/* Popover - desktop */}
              {isOpen && !isMobile && (
                <CommentPopover
                  noteId={noteId}
                  lineNumber={index}
                  lineContent={threads[0]?.lineContent || line}
                  threads={threads}
                  currentUserId={currentUserId}
                  noteOwnerId={noteOwnerId}
                  currentLineContent={line}
                  onClose={() => setOpenPopover(null)}
                  position="right"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile bottom sheet */}
      {openPopover !== null && isMobile && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40" 
            onClick={() => setOpenPopover(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <CommentPopover
              noteId={noteId}
              lineNumber={openPopover}
              lineContent={commentsByLine[openPopover]?.[0]?.lineContent || lines[openPopover]}
              threads={commentsByLine[openPopover] || []}
              currentUserId={currentUserId}
              noteOwnerId={noteOwnerId}
              currentLineContent={lines[openPopover]}
              onClose={() => setOpenPopover(null)}
              position="bottom"
            />
          </div>
        </>
      )}
    </>
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
