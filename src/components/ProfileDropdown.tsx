import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { User } from 'lucide-react'
import { api } from 'convex/_generated/api'
import { useCurrentUser } from '../lib/auth'

export default function ProfileDropdown() {
  const userId = useCurrentUser()
  const user = useQuery(
    api.users.get,
    userId ? { userId } : 'skip'
  )

  const displayName = user?.name || user?.email || 'User'

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm gap-2">
        <User size={16} />
        <span className="hidden sm:inline">{displayName}</span>
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-200 rounded-box z-1 w-52 p-2 shadow-lg border border-base-300"
      >
        {user && (
          <>
            <li className="px-2 py-1">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-base-content/60">{user.email}</div>
            </li>
            <li>
              <div className="divider my-1"></div>
            </li>
          </>
        )}
        <li>
          <Link to="/settings" className="flex items-center gap-2">
            Settings
          </Link>
        </li>
      </ul>
    </div>
  )
}
