import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import ThemeSelector from './ThemeSelector'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="navbar bg-base-200 shadow-lg">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">
            Marginalia
          </Link>
        </div>
        <div className="flex-none">
          <button
            onClick={() => setIsOpen(true)}
            className="btn btn-square btn-ghost lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <Link to="/" className="btn btn-ghost">
              Notes
            </Link>
            <Link to="/settings" className="btn btn-ghost">
              Settings
            </Link>
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
          <aside className="fixed top-0 left-0 h-full w-80 bg-base-200 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h2 className="text-xl font-bold">Navigation</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-square btn-ghost btn-sm"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost w-full justify-start mb-2"
              >
                Notes
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost w-full justify-start mb-2"
              >
                Settings
              </Link>
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
