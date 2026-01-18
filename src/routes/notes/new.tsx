import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useCurrentUser } from '../../lib/auth'

export const Route = createFileRoute('/notes/new')({
  component: NewNotePage,
})

const SAMPLE_NOTE_TITLE = 'Productive Notes: A Long-Form Example'
const SAMPLE_NOTE_CONTENT = `# A Long-Form Note Example

This sample note is intentionally long so you can test scrolling, typography, and inline markdown preview. It mixes headings, lists, quotes, and code blocks. Feel free to edit or replace it.

## 1) Context
Notes are at their best when they capture both the **why** and the **what**. That means including background, a few clear decisions, and a short list of next steps.

> "Clarity is kindness." — Brené Brown

## 2) Summary
- Shipping a clean editor experience depends on typography and spacing.
- Inline preview keeps the flow while still showing rich markdown.
- Live cursor presence helps collaborators orient themselves.

## 3) Deep Dive
### 3.1 Observations
The most readable notes tend to:
1. Use short paragraphs.
2. Separate ideas with headings.
3. Keep lists tight and scannable.

### 3.2 A Longer Section
Here is a longer passage to simulate sustained reading. The goal is to test line-length, line-height, and rhythm. A good reading experience makes it easy to pause, scan, and resume without losing context. This section repeats ideas with slight variations to provide enough length for scrolling and for evaluating typographic consistency across paragraphs.

Another paragraph continues the idea. Good notes should feel calm and breathable, with enough vertical spacing to separate thoughts without feeling sparse. This is especially noticeable when you have multiple paragraphs back-to-back.

## 4) Checklist
- [x] Headings render with clear hierarchy
- [x] Lists have proper spacing
- [x] Blockquotes stand out but don't shout
- [ ] Verify code blocks on dark mode
- [ ] Test live cursors in viewer

## 5) Code Sample
\`\`\`ts
type Note = {
  title: string
  content: string
  updatedAt: number
}

function summarize(note: Note) {
  return \`\${note.title} (\${new Date(note.updatedAt).toLocaleDateString()})\`
}
\`\`\`

## 6) Final Thoughts
This note gives you enough length to test scrolling and layout stability. Try collapsing/expanding sections, editing inline, and switching between view and edit modes to see how it feels.`

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
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-primary mb-6">Create New Note</h2>
          
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Title</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setTitle(SAMPLE_NOTE_TITLE)
                  setContent(SAMPLE_NOTE_CONTENT)
                }}
              >
                Insert sample note
              </button>
            </label>
            <input
              type="text"
              placeholder="Note title"
              className="input input-bordered w-full focus:border-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Content</span>
            </label>
            <textarea
              placeholder="Start writing in Markdown..."
              className="textarea textarea-bordered w-full min-h-[400px] font-mono focus:border-primary"
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

