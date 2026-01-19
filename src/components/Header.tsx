import { Link } from '@tanstack/react-router'
import { Menu, X, PanelLeft } from 'lucide-react'
import { useState } from 'react'
import { useSidebar } from '../lib/sidebar-context'
import Logo from './Logo'
import ProfileDropdown from './ProfileDropdown'
import ThemeSelector from './ThemeSelector'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { isCollapsed, toggleCollapse, isLandingPage } = useSidebar()

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
            <ProfileDropdown />
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
                <ProfileDropdown />
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
