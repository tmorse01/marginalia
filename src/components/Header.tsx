import { Link } from '@tanstack/react-router'
import { Menu, X, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { useSidebar } from '../lib/sidebar-context'
import Logo from './Logo'
import ThemeSelector from './ThemeSelector'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { isCollapsed, toggleCollapse, isLandingPage } = useSidebar()

  return (
    <>
      <header className="navbar bg-base-300 shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          {!isLandingPage && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="btn btn-ghost btn-square shrink-0"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="size-[1.35em]" strokeWidth={2.25} />
            </button>
          )}
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 rounded-lg border border-base-content/15 bg-base-200/90 px-3 py-1.5 shadow-sm transition-colors hover:border-primary/35 hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Logo className="h-7 w-7 shrink-0" />
            <span className="truncate text-lg font-semibold tracking-tight text-base-content">
              Marginalia
            </span>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="btn btn-square btn-ghost lg:hidden"
            aria-label="Open settings and theme"
          >
            <MoreVertical className="size-[1.2em]" strokeWidth={2.25} />
          </button>
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <ThemeSelector />
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
