import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Home, ChevronRight, Folder, FileText, Plus } from 'lucide-react'
import { useCurrentUser } from '../../lib/auth'

export const Route = createFileRoute('/folders/$folderId')({
  component: FolderView,
})

function FolderView() {
  const { folderId } = Route.useParams()
  const navigate = useNavigate()
  const currentUserId = useCurrentUser()
  const folder = useQuery(api.folders.get, { folderId: folderId as any })
  const folderPath = useQuery(api.folders.getPath, { folderId: folderId as any })
  const contents = useQuery(
    api.folders.getContents,
    currentUserId ? { folderId: folderId as any, userId: currentUserId } : 'skip'
  )

  if (currentUserId === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (folder === undefined || contents === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (folder === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Folder not found or you don't have permission to view it</span>
        </div>
        <button
          onClick={() => navigate({ to: '/' })}
          className="btn btn-primary mt-4"
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
        <Link
          to="/"
          className="flex items-center gap-1 text-base-content/70 hover:text-primary transition-colors"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
        {folderPath && folderPath.length > 0 && (
          <>
            {folderPath
              .filter((pathFolder) => pathFolder._id !== folderId)
              .map((pathFolder) => (
                <div key={pathFolder._id} className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-base-content/40" />
                  <Link
                    {...({ to: "/folders/$folderId", params: { folderId: pathFolder._id } } as any)}
                    className="text-base-content/70 hover:text-primary transition-colors"
                  >
                    {pathFolder.name}
                  </Link>
                </div>
              ))}
            <ChevronRight size={14} className="text-base-content/40" />
          </>
        )}
        <span className="text-base-content font-medium">{folder.name}</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{folder.name}</h1>
        <Link
          to="/notes/new"
          search={{ folderId: folderId as any }}
          className="btn btn-primary"
        >
          <Plus size={20} />
          New Note
        </Link>
      </div>

      {/* Contents Grid */}
      {contents.folders.length === 0 && contents.notes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base-content/60 text-lg mb-4">This folder is empty</p>
          <Link
            to="/notes/new"
            search={{ folderId: folderId as any }}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Create Your First Note
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Folder Cards */}
          {contents.folders.map((subfolder) => (
            <Link
              key={subfolder._id}
              {...({ to: "/folders/$folderId", params: { folderId: subfolder._id } } as any)}
              className="card bg-base-100 border-2 border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="card-body p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Folder size={24} className="text-primary flex-shrink-0" />
                  <h3 className="card-title text-lg truncate">{subfolder.name}</h3>
                </div>
                <p className="text-sm text-base-content/60">Folder</p>
              </div>
            </Link>
          ))}

          {/* Note Cards */}
          {contents.notes.map((note) => (
            <Link
              key={note._id}
              to="/notes/$noteId"
              params={{ noteId: note._id }}
              className="card bg-base-100 border-2 border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="card-body p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={24} className="text-base-content/70 flex-shrink-0" />
                  <h3 className="card-title text-lg truncate">
                    {note.title || 'Untitled'}
                  </h3>
                </div>
                <p className="text-sm text-base-content/60 line-clamp-2">
                  {note.content.substring(0, 100)}
                  {note.content.length > 100 ? '...' : ''}
                </p>
                <div className="text-xs text-base-content/50 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
