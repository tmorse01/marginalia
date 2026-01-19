import { Link } from '@tanstack/react-router'
import {
  FileText,
  Users,
  MessageSquare,
  Share2,
  Zap,
  Bot,
  Sparkles,
  Lightbulb,
  Code,
} from 'lucide-react'
import Logo from '../Logo'
import AIDemoSection from './AIDemoSection'
import CollaborationDemoSection from './CollaborationDemoSection'
import UseCaseCards from './UseCaseCards'
import StatsSection from './StatsSection'
import TestimonialsSection from './TestimonialsSection'
import FeatureComparisonTable from './FeatureComparisonTable'

export default function LandingPage() {
  const scrollToDemo = () => {
    const element = document.getElementById('ai-demo')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex flex-col -mx-4 -my-8">
      {/* Enhanced Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-16 min-h-[70vh] bg-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Logo className="w-12 h-12" />
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Bot size={20} className="brand-primary" />
                  <span className="text-sm font-semibold brand-primary">AI-Powered</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 brand-primary">
                Write Better Notes with AI
              </h1>
              <p className="text-xl md:text-2xl text-base-content/70 mb-4">
                Real-time collaboration meets intelligent assistance
              </p>
              <p className="text-lg text-base-content/60 mb-8">
                Markdown notes with live collaboration, inline comments, and AI-powered writing
                assistance. Built for focused work, not feeds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/notes/new"
                  search={{ folderId: undefined }}
                  className="btn btn-primary btn-lg transition-all hover:scale-105"
                >
                  <Sparkles size={20} />
                  Start Writing with AI
                </Link>
                <button
                  onClick={scrollToDemo}
                  className="btn btn-outline btn-lg transition-all hover:scale-105"
                >
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right: Demo Preview */}
            <div className="hidden md:block">
              <div className="card bg-base-200 border border-base-300 shadow-xl">
                <div className="card-body p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot size={20} className="brand-primary" />
                    <span className="font-semibold">AI Assistant</span>
                  </div>
                  <div className="bg-base-100 rounded-lg p-4 min-h-[200px] font-mono text-sm space-y-2">
                    <div className="text-base-content/60"># Project Proposal</div>
                    <div className="text-base-content/80 mt-4">
                      <div className="p-2 bg-primary/5 rounded border-l-2 border-primary">
                        I can help you write a project proposal! Here's a structure...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <div id="ai-demo">
        <AIDemoSection />
      </div>

      {/* Collaboration Demo Section */}
      <CollaborationDemoSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Enhanced Features Section */}
      <section className="py-16 px-4 bg-base-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Write Better
            </h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Powerful features designed for thoughtful collaboration and AI-assisted writing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Bot className="w-8 h-8" />}
              title="AI Writing Assistant"
              description="Get help writing, editing, and improving your notes. AI understands your context and suggests improvements."
            />
            <FeatureCard
              icon={<Sparkles className="w-8 h-8" />}
              title="Context-Aware Suggestions"
              description="AI reads your entire note and provides relevant suggestions based on your content and goals."
            />
            <FeatureCard
              icon={<Code className="w-8 h-8" />}
              title="Smart Formatting"
              description="AI helps format markdown correctly, suggests structure, and maintains consistency."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Real-Time Collaboration"
              description="See who's editing, watch changes live, and collaborate seamlessly with presence indicators."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Inline Comments"
              description="Threaded discussions anchored to specific lines. Resolve comments as you iterate."
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Markdown First"
              description="Pure markdown editing with live preview. Your source is always visible and editable."
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
              icon={<Lightbulb className="w-8 h-8" />}
              title="Calm & Focused"
              description="No feeds, no algorithms, no engagement farming. Just your notes and the people you share them with."
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <UseCaseCards />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Feature Comparison Table */}
      <FeatureComparisonTable />

      {/* Final CTA Section */}
      <section className="py-16 px-4 bg-base-200/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Write Better Notes?
          </h2>
          <p className="text-lg text-base-content/70 mb-8">
            Create your first note and experience AI-assisted writing with real-time collaboration.
          </p>
          <Link
            to="/notes/new"
            search={{ folderId: undefined }}
            className="btn btn-primary btn-lg transition-all hover:scale-105"
          >
            <Sparkles size={20} />
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
        <div className="brand-primary mb-4 transition-transform duration-300 group-hover:scale-110">{icon}</div>
        <h3 className="card-title text-xl mb-2">{title}</h3>
        <p className="text-base-content/70">{description}</p>
      </div>
    </div>
  )
}
