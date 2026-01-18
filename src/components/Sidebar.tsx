import { useEffect, useState } from 'react'
import { useSidebar } from '../lib/sidebar-context'
import FileTree from './FileTree'

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
      if (window.innerWidth < 1024) {
        setIsCollapsed(true) // Auto-collapse on mobile
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsCollapsed])

  // On mobile, sidebar should be hidden by default
  if (isMobile && isCollapsed) {
    return null // Mobile toggle is handled in Header
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-[4rem] bottom-0 z-40 bg-base-200 border-r border-base-300 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-0 overflow-hidden border-0' : 'w-64'
        } ${isMobile ? '' : 'lg:static lg:z-auto lg:top-0 lg:h-screen'}`}
      >
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <FileTree />
        </div>
      </aside>
    </>
  )
}

