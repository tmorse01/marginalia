import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Plus } from 'lucide-react'
import { useCurrentUser } from '../lib/auth'
import LandingPage from '../components/LandingPage'

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

  // Show landing page for first-time users (no notes yet)
  if (notes !== undefined && notes.length === 0) {
    return <LandingPage />
  }

  // Show notes dashboard for users with existing notes
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Notes</h1>
        <Link to="/notes/new" search={{ folderId: undefined }} className="btn btn-primary">
          <Plus size={20} />
          New Note
        </Link>
      </div>

      {notes === undefined ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="text-base-content/60">
          <p>Use the file tree on the left to navigate and organize your notes.</p>
          <p className="text-sm mt-2">
            You have {notes.length} note{notes.length !== 1 ? 's' : ''} total.
          </p>
        </div>
      )}
    </div>
  )
}
