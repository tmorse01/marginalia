import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Plus } from 'lucide-react'
import { useCurrentUser } from '../lib/auth'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const userId = useCurrentUser()
  const notes = useQuery(
    api.notes.listUserNotes,
    userId ? { userId } : 'skip'
  )

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Notes</h1>
        <Link to="/notes/new" className="btn btn-primary">
          <Plus size={20} />
          New Note
        </Link>
      </div>

      {notes === undefined ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : notes.length === 0 ? (
        <div className="hero bg-base-200 rounded-lg py-12">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold mb-4">No notes yet</h2>
              <p className="text-base-content/60 mb-6">
                Create your first note to get started with Marginalia!
              </p>
              <Link to="/notes/new" className="btn btn-primary">
                <Plus size={20} />
                Create Note
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Link
              key={note._id}
              to="/notes/$noteId"
              params={{ noteId: note._id }}
              className="card bg-base-100 border border-base-300 shadow-lg hover:shadow-xl transition-all hover:border-primary/50"
            >
              <div className="card-body">
                <h2 className="card-title text-primary">{note.title || 'Untitled'}</h2>
                <p className="text-sm text-base-content/60 line-clamp-2">
                  {note.content.substring(0, 100)}
                  {note.content.length > 100 ? '...' : ''}
                </p>
                <div className="card-actions justify-end mt-2">
                  <span className="badge badge-outline">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
