import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

interface PresenceEntry {
  userId: Id<'users'>
  user?: {
    name?: string
  } | null
  mode: 'editing' | 'viewing'
}

interface PresenceIndicatorProps {
  noteId: Id<'notes'>
  currentUserId?: Id<'users'>
  activeUsers?: Array<PresenceEntry>
}

export default function PresenceIndicator({
  noteId,
  currentUserId,
  activeUsers: activeUsersProp,
}: PresenceIndicatorProps) {
  // For MVP, presence is simplified - will be enhanced later
  const activeUsers =
    activeUsersProp ??
    useQuery(api.presence.getActiveUsers, { noteId })

  if (!activeUsers || activeUsers.length === 0) {
    return null
  }

  // Filter out current user
  const otherUsers = activeUsers.filter(
    (user) => user.userId !== currentUserId
  )

  if (otherUsers.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="flex items-center gap-2 text-base-content/70">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
        <span className="font-medium">Live now:</span>
      </span>
      <div className="flex flex-wrap gap-2">
        {otherUsers.map((user) => (
          <span
            key={user.userId}
            className={`badge gap-1 ${
              user.mode === 'editing' ? 'badge-primary' : 'badge-ghost'
            }`}
          >
            {user.user?.name || 'Anonymous'}
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              {user.mode === 'editing' ? 'Editing' : 'Viewing'}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

