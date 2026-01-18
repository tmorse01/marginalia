import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  X,
  Check,
  Reply,
  Pencil,
  Trash2,
  Send,
  AlertTriangle,
} from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

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

interface CommentPopoverProps {
  noteId: Id<'notes'>
  lineNumber: number
  lineContent: string
  threads: Array<CommentWithReplies>
  currentUserId?: Id<'users'>
  noteOwnerId?: Id<'users'>
  currentLineContent: string // For drift detection
  onClose: () => void
  position: 'right' | 'bottom' // Desktop vs mobile
}

export default function CommentPopover({
  noteId,
  lineNumber,
  lineContent,
  threads,
  currentUserId,
  noteOwnerId,
  currentLineContent,
  onClose,
  position,
}: CommentPopoverProps) {
  const createComment = useMutation(api.comments.create)
  const replyToComment = useMutation(api.comments.reply)
  const resolveComment = useMutation(api.comments.resolve)
  const updateComment = useMutation(api.comments.update)
  const deleteComment = useMutation(api.comments.remove)

  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'comments'> | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<Id<'comments'> | null>(null)
  const [editText, setEditText] = useState('')

  const isDrifted = currentLineContent !== lineContent

  const handleCreate = async () => {
    if (!newComment.trim() || !currentUserId) return
    try {
      await createComment({
        noteId,
        authorId: currentUserId,
        body: newComment.trim(),
        lineNumber,
        lineContent: currentLineContent,
      })
      setNewComment('')
    } catch (error) {
      console.error('Failed to create comment:', error)
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
    }
  }

  const handleResolve = async (commentId: Id<'comments'>, resolved: boolean) => {
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
      await updateComment({ commentId, userId: currentUserId, body: editText.trim() })
      setEditingId(null)
      setEditText('')
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const handleDelete = async (commentId: Id<'comments'>) => {
    if (!currentUserId) return
    if (!confirm('Delete this comment?')) return
    try {
      await deleteComment({ commentId, userId: currentUserId })
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const canResolve = (c: CommentData) => 
    currentUserId && (c.authorId === currentUserId || noteOwnerId === currentUserId)
  const canEdit = (c: CommentData) => currentUserId && c.authorId === currentUserId
  const canDelete = (c: CommentData) => 
    currentUserId && (c.authorId === currentUserId || noteOwnerId === currentUserId)

  const renderComment = (comment: CommentData, isReply = false) => {
    const isEditing = editingId === comment._id

    return (
      <div key={comment._id} className={`${isReply ? 'ml-4 pl-3 border-l-2 border-base-300' : ''}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm truncate">
              {comment.author?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-base-content/50 ml-2">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
            {comment.editedAt && (
              <span className="text-xs text-base-content/40 ml-1">(edited)</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isReply && canResolve(comment) && (
              <button
                onClick={() => handleResolve(comment._id, !comment.resolved)}
                className={`btn btn-xs btn-circle ${comment.resolved ? 'btn-ghost' : 'btn-success'}`}
                title={comment.resolved ? 'Unresolve' : 'Resolve'}
              >
                {comment.resolved ? <X size={10} /> : <Check size={10} />}
              </button>
            )}
            {canEdit(comment) && (
              <button
                onClick={() => { setEditingId(comment._id); setEditText(comment.body) }}
                className="btn btn-xs btn-circle btn-ghost"
                title="Edit"
              >
                <Pencil size={10} />
              </button>
            )}
            {canDelete(comment) && (
              <button
                onClick={() => handleDelete(comment._id)}
                className="btn btn-xs btn-circle btn-ghost text-error"
                title="Delete"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              className="textarea textarea-bordered textarea-sm w-full"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
            />
            <div className="flex gap-1">
              <button onClick={() => handleUpdate(comment._id)} className="btn btn-primary btn-xs">
                Save
              </button>
              <button onClick={() => { setEditingId(null); setEditText('') }} className="btn btn-ghost btn-xs">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{comment.body}</p>
        )}

        {/* Reply button */}
        {!isReply && currentUserId && !comment.resolved && (
          <button
            onClick={() => setReplyingTo(comment._id)}
            className="btn btn-xs btn-ghost mt-1 gap-1"
          >
            <Reply size={10} /> Reply
          </button>
        )}

        {/* Reply input */}
        {replyingTo === comment._id && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply(comment._id)}
              autoFocus
            />
            <button onClick={() => handleReply(comment._id)} className="btn btn-primary btn-sm btn-circle">
              <Send size={14} />
            </button>
          </div>
        )}
      </div>
    )
  }

  const popoverClasses = position === 'right'
    ? 'comment-popover comment-popover-right'
    : 'comment-popover comment-popover-bottom'

  return (
    <div className={popoverClasses}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-base-300 bg-base-200/50">
        <span className="text-sm font-medium">Line {lineNumber + 1}</span>
        <button onClick={onClose} className="btn btn-xs btn-circle btn-ghost">
          <X size={14} />
        </button>
      </div>

      {/* Drift warning */}
      {isDrifted && threads.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 text-warning text-xs">
          <AlertTriangle size={12} />
          <span>Line content changed</span>
        </div>
      )}

      {/* Comments */}
      <div className="p-3 space-y-4 max-h-80 overflow-y-auto">
        {threads.length === 0 ? (
          <p className="text-sm text-base-content/50 text-center py-2">No comments yet</p>
        ) : (
          threads.map((thread) => (
            <div
              key={thread._id}
              className={`space-y-2 ${thread.resolved ? 'opacity-50' : ''}`}
            >
              {thread.resolved && (
                <span className="badge badge-success badge-xs gap-1">
                  <Check size={8} /> Resolved
                </span>
              )}
              {renderComment(thread)}
              {thread.replies?.map((reply) => renderComment(reply, true))}
            </div>
          ))
        )}
      </div>

      {/* New comment input */}
      {currentUserId && (
        <div className="p-3 border-t border-base-300 bg-base-200/30">
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="btn btn-primary btn-sm btn-circle"
              disabled={!newComment.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

