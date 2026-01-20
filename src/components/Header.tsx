import { Link } from '@tanstack/react-router'
import { Menu, X, PanelLeft, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { useSidebar } from '../lib/sidebar-context'
import { useCurrentUser } from '../lib/auth'
import { useAuthActions } from '@convex-dev/auth/react'
import { useAuthFlag } from '../lib/feature-flags'
import Logo from './Logo'
import ProfileDropdown from './ProfileDropdown'
import ThemeSelector from './ThemeSelector'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { isCollapsed, toggleCollapse, isLandingPage } = useSidebar()
  const authEnabled = useAuthFlag()
  const userId = useCurrentUser()
  
  // Only use auth hooks if auth is enabled
  const authActions = authEnabled ? useAuthActions() : null
  const authState = authEnabled ? useConvexAuth() : { isAuthenticated: false }
  
  const signIn = authActions?.signIn
  const signOut = authActions?.signOut
  const { isAuthenticated } = authState
  
  const handleSignIn = async () => {
    if (!authEnabled || !signIn) {
      console.warn('[AUTH] Sign in attempted but auth is disabled')
      return
    }
    
    console.log('[AUTH DEBUG] ===== SIGN IN CLICKED =====')
    console.log('[AUTH DEBUG] Current userId:', userId)
    console.log('[AUTH DEBUG] isAuthenticated:', isAuthenticated)
    
    // If somehow authenticated but userId is null, sign out first to reset state
    if (isAuthenticated && userId === null && signOut) {
      console.log('[AUTH DEBUG] Auth state mismatch detected, signing out first...')
      try {
        await signOut()
        // Wait a moment for sign out to complete
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('[AUTH DEBUG] Error signing out:', error)
      }
    }
    
    try {
      const result = signIn('github')
      console.log('[AUTH DEBUG] signIn returned:', result)
      
      // If signIn returns a promise, wait a bit to see if redirect happens
      if (result && typeof result.then === 'function') {
        await Promise.race([
          result,
          new Promise(resolve => setTimeout(resolve, 1000))
        ])
      } else {
        // If no redirect happened after a short delay, force it
        setTimeout(() => {
          if (document.hasFocus()) {
            console.log('[AUTH DEBUG] No redirect detected, forcing redirect to GitHub OAuth')
            window.location.href = 'https://useful-vole-535.convex.site/api/auth/signin/github'
          }
        }, 500)
      }
    } catch (error) {
      console.error('[AUTH DEBUG] signIn error:', error)
      // Fallback: redirect directly to OAuth URL
      window.location.href = 'https://useful-vole-535.convex.site/api/auth/signin/github'
    }
  }

  return (
    <>
      <header className="navbar bg-base-300 shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          {!isLandingPage && (
            <button
              onClick={toggleCollapse}
              className="btn btn-ghost btn-square"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className="size-[1.2em]" strokeWidth={2.5} />
            </button>
          )}
          <Link to="/" className="text-xl gap-2 flex items-center">
            <Logo />
            Marginalia
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={() => setIsOpen(true)}
            className="btn btn-square btn-ghost lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-[1.2em]" strokeWidth={2.5} />
          </button>
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <ThemeSelector />
            {userId === undefined ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : userId === null ? (
              <button
                onClick={handleSignIn}
                className="btn btn-primary btn-sm gap-2"
              >
                <LogIn size={16} />
                Sign In
              </button>
            ) : (
              <ProfileDropdown />
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-80 bg-base-300 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h2 className="text-xl font-bold">Navigation</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-square btn-ghost btn-sm"
                aria-label="Close menu"
              >
                <X className="size-[1.2em]" strokeWidth={2.5} />
              </button>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="mb-4">
                {userId === undefined ? (
                  <div className="flex justify-center">
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                ) : userId === null ? (
                  <button
                    onClick={handleSignIn}
                    className="btn btn-primary btn-sm w-full gap-2"
                  >
                    <LogIn size={16} />
                    Sign In
                  </button>
                ) : (
                  <ProfileDropdown />
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-base-300">
                <div className="text-sm font-medium mb-2 px-2">Theme</div>
                <div className="px-2">
                  <ThemeSelector />
                </div>
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
