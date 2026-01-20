import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { User, LogOut } from 'lucide-react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from 'convex/_generated/api'
import { useCurrentUser } from '../lib/auth'

const IS_DEV = false // Disabled for auth testing

export default function ProfileDropdown() {
  const userId = useCurrentUser()
  const user = useQuery(
    api.users.get,
    userId ? { userId } : 'skip'
  )
  const { signOut } = useAuthActions()

  // Don't render if user is not authenticated (should be handled by parent)
  if (userId === null || userId === undefined) {
    return null
  }

  const displayName = user?.name || user?.email || 'User'

  const handleSignOut = async () => {
    if (!IS_DEV) {
      await signOut()
    } else {
      // In dev mode, just reload to reset state
      window.location.reload()
    }
  }

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
              {IS_DEV && (
                <div className="text-xs text-primary mt-1">Dev Mode (Premium)</div>
              )}
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
        {!IS_DEV && (
          <li>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-error"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
