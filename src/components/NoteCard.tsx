import { Link } from '@tanstack/react-router'
import { FileText, Lock, Eye, Globe, Folder, Clock } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface NoteCardProps {
  note: {
    _id: Id<'notes'>
    title: string
    content: string
    updatedAt: number
    createdAt: number
    folderId?: Id<'folders'>
    visibility: 'private' | 'shared' | 'public'
    ownerId: Id<'users'>
  }
  folderName?: string
}

/**
 * Strip basic markdown syntax for preview text
 */
function stripMarkdown(text: string): string {
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---$/gm, '')
    // Clean up extra whitespace
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return new Date(timestamp).toLocaleDateString()
  } else if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else {
    return 'Just now'
  }
}

export default function NoteCard({ note, folderName }: NoteCardProps) {
  const strippedContent = stripMarkdown(note.content)
  const preview = strippedContent.substring(0, 150)
  const hasMore = strippedContent.length > 150

  const visibilityConfig = {
    private: { icon: Lock, label: 'Private', color: 'badge-error' },
    shared: { icon: Eye, label: 'Shared', color: 'badge-warning' },
    public: { icon: Globe, label: 'Public', color: 'badge-success' },
  }

  const visibility = visibilityConfig[note.visibility]
  const VisibilityIcon = visibility.icon

  return (
    <Link
      to="/notes/$noteId"
      params={{ noteId: note._id }}
      className="card bg-base-100 border-2 border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
    >
      <div className="card-body p-4 flex flex-col h-full">
        {/* Header with title and visibility badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText size={20} className="text-base-content/60 shrink-0 group-hover:text-primary transition-colors" />
            <h3 className="card-title text-lg truncate font-semibold">
              {note.title || 'Untitled'}
            </h3>
          </div>
          <div className={`badge badge-sm ${visibility.color} shrink-0`} title={visibility.label}>
            <VisibilityIcon size={12} />
          </div>
        </div>

        {/* Content preview */}
        {preview ? (
          <p className="text-sm text-base-content/60 line-clamp-2 mb-3 flex-1">
            {preview}
            {hasMore ? '...' : ''}
          </p>
        ) : (
          <p className="text-sm text-base-content/40 italic line-clamp-2 mb-3 flex-1">
            No content yet
          </p>
        )}

        {/* Footer with metadata */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-base-300">
          <div className="flex items-center gap-1.5 text-xs text-base-content/50">
            <Clock size={12} />
            <span>{formatRelativeTime(note.updatedAt)}</span>
          </div>
          {folderName && (
            <div className="flex items-center gap-1.5 text-xs text-base-content/50">
              <Folder size={12} />
              <span className="truncate max-w-[100px]">{folderName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
