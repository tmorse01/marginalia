import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useState } from 'react'
import { Check, CheckCircle, MessageSquare, X } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface CommentThreadProps {
  noteId: Id<'notes'>
  noteContent: string
  currentUserId?: Id<'users'>
}

export default function CommentThread({
  noteId,
  noteContent,
  currentUserId,
}: CommentThreadProps) {
  const comments = useQuery(api.comments.list, { noteId })
  const createComment = useMutation(api.comments.create)
  const resolveComment = useMutation(api.comments.resolve)
  const [selectedText, setSelectedText] = useState<{
    text: string
    start: number
    end: number
  } | null>(null)
  const [newComment, setNewComment] = useState('')
  const [showResolved, setShowResolved] = useState(false)

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0)
      const text = selection.toString().trim()
      
      // Calculate character positions in the note content
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(document.body)
      preCaretRange.setEnd(range.startContainer, range.startOffset)
      const start = preCaretRange.toString().length
      const end = start + text.length

      setSelectedText({ text, start, end })
    }
  }

  const handleCreateComment = async () => {
    if (!selectedText || !newComment.trim() || !currentUserId) return

    try {
      await createComment({
        noteId,
        authorId: currentUserId,
        body: newComment.trim(),
        anchorStart: selectedText.start,
        anchorEnd: selectedText.end,
      })
      setSelectedText(null)
      setNewComment('')
      window.getSelection()?.removeAllRanges()
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert(
        error instanceof Error
          ? `Failed to create comment: ${error.message}`
          : 'Failed to create comment. Please try again.'
      )
    }
  }

  const handleResolve = async (commentId: Id<'comments'>, resolved: boolean) => {
    await resolveComment({ commentId, resolved })
  }

  const visibleComments =
    comments?.filter((c) => showResolved || !c.resolved) || []

  return (
    <div className="border-t border-base-300 mt-8 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare size={20} />
          Comments ({visibleComments.length})
        </h3>
        <label className="label cursor-pointer gap-2">
          <span className="label-text">Show resolved</span>
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
        </label>
      </div>

      {selectedText && (
        <div className="alert alert-info mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Selected text:</p>
            <p className="text-sm italic">"{selectedText.text}"</p>
            <textarea
              className="textarea textarea-bordered w-full mt-2"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateComment}
                className="btn btn-primary btn-sm"
                disabled={!newComment.trim()}
              >
                Add Comment
              </button>
              <button
                onClick={() => {
                  setSelectedText(null)
                  setNewComment('')
                  window.getSelection()?.removeAllRanges()
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        onMouseUp={handleTextSelection}
        className="space-y-4"
      >
        {visibleComments.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No comments yet. Select text to add a comment.
          </p>
        ) : (
          visibleComments.map((comment) => {
            const anchorText = noteContent.substring(
              comment.anchorStart,
              comment.anchorEnd
            )
            return (
              <div
                key={comment._id}
                className={`card bg-base-200 shadow-sm ${
                  comment.resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {comment.author?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {currentUserId === comment.authorId && (
                      <button
                        onClick={() =>
                          handleResolve(comment._id, !comment.resolved)
                        }
                        className={`btn btn-xs ${
                          comment.resolved ? 'btn-ghost' : 'btn-success'
                        }`}
                      >
                        {comment.resolved ? (
                          <>
                            <X size={12} />
                            Unresolve
                          </>
                        ) : (
                          <>
                            <Check size={12} />
                            Resolve
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="bg-base-300 p-2 rounded text-sm italic mb-2">
                    "{anchorText}"
                  </div>
                  <p className="text-sm">{comment.body}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>💡 Tip: Select text in the note to add a comment</p>
      </div>
    </div>
  )
}

