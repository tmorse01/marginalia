import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Edit, Eye, Share2 } from 'lucide-react'
import NoteEditor from '../../components/NoteEditor'
import CommentableContent from '../../components/CommentableContent'
import PresenceIndicator from '../../components/PresenceIndicator'
import CommentThread from '../../components/CommentThread'
import ShareDialog from '../../components/ShareDialog'
import ActivityLog from '../../components/ActivityLog'
import LiveCursorOverlay from '../../components/LiveCursorOverlay'
import { useCurrentUser } from '../../lib/auth'
import { useNotePresence } from '../../lib/presence'

export const Route = createFileRoute('/notes/$noteId')({
  component: NotePage,
})

function NotePage() {
  const { noteId } = Route.useParams()
  const navigate = useNavigate()
  const note = useQuery(api.notes.get, { noteId: noteId as any })
  const updateNote = useMutation(api.notes.update)
  const currentUserId = useCurrentUser()
  const activeUsers = useQuery(api.presence.getActiveUsers, { noteId: noteId as any })
  const commentCounts = useQuery(api.comments.getUnresolvedCounts, { noteId: noteId as any })
  
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [cursorStart, setCursorStart] = useState<number | undefined>(undefined)
  const [cursorEnd, setCursorEnd] = useState<number | undefined>(undefined)
  
  // Pending comment state (from hover-to-comment)
  const [pendingCommentLine, setPendingCommentLine] = useState<{
    lineNumber: number
    lineContent: string
  } | null>(null)

  // Update local state when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  // Real-time sync: Update local state when note changes from other users
  useEffect(() => {
    if (note && !isEditing) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note, isEditing])

  // Debounced save
  useEffect(() => {
    if (!isEditing || !note) return

    const timeoutId = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        updateNote({
          noteId: noteId as any,
          title: title !== note.title ? title : undefined,
          content: content !== note.content ? content : undefined,
        })
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [title, content, isEditing, note, noteId, updateNote])

  useNotePresence({
    noteId: noteId as any,
    userId: currentUserId,
    mode: isEditing ? 'editing' : 'viewing',
    cursorStart: isEditing ? cursorStart : undefined,
    cursorEnd: isEditing ? cursorEnd : undefined,
  })

  // Handle hover-to-comment
  const handleCommentLine = (lineNumber: number, lineContent: string) => {
    setPendingCommentLine({ lineNumber, lineContent })
    // Scroll to comment section
    setTimeout(() => {
      document.getElementById('comments-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }

  if (note === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (note === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Note not found or you don't have permission to view it</span>
        </div>
        <button
          onClick={() => navigate({ to: '/' })}
          className="btn btn-primary mt-4"
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered flex-1 mr-4"
                placeholder="Note title"
              />
            ) : (
              <h1 className="text-3xl font-bold">{note.title}</h1>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareDialog(true)}
                className="btn btn-ghost btn-sm gap-2"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`btn btn-sm gap-2 ${isEditing ? 'btn-primary' : 'btn-ghost'}`}
              >
                {isEditing ? (
                  <>
                    <Eye size={16} />
                    <span className="hidden sm:inline">View</span>
                  </>
                ) : (
                  <>
                    <Edit size={16} />
                    <span className="hidden sm:inline">Edit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <PresenceIndicator
            noteId={noteId as any}
            currentUserId={currentUserId}
            activeUsers={activeUsers ?? undefined}
          />

          <div className="mt-4 relative">
            {isEditing ? (
              <NoteEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing in Markdown..."
                onCursorChange={(start, end) => {
                  setCursorStart(start)
                  setCursorEnd(end)
                }}
              />
            ) : (
              <>
                <LiveCursorOverlay
                  content={content}
                  entries={activeUsers ?? []}
                  currentUserId={currentUserId}
                />
                <CommentableContent
                  content={content}
                  onCommentLine={handleCommentLine}
                  commentCountsByLine={commentCounts ?? {}}
                />
              </>
            )}
          </div>

          {!isEditing && (
            <div id="comments-section">
              <CommentThread
                noteId={noteId as any}
                noteContent={content}
                currentUserId={currentUserId}
                noteOwnerId={note.ownerId}
                pendingCommentLine={pendingCommentLine}
                onCancelPendingComment={() => setPendingCommentLine(null)}
              />
              <ActivityLog noteId={noteId as any} />
            </div>
          )}
        </div>
      </div>

      <ShareDialog
        noteId={noteId as any}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </div>
  )
}
