import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  MessageCircle,
  X,
  Check,
  Reply,
  Pencil,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface CommentData {
  _id: Id<'comments'>
  noteId: Id<'notes'>
  authorId: Id<'users'>
  body: string
  lineNumber?: number
  lineContent?: string
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

interface GeneralCommentsProps {
  noteId: Id<'notes'>
  threads: Array<CommentWithReplies>
  currentUserId?: Id<'users'>
  noteOwnerId?: Id<'users'>
}

export default function GeneralComments({
  noteId,
  threads,
  currentUserId,
  noteOwnerId,
}: GeneralCommentsProps) {
  const createComment = useMutation(api.comments.create)
  const replyToComment = useMutation(api.comments.reply)
  const resolveComment = useMutation(api.comments.resolve)
  const updateComment = useMutation(api.comments.update)
  const deleteComment = useMutation(api.comments.remove)

  const [isExpanded, setIsExpanded] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'comments'> | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<Id<'comments'> | null>(null)
  const [editText, setEditText] = useState('')

  const handleCreate = async () => {
    if (!newComment.trim() || !currentUserId) return
    try {
      await createComment({
        noteId,
        authorId: currentUserId,
        body: newComment.trim(),
        // No lineNumber or lineContent = general comment
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

  const unresolvedCount = threads.filter((t) => !t.resolved).length

  const renderComment = (comment: CommentData, isReply = false) => {
    const isEditing = editingId === comment._id

    return (
      <div
        key={comment._id}
        className={`${isReply ? 'ml-4 pl-3 border-l-2 border-base-300' : ''}`}
      >
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
                onClick={() => {
                  setEditingId(comment._id)
                  setEditText(comment.body)
                }}
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
              <button
                onClick={() => handleUpdate(comment._id)}
                className="btn btn-primary btn-xs"
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
            <button
              onClick={() => handleReply(comment._id)}
              className="btn btn-primary btn-sm btn-circle"
            >
              <Send size={14} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-base-300 rounded-lg overflow-hidden bg-base-100">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-base-200/50 hover:bg-base-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-base-content/70" />
          <span className="font-medium">General Comments</span>
          {unresolvedCount > 0 && (
            <span className="badge badge-primary badge-sm">{unresolvedCount}</span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {threads.length === 0 && !currentUserId ? (
            <p className="text-sm text-base-content/50 text-center py-4">
              No comments yet
            </p>
          ) : (
            <>
              {/* Existing threads */}
              {threads.map((thread) => (
                <div
                  key={thread._id}
                  className={`p-3 rounded-lg border ${
                    thread.resolved
                      ? 'bg-base-200/30 border-base-300 opacity-60'
                      : 'bg-base-200/50 border-base-300'
                  }`}
                >
                  {thread.resolved && (
                    <span className="badge badge-success badge-xs gap-1 mb-2">
                      <Check size={8} /> Resolved
                    </span>
                  )}
                  {renderComment(thread)}
                  {thread.replies.map((reply) => (
                    <div key={reply._id} className="mt-2">
                      {renderComment(reply, true)}
                    </div>
                  ))}
                </div>
              ))}

              {/* New comment input */}
              {currentUserId && (
                <div className="flex gap-2 pt-2 border-t border-base-300">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    placeholder="Add a general comment..."
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
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

