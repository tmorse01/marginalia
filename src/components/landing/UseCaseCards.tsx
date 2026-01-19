import { FileText, Users, BookOpen, MessageSquare } from 'lucide-react'

interface UseCase {
  icon: React.ReactNode
  title: string
  description: string
  features: Array<string>
}

const useCases: Array<UseCase> = [
  {
    icon: <FileText className="w-8 h-8" />,
    title: 'Technical Documentation',
    description: 'Write API docs with AI assistance',
    features: [
      'AI helps structure complex documentation',
      'Real-time collaboration for team reviews',
      'Inline comments for feedback',
      'Markdown-first for version control',
    ],
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: 'Team Collaboration',
    description: 'Real-time editing for distributed teams',
    features: [
      'See who\'s editing in real-time',
      'Multi-cursor presence indicators',
      'Activity history for transparency',
      'Per-note sharing controls',
    ],
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: 'Research Notes',
    description: 'Organize and improve research with AI',
    features: [
      'AI suggests improvements to clarity',
      'Structure complex research findings',
      'Collaborate with research partners',
      'Maintain organized note hierarchy',
    ],
  },
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: 'Meeting Notes',
    description: 'Collaborative notes with inline comments',
    features: [
      'Real-time note-taking during meetings',
      'Threaded discussions on action items',
      'Resolve comments as tasks complete',
      'Share notes with stakeholders',
    ],
  },
]

export default function UseCaseCards() {
  return (
    <section className="py-16 px-4 bg-base-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perfect for Every Use Case
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Whether you're writing docs, collaborating with teams, or organizing research, Marginalia adapts to your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, idx) => (
            <div
              key={idx}
              className="card bg-base-200 border border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="card-body">
                <div className="brand-primary mb-4">{useCase.icon}</div>
                <h3 className="card-title text-xl mb-2">{useCase.title}</h3>
                <p className="text-base-content/70 mb-4">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-base-content/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
