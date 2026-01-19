import { useSidebar } from '../lib/sidebar-context'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isLandingPage } = useSidebar()
  
  return (
    <main
      className={`flex-1 transition-all duration-300 overflow-y-auto h-[calc(100vh-4rem)] ${
        isLandingPage || isCollapsed ? 'lg:ml-0' : 'lg:ml-64'
      }`}
    >
      <div className="px-4 py-8">
        {children}
      </div>
    </main>
  )
}

