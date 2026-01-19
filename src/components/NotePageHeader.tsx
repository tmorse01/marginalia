import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Edit, Eye, Share2, MessageSquare, Home, ChevronRight, Bot, Info } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'
import PresenceIndicator from './PresenceIndicator'

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

interface PresenceEntry {
  userId: Id<'users'>
  user?: {
    name?: string
  } | null
  mode: 'editing' | 'viewing'
}

interface NotePageHeaderProps {
  note: NoteData
  isEditing: boolean
  onEditToggle: () => void
  showSidebar: boolean
  activeTab?: 'comments' | 'ai' | 'metadata'
  onCommentsClick: () => void
  onAIChatClick: () => void
  onMetadataClick: () => void
  onShareClick: () => void
  onTitleChange: (title: string) => void
  noteId: Id<'notes'>
  currentUserId?: Id<'users'>
  activeUsers?: Array<PresenceEntry>
}

export default function NotePageHeader({
  note,
  isEditing,
  onEditToggle,
  showSidebar,
  activeTab,
  onCommentsClick,
  onAIChatClick,
  onMetadataClick,
  onShareClick,
  onTitleChange,
  noteId,
  currentUserId,
  activeUsers,
}: NotePageHeaderProps) {
  // Get folder path
  const folderPath = note.folderId
    ? useQuery(api.folders.getPath, { folderId: note.folderId })
    : null

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(note.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Update local title when note changes
  useEffect(() => {
    if (!isEditingTitle) {
      setTitleValue(note.title)
    }
  }, [note.title, isEditingTitle])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const handleDoubleClick = () => {
    setIsEditingTitle(true)
    setTitleValue(note.title)
  }

  const handleTitleSubmit = () => {
    const trimmedTitle = titleValue.trim()
    if (trimmedTitle && trimmedTitle !== note.title) {
      onTitleChange(trimmedTitle)
    } else {
      setTitleValue(note.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setTitleValue(note.title)
    setIsEditingTitle(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleTitleCancel()
    }
  }

  return (
    <div className="bg-base-200 border-b border-base-300 py-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-3 flex-wrap px-2 sm:px-4">
        <Link
          to="/"
          className="flex items-center gap-1 text-base-content/70 hover:text-primary transition-colors"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
        {folderPath && folderPath.length > 0 && (
          <>
            {folderPath.map((folder) => (
              <div key={folder._id} className="flex items-center gap-2">
                <ChevronRight size={14} className="text-base-content/40" />
                <Link
                  {...({ to: "/folders/$folderId", params: { folderId: folder._id } } as any)}
                  className="text-base-content/70 hover:text-primary transition-colors"
                >
                  {folder.name}
                </Link>
              </div>
            ))}
            <ChevronRight size={14} className="text-base-content/40" />
          </>
        )}
        <span className="text-base-content font-medium">{note.title}</span>
      </nav>

      {/* Page Actions */}
      <div className="flex items-center justify-between px-2 sm:px-4">
        <div className="flex-1">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="input input-bordered w-full max-w-md text-2xl font-bold focus:border-primary focus:outline-none"
              placeholder="Note title"
            />
          ) : (
            <h1
              onDoubleClick={handleDoubleClick}
              className="text-2xl font-bold text-base-content cursor-text hover:text-primary transition-colors"
              title="Double-click to edit"
            >
              {note.title}
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onCommentsClick}
            className={`btn btn-sm btn-circle tooltip tooltip-bottom ${showSidebar && activeTab === 'comments' ? 'btn-primary' : 'btn-ghost'}`}
            data-tip="Comments"
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={onAIChatClick}
            className={`btn btn-sm btn-circle tooltip tooltip-bottom ${showSidebar && activeTab === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
            data-tip="AI Chat"
          >
            <Bot size={18} />
          </button>
          <button
            onClick={onMetadataClick}
            className={`btn btn-sm btn-circle tooltip tooltip-bottom ${showSidebar && activeTab === 'metadata' ? 'btn-primary' : 'btn-ghost'}`}
            data-tip="Note Info"
          >
            <Info size={18} />
          </button>
          <button
            onClick={onShareClick}
            className="btn btn-ghost btn-sm btn-circle tooltip tooltip-bottom"
            data-tip="Share Note"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={onEditToggle}
            className={`btn btn-sm btn-circle tooltip tooltip-bottom ${isEditing ? 'btn-primary' : 'btn-ghost'}`}
            data-tip={isEditing ? 'View Mode' : 'Edit Mode'}
          >
            {isEditing ? (
              <Eye size={18} />
            ) : (
              <Edit size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Presence Indicator */}
      {!isEditing && (
        <div className="px-2 sm:px-4 pt-2 border-t border-base-300">
          <PresenceIndicator
            noteId={noteId}
            currentUserId={currentUserId}
            activeUsers={activeUsers}
          />
        </div>
      )}
    </div>
  )
}

