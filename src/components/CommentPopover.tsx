import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  X,
  Check,
  Reply,
  Pencil,
  Trash2,
  Send,
  AlertTriangle,
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

interface CommentPopoverProps {
  noteId: Id<'notes'>
  lineNumber: number
  lineContent: string
  threads: Array<CommentWithReplies>
  currentUserId?: Id<'users'>
  noteOwnerId?: Id<'users'>
  currentLineContent: string // For drift detection
  onClose: () => void
  position: 'right' | 'bottom' // Desktop vs mobile (for styling hints)
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
}: CommentPopoverProps) {
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

  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'comments'> | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<Id<'comments'> | null>(null)
  const [editText, setEditText] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState<Id<'comments'> | null>(null)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
    // Check user permission for editor/owner role
    const permission = userPermission
    const isEditor = permission?.role === 'editor' || permission?.role === 'owner'
    return isAuthor || isOwner || isEditor
  }

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
          <div className="flex items-center gap-1 shrink-0">
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
                onClick={() => { setEditingId(comment._id); setEditText(comment.body) }}
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
              <Send className="size-[1.2em]" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - using DaisyUI card styling */}
      <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200/50">
        <h3 className="font-bold text-lg">Line {lineNumber + 1}</h3>
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
          <X className="size-[1.2em]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Drift warning - using DaisyUI alert */}
      {isDrifted && threads.length > 0 && (
        <div className="alert alert-warning rounded-none py-2 px-4">
          <AlertTriangle size={14} />
          <span className="text-sm">Line content has changed since this comment</span>
        </div>
      )}

      {/* Comments - scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {threads.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Be the first to add one!</p>
          </div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread._id}
              className={`card bg-base-200 shadow-sm ${thread.resolved ? 'opacity-60' : ''}`}
            >
              <div className="card-body p-3 gap-2">
                {thread.resolved && (
                  <div className="badge badge-success badge-sm gap-1">
                    <Check size={10} /> Resolved
                  </div>
                )}
                {renderComment(thread)}
                {thread.replies.map((reply) => (
                  <div key={reply._id} className="mt-2">
                    {renderComment(reply, true)}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New comment input - using DaisyUI form controls */}
      {currentUserId ? (
        <div className="p-4 border-t border-base-300 bg-base-200/30">
          <div className="join w-full">
            <input
              type="text"
              className="input input-bordered join-item flex-1"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="btn btn-primary join-item"
              disabled={!newComment.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-base-300 bg-base-200/30">
          <div className="alert alert-info">
            <LogIn size={20} />
            <div className="flex-1">
              <h3 className="font-bold text-sm">Sign in to comment</h3>
              <div className="text-xs">You need to be signed in to add comments.</div>
              <button
                onClick={() => signIn('github')}
                className="btn btn-primary btn-sm mt-2"
              >
                Sign In
              </button>
            </div>
          </div>
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
