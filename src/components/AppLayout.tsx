import Header from './Header'
import Sidebar from './Sidebar'
import MainContent from './MainContent'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex relative min-h-screen pt-16">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </>
  )
}
