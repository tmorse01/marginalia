import { useState, useEffect } from 'react'
import { Users, MessageSquare, Activity, Eye } from 'lucide-react'

interface CursorPosition {
  id: string
  name: string
  color: string
  x: number
  y: number
  visible: boolean
}

interface PresenceUser {
  id: string
  name: string
  color: string
  isActive: boolean
}

const demoUsers: Array<PresenceUser> = [
  { id: '1', name: 'Alex', color: 'hsl(220, 90%, 56%)', isActive: true },
  { id: '2', name: 'Sam', color: 'hsl(280, 60%, 55%)', isActive: true },
  { id: '3', name: 'Jordan', color: 'hsl(142, 76%, 36%)', isActive: false },
]

const demoComments = [
  { id: '1', line: 5, author: 'Alex', text: 'Great point here!', resolved: false },
  { id: '2', line: 12, author: 'Sam', text: 'Should we add more detail?', resolved: false },
]

export default function CollaborationDemoSection() {
  const [cursors, setCursors] = useState<Array<CursorPosition>>([])
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isAnimating) {
      const interval = setInterval(() => {
        setCursors((prev) =>
          prev.map((cursor) => ({
            ...cursor,
            x: Math.random() * 80 + 10,
            y: Math.random() * 70 + 10,
            visible: true,
          }))
        )
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isAnimating])

  const handleStartDemo = () => {
    setIsAnimating(true)
    setCursors(
      demoUsers.map((user) => ({
        id: user.id,
        name: user.name,
        color: user.color,
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 10,
        visible: true,
      }))
    )
  }

  return (
    <section className="py-16 px-4 bg-base-200/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 brand-primary">
              <Users size={32} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Real-Time Collaboration
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            See who's editing, watch changes live, and collaborate seamlessly with presence indicators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Editor with Multi-Cursor Demo */}
          <div className="card bg-base-100 border border-base-300 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="brand-primary" />
                <h3 className="font-semibold">Live Editing</h3>
              </div>
              <div className="relative bg-base-200 rounded-lg p-4 min-h-[400px] font-mono text-sm">
                {/* Simulated note content */}
                <div className="space-y-2 text-base-content/80">
                  <div># Project Planning</div>
                  <div className="text-base-content/60">Last updated: Just now</div>
                  <div className="mt-4 space-y-1">
                    <div>## Goals</div>
                    <div>- Improve user experience</div>
                    <div>- Add new features</div>
                    <div>- Enhance performance</div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div>## Timeline</div>
                    <div>Q1: Planning and design</div>
                    <div>Q2: Development</div>
                    <div>Q3: Testing and launch</div>
                  </div>
                </div>

                {/* Animated cursors */}
                {cursors.map((cursor) => (
                  <div
                    key={cursor.id}
                    className={`absolute transition-all duration-500 ${
                      cursor.visible ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      left: `${cursor.x}%`,
                      top: `${cursor.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full border-2 border-base-100"
                      style={{ backgroundColor: cursor.color }}
                    />
                    <div
                      className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs text-base-100 whitespace-nowrap"
                      style={{ backgroundColor: cursor.color }}
                    >
                      {cursor.name}
                    </div>
                  </div>
                ))}

                {/* Presence indicators */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {demoUsers.map((user) => (
                    <div
                      key={user.id}
                      className="tooltip"
                      data-tip={user.name}
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 border-base-100 flex items-center justify-center text-xs font-semibold text-base-100 ${
                          user.isActive ? 'ring-2 ring-success' : ''
                        }`}
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!isAnimating && (
                <button
                  onClick={handleStartDemo}
                  className="btn btn-primary btn-sm w-full mt-4"
                >
                  Start Demo
                </button>
              )}
            </div>
          </div>

          {/* Right: Features Showcase */}
          <div className="space-y-4">
            {/* Presence Indicators */}
            <div className="card bg-base-100 border border-base-300 shadow-md">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={16} className="brand-primary" />
                  <h3 className="font-semibold">Presence Indicators</h3>
                </div>
                <p className="text-sm text-base-content/70">
                  See who's viewing and editing in real-time. Active users are highlighted with a green ring.
                </p>
                <div className="flex gap-2 mt-4">
                  {demoUsers.map((user) => (
                    <div
                      key={user.id}
                      className="tooltip"
                      data-tip={user.name}
                    >
                      <div
                        className={`w-10 h-10 rounded-full border-2 border-base-200 flex items-center justify-center text-sm font-semibold text-base-100 ${
                          user.isActive ? 'ring-2 ring-success' : ''
                        }`}
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="card bg-base-100 border border-base-300 shadow-md">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={16} className="brand-primary" />
                  <h3 className="font-semibold">Inline Comments</h3>
                </div>
                <p className="text-sm text-base-content/70 mb-4">
                  Threaded discussions anchored to specific lines. Resolve comments as you iterate.
                </p>
                <div className="space-y-2">
                  {demoComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 bg-base-200 rounded-lg border-l-2 border-primary"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{comment.author}</span>
                        <span className="text-xs text-base-content/60">Line {comment.line}</span>
                      </div>
                      <p className="text-sm text-base-content/80">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="card bg-base-100 border border-base-300 shadow-md">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={16} className="brand-primary" />
                  <h3 className="font-semibold">Activity History</h3>
                </div>
                <p className="text-sm text-base-content/70 mb-4">
                  See what happened in each note. Edits, comments, and permission changes in one place.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-base-content/70">Alex edited the document</span>
                    <span className="text-xs text-base-content/50 ml-auto">2m ago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-base-content/70">Sam added a comment</span>
                    <span className="text-xs text-base-content/50 ml-auto">5m ago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span className="text-base-content/70">Jordan viewed the note</span>
                    <span className="text-xs text-base-content/50 ml-auto">10m ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
