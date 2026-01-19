import { Link } from '@tanstack/react-router'
import { FileText, Users, MessageSquare, Share2, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useSidebar } from '../lib/sidebar-context'
import Logo from './Logo'

export default function LandingPage() {
  const { setIsLandingPage } = useSidebar()

  useEffect(() => {
    setIsLandingPage(true)
    return () => setIsLandingPage(false)
  }, [setIsLandingPage])

  return (
    <div className="flex flex-col -mx-4 -my-8">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-16 min-h-[60vh]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Logo className="w-16 h-16" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 pb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Marginalia
          </h1>
          <p className="text-xl md:text-2xl text-base-content/70 mb-4 max-w-2xl mx-auto">
            Real-time shared notes that feel alive
          </p>
          <p className="text-lg text-base-content/60 mb-12 max-w-xl mx-auto">
            Markdown notes with live collaboration, inline comments, and thoughtful sharing.
            Built for focused work, not feeds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/notes/new" 
              search={{ folderId: undefined }} 
              className="btn btn-primary btn-lg transition-all hover:scale-105"
            >
              Create Your First Note
            </Link>
            <Link 
              to="/" 
              className="btn btn-outline btn-lg transition-all hover:scale-105"
            >
              View Your Notes
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-base-200/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built for thoughtful collaboration
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Markdown First"
              description="Write in Markdown. No rich text abstractions. Your source is always visible and editable."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Real-Time Editing"
              description="See changes as they happen. Presence indicators show who's viewing and editing with you."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Inline Comments"
              description="Comments anchored to text ranges. Resolve discussions as you iterate together."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Per-Note Sharing"
              description="Control access note by note. Share with editors, viewers, or make it public via link."
            />
            <FeatureCard
              icon={<Share2 className="w-8 h-8" />}
              title="Activity History"
              description="See what happened in each note. Edits, comments, and permission changes in one place."
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Calm & Focused"
              description="No feeds, no algorithms, no engagement farming. Just your notes and the people you share them with."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg text-base-content/70 mb-8">
            Create your first note and experience real-time collaboration.
          </p>
          <Link 
            to="/notes/new" 
            search={{ folderId: undefined }} 
            className="btn btn-primary btn-lg transition-all hover:scale-105"
          >
            Create Your First Note
          </Link>
        </div>
      </section>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="card-body">
        <div className="text-primary mb-4 transition-transform duration-300 group-hover:scale-110">{icon}</div>
        <h3 className="card-title text-xl mb-2">{title}</h3>
        <p className="text-base-content/70">{description}</p>
      </div>
    </div>
  )
}
