import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth, useQuery } from 'convex/react'
import { LogIn, LogOut, User } from 'lucide-react'
import { useState } from 'react'

import { api } from '../../convex/_generated/api'

export default function AuthAccountMenu() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : 'skip')
  const { signIn, signOut } = useAuthActions()
  const [modalOpen, setModalOpen] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  if (import.meta.env.DEV) {
    // Intentionally chatty but small, helps diagnose “logged in but viewer null”.
    console.debug('[auth] AuthAccountMenu', {
      isLoading,
      isAuthenticated,
      viewerState: viewer === undefined ? 'loading' : viewer === null ? 'null' : 'doc',
      viewerId: viewer && viewer !== null ? viewer._id : null,
    })
  }

  const handleSignInGoogle = () => {
    setSigningIn(true)
    void signIn('google', { redirectTo: window.location.href }).finally(() => {
      setSigningIn(false)
      setModalOpen(false)
    })
  }

  const handleSignOut = () => {
    void signOut()
  }

  if (isLoading) {
    return (
      <span className="text-sm text-base-content/50" aria-live="polite">
        …
      </span>
    )
  }

  if (isAuthenticated && viewer === undefined) {
    return <span className="loading loading-spinner loading-sm text-primary" aria-label="Loading profile" />
  }

  if (isAuthenticated && viewer !== null && viewer !== undefined) {
    const label = viewer.email ?? viewer.name ?? 'Account'
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="hidden sm:inline text-sm text-base-content/80 truncate max-w-48" title={label}>
          {label}
        </span>
        <button type="button" className="btn btn-ghost btn-sm gap-1 shrink-0" onClick={() => void handleSignOut()}>
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    )
  }

  const showGuestLabel = !isAuthenticated

  return (
    <>
      <div className="flex items-center gap-2">
        {showGuestLabel ? (
          <span className="hidden sm:inline text-xs text-base-content/50">Guest</span>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost btn-sm gap-1"
          onClick={() => setModalOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={modalOpen}
        >
          <LogIn className="size-4" />
          Sign in
        </button>
      </div>

      {modalOpen && (
        <div className="modal modal-open z-60" role="presentation">
          <div className="modal-box">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <User className="size-5" />
              Sign in
            </h3>
            <p className="py-3 text-sm text-base-content/80">
              Optional: sign in with Google to sync your account across devices. You can keep using Marginalia as a guest
              without an account.
            </p>
            <div className="modal-action flex-wrap gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary gap-2"
                disabled={signingIn}
                onClick={handleSignInGoogle}
              >
                {signingIn ? 'Redirecting…' : 'Continue with Google'}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-black/50"
            aria-label="Close"
            onClick={() => setModalOpen(false)}
          />
        </div>
      )}
    </>
  )
}
