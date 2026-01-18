import { useState, useEffect, useRef } from 'react'
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
  currentUserId?: Id<'users'>
  noteOwnerId?: Id<'users'>
  className?: string
}

/**
 * Renders markdown content with hover-to-comment and inline popovers (like Word)
 * Uses DaisyUI modal for desktop and drawer for mobile
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
  const modalRef = useRef<HTMLDialogElement>(null)
  const drawerCheckboxRef = useRef<HTMLInputElement>(null)

  const lines = content.split('\n')

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Control modal/drawer based on openPopover state
  useEffect(() => {
    if (openPopover !== null) {
      if (isMobile) {
        // Open drawer
        if (drawerCheckboxRef.current) {
          drawerCheckboxRef.current.checked = true
        }
      } else {
        // Open modal
        modalRef.current?.showModal()
      }
    } else {
      // Close both
      modalRef.current?.close()
      if (drawerCheckboxRef.current) {
        drawerCheckboxRef.current.checked = false
      }
    }
  }, [openPopover, isMobile])

  const handleIndicatorClick = (lineNumber: number) => {
    setOpenPopover(openPopover === lineNumber ? null : lineNumber)
  }

  const handleClose = () => {
    setOpenPopover(null)
  }

  const currentLine = openPopover !== null ? openPopover : 0
  const currentThreads = openPopover !== null ? (commentsByLine[openPopover] || []) : []
  const currentLineContent = openPopover !== null ? lines[openPopover] : ''

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
            </div>
          )
        })}
      </div>

      {/* Desktop: DaisyUI Modal */}
      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle" onClose={handleClose}>
        <div className="modal-box p-0 max-w-sm">
          {openPopover !== null && (
            <CommentPopover
              noteId={noteId}
              lineNumber={currentLine}
              lineContent={currentThreads[0]?.lineContent || currentLineContent}
              threads={currentThreads}
              currentUserId={currentUserId}
              noteOwnerId={noteOwnerId}
              currentLineContent={currentLineContent}
              onClose={handleClose}
              position="right"
            />
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleClose}>close</button>
        </form>
      </dialog>

      {/* Mobile: DaisyUI Drawer */}
      <div className="drawer drawer-end z-50">
        <input
          ref={drawerCheckboxRef}
          id="comment-drawer"
          type="checkbox"
          className="drawer-toggle"
          onChange={(e) => {
            if (!e.target.checked) handleClose()
          }}
        />
        <div className="drawer-side">
          <label htmlFor="comment-drawer" aria-label="close sidebar" className="drawer-overlay" />
          <div className="menu bg-base-100 text-base-content min-h-full w-80 max-w-[85vw] p-0">
            {openPopover !== null && (
              <CommentPopover
                noteId={noteId}
                lineNumber={currentLine}
                lineContent={currentThreads[0]?.lineContent || currentLineContent}
                threads={currentThreads}
                currentUserId={currentUserId}
                noteOwnerId={noteOwnerId}
                currentLineContent={currentLineContent}
                onClose={handleClose}
                position="bottom"
              />
            )}
          </div>
        </div>
      </div>
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
