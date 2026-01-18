import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Calendar, User, Folder, Eye, Globe, Lock } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface NoteData {
  _id: Id<'notes'>
  title: string
  content: string
  ownerId: Id<'users'>
  folderId?: Id<'folders'>
  visibility: 'private' | 'shared' | 'public'
  createdAt: number
  updatedAt: number
}

interface NoteMetadataPanelProps {
  note: NoteData
  content: string
}

export default function NoteMetadataPanel({ note, content }: NoteMetadataPanelProps) {
  const owner = useQuery(api.users.get, { userId: note.ownerId })
  // Note: folders.get doesn't exist, so we'll skip folder name for now
  // The folderId is still available if needed in the future

  const wordCount = content.trim().split(/\s+/).filter((word) => word.length > 0).length
  const characterCount = content.length
  const lineCount = content.split('\n').length

  const visibilityConfig = {
    private: { icon: Lock, label: 'Private', color: 'text-error' },
    shared: { icon: Eye, label: 'Shared', color: 'text-warning' },
    public: { icon: Globe, label: 'Public', color: 'text-success' },
  }

  const visibility = visibilityConfig[note.visibility]
  const VisibilityIcon = visibility.icon

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* Title */}
      <div>
        <h3 className="font-bold text-lg mb-2">Note Information</h3>
        <p className="text-sm text-base-content/70">{note.title}</p>
      </div>

      {/* Visibility */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-3">
          <div className="flex items-center gap-2">
            <VisibilityIcon size={16} className={visibility.color} />
            <span className="text-sm font-medium">Visibility</span>
          </div>
          <div className="badge badge-outline mt-1">{visibility.label}</div>
        </div>
      </div>

      {/* Owner */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-3">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-base-content/70" />
            <span className="text-sm font-medium">Owner</span>
          </div>
          <p className="text-sm">{owner?.name || 'Loading...'}</p>
          {owner?.email && (
            <p className="text-xs text-base-content/50 mt-1">{owner.email}</p>
          )}
        </div>
      </div>

      {/* Folder */}
      {note.folderId && (
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3">
            <div className="flex items-center gap-2 mb-2">
              <Folder size={16} className="text-base-content/70" />
              <span className="text-sm font-medium">Folder</span>
            </div>
            <p className="text-sm text-base-content/70">In folder (ID: {note.folderId})</p>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-base-content/70" />
            <span className="text-sm font-medium">Dates</span>
          </div>
          <div>
            <p className="text-xs text-base-content/50 mb-1">Created</p>
            <p className="text-sm">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-base-content/50 mb-1">Last Updated</p>
            <p className="text-sm">
              {new Date(note.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">Statistics</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-base-content/50 mb-1">Words</p>
              <p className="text-lg font-semibold">{wordCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 mb-1">Characters</p>
              <p className="text-lg font-semibold">{characterCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 mb-1">Lines</p>
              <p className="text-lg font-semibold">{lineCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-base-content/50 mb-1">Size</p>
              <p className="text-lg font-semibold">
                {(new Blob([content]).size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

