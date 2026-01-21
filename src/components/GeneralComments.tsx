import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
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
  LogIn,
} from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import AlertToast from './AlertToast'
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
  currentUserId?: Id<'users'> | null
  noteOwnerId?: Id<'users'>
}

export default function GeneralComments({
  noteId,
  threads,
  currentUserId,
  noteOwnerId,
}: GeneralCommentsProps) {
  const { signIn } = useAuthActions()
  const createComment = useMutation(api.comments.create)
  const replyToComment = useMutation(api.comments.reply)
  const resolveComment = useMutation(api.comments.resolve)
  const updateComment = useMutation(api.comments.update)
  const deleteComment = useMutation(api.comments.remove)
  const userPermission = useQuery(
    api.permissions.check,
    currentUserId ? { noteId, userId: currentUserId } : 'skip'
  )

  const [isExpanded, setIsExpanded] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'comments'> | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<Id<'comments'> | null>(null)
  const [editText, setEditText] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState<Id<'comments'> | null>(null)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

  const handleDeleteClick = (commentId: Id<'comments'>) => {
    setShowDeleteDialog(commentId)
  }

  const handleDeleteConfirm = async () => {
    if (!currentUserId || !showDeleteDialog) return
    try {
      await deleteComment({ commentId: showDeleteDialog, userId: currentUserId })
      setShowDeleteDialog(null)
    } catch (error) {
      console.error('Failed to delete:', error)
      const message = error instanceof Error ? error.message : 'Failed to delete comment'
      if (message.includes("don't have permission") || message.includes('permission')) {
        setErrorMessage("You can't delete this comment. Only the comment author, note owner, or editors can delete comments.")
      } else {
        setErrorMessage(message)
      }
      setShowErrorToast(true)
    }
  }

  const canResolve = (c: CommentData) =>
    currentUserId && (c.authorId === currentUserId || noteOwnerId === currentUserId)
  const canEdit = (c: CommentData) => currentUserId && c.authorId === currentUserId
  const canDelete = (c: CommentData) => {
    if (!currentUserId) return false
    const isAuthor = c.authorId === currentUserId
    const isOwner = noteOwnerId === currentUserId
    const isEditor = userPermission?.role === 'editor' || userPermission?.role === 'owner'
    return isAuthor || isOwner || isEditor
  }

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
                {comment.resolved ? <X className="size-[1.2em]" strokeWidth={2.5} /> : <Check className="size-[1.2em]" strokeWidth={2.5} />}
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
                <Pencil className="size-[1.2em]" strokeWidth={2.5} />
              </button>
            )}
            {canDelete(comment) && (
              <button
                onClick={() => handleDeleteClick(comment._id)}
                className="btn btn-xs btn-circle btn-ghost text-error"
                title="Delete"
              >
                <Trash2 className="size-[1.2em]" strokeWidth={2.5} />
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
              <Send className="size-[1.2em]" strokeWidth={2.5} />
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
              {currentUserId ? (
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
                    <Send className="size-[1.2em]" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="alert alert-info pt-2 border-t border-base-300">
                  <LogIn size={16} />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">Sign in to comment</h3>
                    <div className="text-xs">You need to be signed in to add comments.</div>
                    <button
                      onClick={() => signIn('github')}
                      className="btn btn-primary btn-xs mt-2"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog !== null}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="btn-error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(null)}
      />

      <AlertToast
        isOpen={showErrorToast}
        message={errorMessage}
        type="error"
        onClose={() => setShowErrorToast(false)}
      />
    </div>
  )
}

