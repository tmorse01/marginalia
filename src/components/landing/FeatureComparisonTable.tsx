import { Check, X } from 'lucide-react'

interface Feature {
  name: string
  marginalia: boolean
  notion: boolean
  obsidian: boolean
  googleDocs: boolean
}

const features: Array<Feature> = [
  {
    name: 'AI-Assisted Writing',
    marginalia: true,
    notion: false,
    obsidian: false,
    googleDocs: false,
  },
  {
    name: 'Real-Time Markdown Editing',
    marginalia: true,
    notion: false,
    obsidian: false,
    googleDocs: false,
  },
  {
    name: 'Inline Comments',
    marginalia: true,
    notion: true,
    obsidian: false,
    googleDocs: true,
  },
  {
    name: 'Per-Note Sharing',
    marginalia: true,
    notion: true,
    obsidian: false,
    googleDocs: true,
  },
  {
    name: 'Activity History',
    marginalia: true,
    notion: true,
    obsidian: false,
    googleDocs: true,
  },
  {
    name: 'Presence Indicators',
    marginalia: true,
    notion: true,
    obsidian: false,
    googleDocs: true,
  },
  {
    name: 'Markdown Source Visible',
    marginalia: true,
    notion: false,
    obsidian: true,
    googleDocs: false,
  },
  {
    name: 'No Feed/Algorithm',
    marginalia: true,
    notion: false,
    obsidian: true,
    googleDocs: false,
  },
]

export default function FeatureComparisonTable() {
  return (
    <section className="py-16 px-4 bg-base-200/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Compare Marginalia
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            See how Marginalia compares to other note-taking and collaboration tools.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full bg-base-100 border border-base-300 shadow-lg">
            <thead>
              <tr className="bg-base-200">
                <th className="font-semibold">Feature</th>
                <th className="text-center font-semibold brand-primary">Marginalia</th>
                <th className="text-center font-semibold">Notion</th>
                <th className="text-center font-semibold">Obsidian</th>
                <th className="text-center font-semibold">Google Docs</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr key={idx} className="hover:bg-base-200/50">
                  <td className="font-medium">{feature.name}</td>
                  <td className="text-center">
                    {feature.marginalia ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-error mx-auto opacity-30" />
                    )}
                  </td>
                  <td className="text-center">
                    {feature.notion ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-error mx-auto opacity-30" />
                    )}
                  </td>
                  <td className="text-center">
                    {feature.obsidian ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-error mx-auto opacity-30" />
                    )}
                  </td>
                  <td className="text-center">
                    {feature.googleDocs ? (
                      <Check className="w-5 h-5 text-success mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-error mx-auto opacity-30" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <p className="text-base-content/70 mb-4">
            Marginalia combines the best of markdown editing, real-time collaboration, and AI assistance.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <div className="badge badge-primary badge-lg">AI-Powered</div>
            <div className="badge badge-primary badge-lg">Markdown-First</div>
            <div className="badge badge-primary badge-lg">Real-Time</div>
            <div className="badge badge-primary badge-lg">Focused</div>
          </div>
        </div>
      </div>
    </section>
  )
}
