import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { CheckCircle, Clock, Edit, GitBranch, MessageSquare, Shield, Trash2 } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface ActivityLogProps {
  noteId: Id<'notes'>
}

export default function ActivityLog({ noteId }: ActivityLogProps) {
  const activities = useQuery(api.activity.getNoteActivity, { noteId })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit':
        return <Edit size={16} />
      case 'comment':
        return <MessageSquare size={16} />
      case 'resolve':
        return <CheckCircle size={16} />
      case 'fork':
        return <GitBranch size={16} />
      case 'permission':
        return <Shield size={16} />
      case 'delete':
        return <Trash2 size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const getActivityText = (activity: any) => {
    const actorName = activity.actor?.name || 'Someone'
    switch (activity.type) {
      case 'edit':
        return `${actorName} edited the note`
      case 'comment':
        return `${actorName} added a comment`
      case 'resolve':
        return `${actorName} resolved a comment`
      case 'fork':
        return `${actorName} forked the note`
      case 'permission':
        return `${actorName} changed permissions`
      case 'delete': {
        const metadata = activity.metadata || {}
        if (metadata.isReply) {
          return `${actorName} deleted a reply`
        } else if (metadata.replyCount > 0) {
          return `${actorName} deleted a comment and ${metadata.replyCount} ${metadata.replyCount === 1 ? 'reply' : 'replies'}`
        } else {
          return `${actorName} deleted a comment`
        }
      }
      default:
        return `${actorName} performed an action`
    }
  }

  if (activities === undefined) {
    return (
      <div className="text-center py-4">
        <span className="loading loading-spinner"></span>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="border-t border-base-300 mt-8 pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock size={20} />
          Activity
        </h3>
        <div className="alert alert-info">
          <p className="text-sm">No activity yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-base-300 mt-8 pt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock size={20} />
        Activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity._id}
            className="card bg-base-200 border border-base-300"
          >
            <div className="card-body p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-primary">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{getActivityText(activity)}</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

