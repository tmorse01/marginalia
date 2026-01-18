import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useCurrentUser } from '../../lib/auth'

export const Route = createFileRoute('/notes/new')({
  component: NewNotePage,
})

function NewNotePage() {
  const navigate = useNavigate()
  const createNote = useMutation(api.notes.create)
  const userId = useCurrentUser()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!userId) {
      alert('Please wait for user to be initialized')
      return
    }

    setIsCreating(true)
    try {
      const noteId = await createNote({
        title: title.trim(),
        content,
        ownerId: userId,
      })
      navigate({ to: '/notes/$noteId', params: { noteId } })
    } catch (error) {
      console.error('Failed to create note:', error)
      alert(
        error instanceof Error
          ? `Failed to create note: ${error.message}`
          : 'Failed to create note. Please try again.'
      )
    } finally {
      setIsCreating(false)
    }
  }

  // Show loading state while user is being created/fetched
  if (userId === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  // userId is undefined while loading, or Id<'users'> when ready
  // No need to check for null as useCurrentUser never returns null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Create New Note</h2>
          
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input
              type="text"
              placeholder="Note title"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Content</span>
            </label>
            <textarea
              placeholder="Start writing in Markdown..."
              className="textarea textarea-bordered w-full min-h-[400px] font-mono"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="card-actions justify-end">
            <button
              onClick={() => navigate({ to: '/' })}
              className="btn btn-ghost"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="btn btn-primary"
              disabled={isCreating || !title.trim()}
            >
              {isCreating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Note'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

