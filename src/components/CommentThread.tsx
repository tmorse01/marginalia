import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useState, useEffect } from 'react'
import {
  Check,
  MessageSquare,
  MessageSquarePlus,
  X,
  Reply,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface CommentThreadProps {
  noteId: Id<'notes'>
  noteContent: string
  currentUserId?: Id<'users'>
  noteOwnerId?: Id<'users'>
  /** Line to comment on (from hover interaction) */
  pendingCommentLine?: { lineNumber: number; lineContent: string } | null
  /** Callback when user cancels pending comment */
  onCancelPendingComment?: () => void
}

interface CommentData {
  _id: Id<'comments'>
  noteId: Id<'notes'>
  authorId: Id<'users'>
  body: string
  lineNumber: number
  lineContent: string
  parentId?: Id<'comments'>
  resolved: boolean
  resolvedBy?: Id<'users'>
  resolvedAt?: number
  editedAt?: number
  createdAt: number
  author: { name: string; email: string } | null
  resolvedByUser?: { name: string; email: string } | null
}

interface CommentWithReplies extends CommentData {
  replies: Array<CommentData>
}

export default function CommentThread({
  noteId,
  noteContent,
  currentUserId,
  noteOwnerId,
  pendingCommentLine,
  onCancelPendingComment,
}: CommentThreadProps) {
  const commentsByLine = useQuery(api.comments.listByNote, { noteId })
  const createComment = useMutation(api.comments.create)
  const replyToComment = useMutation(api.comments.reply)
  const resolveComment = useMutation(api.comments.resolve)
  const updateComment = useMutation(api.comments.update)
  const deleteComment = useMutation(api.comments.remove)

  const [newComment, setNewComment] = useState('')
  const [generalComment, setGeneralComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'comments'> | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<Id<'comments'> | null>(null)
  const [editText, setEditText] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [showGeneralInput, setShowGeneralInput] = useState(false)

  const lines = noteContent.split('\n')

  // Flatten all threads for display, sorted by line number then creation time
  const allThreads: Array<CommentWithReplies> = commentsByLine
    ? (Object.values(commentsByLine).flat() as Array<CommentWithReplies>)
    : []

  // Separate line comments and general comments
  const lineComments = allThreads.filter((t) => t.lineNumber >= 0)
  const generalComments = allThreads.filter((t) => t.lineNumber === -1)
  
  const visibleLineComments = lineComments.filter((t) => showResolved || !t.resolved)
  const visibleGeneralComments = generalComments.filter((t) => showResolved || !t.resolved)
  
  // Sort line comments by line number, then by creation time
  visibleLineComments.sort((a, b) => {
    if (a.lineNumber !== b.lineNumber) return a.lineNumber - b.lineNumber
    return a.createdAt - b.createdAt
  })

  // Check if a line's content has drifted from when the comment was made
  const isLineDrifted = (comment: CommentData): boolean => {
    if (comment.lineNumber === -1) return false // General comments don't drift
    const currentLineContent = lines[comment.lineNumber] ?? ''
    return currentLineContent !== comment.lineContent
  }

  // Reset comment input when pending line changes
  useEffect(() => {
    if (pendingCommentLine) {
      setNewComment('')
    }
  }, [pendingCommentLine?.lineNumber])

  const handleCreateLineComment = async () => {
    if (!pendingCommentLine || !newComment.trim() || !currentUserId) return

    try {
      await createComment({
        noteId,
        authorId: currentUserId,
        body: newComment.trim(),
        lineNumber: pendingCommentLine.lineNumber,
        lineContent: pendingCommentLine.lineContent,
      })
      setNewComment('')
      onCancelPendingComment?.()
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert(
        error instanceof Error
          ? `Failed to create comment: ${error.message}`
          : 'Failed to create comment. Please try again.'
      )
    }
  }

  const handleCreateGeneralComment = async () => {
    if (!generalComment.trim() || !currentUserId) return

    try {
      await createComment({
        noteId,
        authorId: currentUserId,
        body: generalComment.trim(),
        lineNumber: -1, // General comment
        lineContent: '',
      })
      setGeneralComment('')
      setShowGeneralInput(false)
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert(
        error instanceof Error
          ? `Failed to create comment: ${error.message}`
          : 'Failed to create comment. Please try again.'
      )
    }
  }

  const handleReply = async (parentId: Id<'comments'>) => {
    if (!replyText.trim() || !currentUserId) return

    try {
      await replyToComment({
        parentId,
        authorId: currentUserId,
        body: replyText.trim(),
      })
      setReplyingTo(null)
      setReplyText('')
    } catch (error) {
      console.error('Failed to reply:', error)
      alert(
        error instanceof Error
          ? `Failed to reply: ${error.message}`
          : 'Failed to reply. Please try again.'
      )
    }
  }

  const handleResolve = async (
    commentId: Id<'comments'>,
    resolved: boolean
  ) => {
    if (!currentUserId) return
    try {
      await resolveComment({ commentId, userId: currentUserId, resolved })
    } catch (error) {
      console.error('Failed to resolve:', error)
    }
  }

  const handleUpdate = async (commentId: Id<'comments'>) => {
    if (!editText.trim() || !currentUserId) return

    try {
      await updateComment({
        commentId,
        userId: currentUserId,
        body: editText.trim(),
      })
      setEditingId(null)
      setEditText('')
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const handleDelete = async (commentId: Id<'comments'>) => {
    if (!currentUserId) return
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await deleteComment({ commentId, userId: currentUserId })
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const canResolve = (comment: CommentData): boolean => {
    if (!currentUserId) return false
    return comment.authorId === currentUserId || noteOwnerId === currentUserId
  }

  const canEdit = (comment: CommentData): boolean => {
    if (!currentUserId) return false
    return comment.authorId === currentUserId
  }

  const canDelete = (comment: CommentData): boolean => {
    if (!currentUserId) return false
    return comment.authorId === currentUserId || noteOwnerId === currentUserId
  }

  const renderComment = (
    comment: CommentWithReplies | CommentData,
    isReply: boolean = false
  ) => {
    const drifted = !isReply && isLineDrifted(comment)
    const replies = 'replies' in comment ? comment.replies : []
    const isEditing = editingId === comment._id

    return (
      <div
        key={comment._id}
        className={`${isReply ? 'ml-6 border-l-2 border-base-300 pl-4' : ''}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-medium text-sm">
              {comment.author?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-base-content/50 ml-2">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
            {comment.editedAt && (
              <span className="text-xs text-base-content/40 ml-1">(edited)</span>
            )}
          </div>
          <div className="flex gap-1">
            {!isReply && canResolve(comment) && (
              <button
                onClick={() => handleResolve(comment._id, !comment.resolved)}
                className={`btn btn-xs ${comment.resolved ? 'btn-ghost' : 'btn-success'}`}
                title={comment.resolved ? 'Unresolve' : 'Resolve'}
              >
                {comment.resolved ? <X size={12} /> : <Check size={12} />}
              </button>
            )}
            {canEdit(comment) && (
              <button
                onClick={() => {
                  setEditingId(comment._id)
                  setEditText(comment.body)
                }}
                className="btn btn-xs btn-ghost"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
            )}
            {canDelete(comment) && (
              <button
                onClick={() => handleDelete(comment._id)}
                className="btn btn-xs btn-ghost text-error"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate(comment._id)}
                className="btn btn-primary btn-xs"
                disabled={!editText.trim()}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingId(null)
                  setEditText('')
                }}
                className="btn btn-ghost btn-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
        )}

        {/* Reply button */}
        {!isReply && currentUserId && (
          <button
            onClick={() => setReplyingTo(comment._id)}
            className="btn btn-xs btn-ghost mt-2"
          >
            <Reply size={12} />
            Reply
          </button>
        )}

        {/* Reply input */}
        {replyingTo === comment._id && (
          <div className="mt-2 space-y-2">
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleReply(comment._id)}
                className="btn btn-primary btn-xs"
                disabled={!replyText.trim()}
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null)
                  setReplyText('')
                }}
                className="btn btn-ghost btn-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Render replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {replies.map((r) => renderComment(r, true))}
          </div>
        )}

        {/* Drift warning */}
        {drifted && (
          <div className="alert alert-warning mt-2 py-2">
            <AlertTriangle size={16} />
            <span className="text-xs">Line content has changed since this comment was made</span>
          </div>
        )}
      </div>
    )
  }

  const totalComments = visibleLineComments.length + visibleGeneralComments.length

  return (
    <div className="border-t border-base-300 mt-8 pt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare size={20} />
          Comments ({totalComments})
        </h3>
        <div className="flex items-center gap-4">
          <label className="label cursor-pointer gap-2">
            <span className="label-text text-sm">Show resolved</span>
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
          </label>
        </div>
      </div>

      {/* Pending line comment input (from hover interaction) */}
      {pendingCommentLine && currentUserId && (
        <div className="alert alert-info mb-4">
          <MessageSquarePlus size={20} />
          <div className="flex-1">
            <h4 className="font-medium mb-2">Comment on line {pendingCommentLine.lineNumber + 1}</h4>
            <div className="bg-base-200 p-2 rounded text-sm font-mono mb-3 truncate">
              {pendingCommentLine.lineContent || '(empty line)'}
            </div>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Write your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            autoFocus
          />
            <div className="flex gap-2">
              <button
                onClick={handleCreateLineComment}
                className="btn btn-primary btn-sm"
                disabled={!newComment.trim()}
              >
                Add Comment
              </button>
              <button
                onClick={() => {
                  setNewComment('')
                  onCancelPendingComment?.()
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Line comments list */}
      {visibleLineComments.length > 0 && (
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-medium text-base-content/70 uppercase tracking-wide">
            Line Comments
          </h4>
          {visibleLineComments.map((thread) => (
            <div
              key={thread._id}
              className={`card bg-base-200 shadow-sm ${thread.resolved ? 'opacity-60' : ''}`}
            >
              <div className="card-body p-4">
                {/* Line reference */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge badge-outline badge-sm">
                    Line {thread.lineNumber + 1}
                  </span>
                  <code className="text-xs bg-base-300 px-2 py-1 rounded truncate max-w-md">
                    {thread.lineContent || '(empty line)'}
                  </code>
                  {thread.resolved && (
                    <span className="badge badge-success badge-sm gap-1">
                      <Check size={12} />
                      Resolved
                    </span>
                  )}
                </div>
                {renderComment(thread)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* General comments section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-base-content/70 uppercase tracking-wide">
            General Comments
          </h4>
          {currentUserId && !showGeneralInput && (
            <button
              onClick={() => setShowGeneralInput(true)}
              className="btn btn-ghost btn-sm"
            >
              <MessageSquarePlus size={14} />
              Add Comment
            </button>
          )}
        </div>

        {/* General comment input */}
        {showGeneralInput && currentUserId && (
          <div className="card bg-base-200 p-4">
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Write a general comment..."
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateGeneralComment}
                className="btn btn-primary btn-sm"
                disabled={!generalComment.trim()}
              >
                Add Comment
              </button>
              <button
                onClick={() => {
                  setGeneralComment('')
                  setShowGeneralInput(false)
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* General comments list */}
        {visibleGeneralComments.length > 0 ? (
          visibleGeneralComments.map((thread) => (
            <div
              key={thread._id}
              className={`card bg-base-200 shadow-sm ${thread.resolved ? 'opacity-60' : ''}`}
            >
              <div className="card-body p-4">
                {thread.resolved && (
                  <span className="badge badge-success badge-sm mb-2 gap-1">
                    <Check size={12} />
                    Resolved
                  </span>
                )}
                {renderComment(thread)}
              </div>
            </div>
          ))
        ) : (
          !showGeneralInput && (
            <p className="text-base-content/50 text-sm">
              No general comments yet.
            </p>
          )
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 text-sm text-base-content/50">
        <p>💡 Hover over a line in the note above and click the + icon to comment on that line.</p>
      </div>
    </div>
  )
}
