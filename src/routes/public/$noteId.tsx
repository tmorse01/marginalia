import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import MarkdownViewer from '../../components/MarkdownViewer'

export const Route = createFileRoute('/public/$noteId')({
  component: PublicNotePage,
})

function PublicNotePage() {
  const { noteId } = Route.useParams()
  const note = useQuery(api.notes.getPublic, { noteId: noteId as any })

  if (note === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (note === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Note not found or not publicly accessible</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
          <MarkdownViewer content={note.content} />
        </div>
      </div>
    </div>
  )
}
