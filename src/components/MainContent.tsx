import { useSidebar } from '../lib/sidebar-context'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  
  return (
    <main
      className={`flex-1 transition-all duration-300 px-4 py-8 lg:mr-80 ${
        isCollapsed ? '' : 'lg:ml-64'
      }`}
    >
      {children}
    </main>
  )
}

