import Header from './Header'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex relative min-h-screen pt-16">
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
