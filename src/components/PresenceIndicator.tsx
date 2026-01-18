import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

interface PresenceIndicatorProps {
  noteId: Id<'notes'>
  currentUserId?: Id<'users'>
}

export default function PresenceIndicator({
  noteId,
  currentUserId,
}: PresenceIndicatorProps) {
  // For MVP, presence is simplified - will be enhanced later
  const activeUsers = useQuery(api.presence.getActiveUsers, { noteId })

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
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Active:
      </span>
      <div className="flex gap-2">
        {otherUsers.map((user) => (
          <span key={user.userId} className="badge badge-ghost">
            {user.user?.name || 'Anonymous'}
          </span>
        ))}
      </div>
    </div>
  )
}

