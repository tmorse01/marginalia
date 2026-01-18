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
import ConfirmDialog from './ConfirmDialog'
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

interface InlineCommentsPanelProps {
  noteId: Id<'notes'>
  commentsByLine: Partial<Record<number, Array<CommentWithReplies>>>
  selectedLine: number | null
  onLineSelect: (lineNumber: number | null) => void
  currentUserId?: Id<'users'>
  noteOwnerId?: Id<'users'>
  content: string
  showAllComments?: boolean
}

export default function InlineCommentsPanel({
  noteId,
  commentsByLine,
  selectedLine,
  onLineSelect,
  currentUserId,
  noteOwnerId,
  content,
  showAllComments = false,
}: InlineCommentsPanelProps) {
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
  const [showDeleteDialog, setShowDeleteDialog] = useState<Id<'comments'> | null>(null)

  const lines = content.split('\n')
  const currentThreads = selectedLine !== null ? (commentsByLine[selectedLine] || []) : []
  const currentLineContent = selectedLine !== null ? lines[selectedLine] || '' : ''
  const originalLineContent =
    selectedLine !== null && currentThreads.length > 0
      ? currentThreads[0]?.lineContent || currentLineContent
      : currentLineContent
  const isDrifted = selectedLine !== null && currentLineContent !== originalLineContent && currentThreads.length > 0

  const handleCreate = async () => {
    if (!newComment.trim() || !currentUserId || selectedLine === null) return
    try {
      await createComment({
        noteId,
        authorId: currentUserId,
        body: newComment.trim(),
        lineNumber: selectedLine,
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

  // Get all lines with comments for "show all" mode
  const allLinesWithComments = Object.keys(commentsByLine)
    .map(Number)
    .filter((lineNum) => (commentsByLine[lineNum] || []).length > 0)
    .sort((a, b) => a - b)

  // Show all comments mode (Word-style)
  if (showAllComments) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200/50">
          <h3 className="font-bold text-lg">All Comments</h3>
        </div>

        {/* Comments - scrollable area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {allLinesWithComments.length === 0 ? (
            <div className="text-center py-8 text-base-content/50">
              <p className="text-sm">No inline comments yet</p>
              <p className="text-xs mt-1">Click a comment indicator to add one</p>
            </div>
          ) : (
            allLinesWithComments.map((lineNum) => {
              const threads = commentsByLine[lineNum] || []
              const lineContent = lines[lineNum] || ''
              const originalLineContent =
                threads.length > 0 ? threads[0]?.lineContent || lineContent : lineContent
              const isDrifted = lineContent !== originalLineContent && threads.length > 0
              const isSelected = selectedLine === lineNum

              return (
                <div
                  key={lineNum}
                  className={`card bg-base-200 shadow-sm ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="card-body p-3 gap-2">
                    {/* Line header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onLineSelect(isSelected ? null : lineNum)}
                          className="font-bold text-sm text-primary hover:underline"
                        >
                          Line {lineNum + 1}
                        </button>
                      </div>
                    </div>

                    {/* Line content preview */}
                    <div className="px-2 py-1 bg-base-300/30 rounded text-xs mb-2">
                      <code className="text-base-content/70 break-all line-clamp-2">
                        {lineContent || '(empty line)'}
                      </code>
                    </div>

                    {/* Drift warning */}
                    {isDrifted && (
                      <div className="alert alert-warning py-1 px-2 mb-2">
                        <AlertTriangle size={12} />
                        <span className="text-xs">Line content has changed</span>
                      </div>
                    )}

                    {/* Comments for this line */}
                    {threads.map((thread) => (
                      <div
                        key={thread._id}
                        className={`${thread.resolved ? 'opacity-60' : ''}`}
                      >
                        {thread.resolved && (
                          <div className="badge badge-success badge-sm gap-1 mb-1">
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
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // Single line view mode (when a line is selected)
  // Empty state when no line is selected
  if (selectedLine === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-base-content/50">
          <p className="text-sm">Click on a line to view comments</p>
          <p className="text-xs mt-2">Or click the comment indicator on any line</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">Line {selectedLine + 1}</h3>
          <button
            onClick={() => onLineSelect(null)}
            className="btn btn-sm btn-circle btn-ghost"
            title="Close"
          >
            <X className="size-[1.2em]" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Line content preview */}
      <div className="px-4 py-2 bg-base-300/30 border-b border-base-300">
        <code className="text-xs text-base-content/70 break-all line-clamp-2">
          {currentLineContent || '(empty line)'}
        </code>
      </div>

      {/* Drift warning */}
      {isDrifted && (
        <div className="alert alert-warning rounded-none py-2 px-4">
          <AlertTriangle size={14} />
          <span className="text-sm">Line content has changed since this comment</span>
        </div>
      )}

      {/* Comments - scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentThreads.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Be the first to add one!</p>
          </div>
        ) : (
          currentThreads.map((thread) => (
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

      {/* New comment input */}
      {currentUserId && (
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
    </div>
  )
}

