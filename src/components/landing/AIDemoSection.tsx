import { useState, useEffect } from 'react'
import { Bot, User, Sparkles, Send } from 'lucide-react'

interface DemoMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const demoConversations = [
  {
    scenario: 'Help me write a project proposal',
    messages: [
      {
        role: 'user' as const,
        content: 'Help me write a project proposal for a new feature',
        timestamp: 0,
      },
      {
        role: 'assistant' as const,
        content: 'I can help you write a project proposal! Here\'s a structure you might consider:\n\n## Project Proposal: [Feature Name]\n\n### Overview\nBrief description of the feature and its purpose.\n\n### Objectives\n- Primary goal\n- Secondary goals\n\n### Scope\nWhat\'s included and what\'s out of scope.\n\n### Timeline\nEstimated milestones and deadlines.\n\nWould you like me to help you fill in any specific section?',
        timestamp: 1000,
      },
    ],
  },
  {
    scenario: 'Improve the clarity of this paragraph',
    messages: [
      {
        role: 'user' as const,
        content: 'Can you improve this paragraph for clarity?\n\n"The system does things when users do stuff and then it updates."',
        timestamp: 0,
      },
      {
        role: 'assistant' as const,
        content: 'Here\'s a clearer version:\n\n"The system automatically updates when users perform actions, ensuring real-time synchronization across all interfaces."\n\n**Improvements made:**\n- Replaced vague "does things" with specific "automatically updates"\n- Clarified "do stuff" as "perform actions"\n- Added context about "real-time synchronization"\n- Made the sentence more professional and precise',
        timestamp: 1000,
      },
    ],
  },
  {
    scenario: 'Generate an outline for a technical document',
    messages: [
      {
        role: 'user' as const,
        content: 'Generate an outline for a technical document about API design',
        timestamp: 0,
      },
      {
        role: 'assistant' as const,
        content: 'Here\'s a comprehensive outline for an API design document:\n\n## API Design Document\n\n### 1. Introduction\n- Purpose and scope\n- Target audience\n- Document conventions\n\n### 2. API Overview\n- High-level architecture\n- Design principles\n- Technology stack\n\n### 3. Endpoints\n- Resource structure\n- HTTP methods\n- Request/response formats\n\n### 4. Authentication & Authorization\n- Auth mechanisms\n- Token management\n- Permissions\n\n### 5. Error Handling\n- Error codes\n- Error response format\n- Best practices\n\n### 6. Rate Limiting\n- Limits and quotas\n- Headers and responses\n\n### 7. Examples\n- Common use cases\n- Code samples\n\nWould you like me to expand any section?',
        timestamp: 1000,
      },
    ],
  },
]

export default function AIDemoSection() {
  const [currentScenario, setCurrentScenario] = useState(0)
  const [messages, setMessages] = useState<Array<DemoMessage>>([])
  const [isPlaying, setIsPlaying] = useState(false)

  const conversation = demoConversations[currentScenario]

  useEffect(() => {
    if (isPlaying) {
      setMessages([])
      let messageIndex = 0
      const timer = setTimeout(() => {
        const addMessage = () => {
          if (messageIndex < conversation.messages.length) {
            setMessages((prev) => [...prev, conversation.messages[messageIndex]])
            messageIndex++
            if (messageIndex < conversation.messages.length) {
              setTimeout(addMessage, 2000)
            } else {
              setIsPlaying(false)
            }
          }
        }
        addMessage()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, currentScenario])

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleNextScenario = () => {
    setCurrentScenario((prev) => (prev + 1) % demoConversations.length)
    setMessages([])
    setIsPlaying(false)
  }

  return (
    <section className="py-16 px-4 bg-base-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 brand-primary">
              <Bot size={32} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            AI Writing Assistant
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Get help writing, editing, and improving your notes. AI understands your context and suggests improvements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: Note Editor Preview */}
          <div className="card bg-base-200 border border-base-300 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="brand-primary" />
                <h3 className="font-semibold">Note Editor</h3>
              </div>
              <div className="bg-base-100 rounded-lg p-4 min-h-[300px] font-mono text-sm">
                <div className="space-y-2">
                  <div className="text-base-content/60"># {conversation.scenario}</div>
                  <div className="text-base-content/80">
                    {messages.length > 0 && messages[0].role === 'user' && (
                      <div className="mt-4 p-3 bg-base-200 rounded">
                        {messages[0].content.split('\n').map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}
                    {messages.length > 1 && messages[1].role === 'assistant' && (
                      <div className="mt-4 p-3 bg-primary/5 rounded border-l-2 border-primary">
                        {messages[1].content.split('\n').map((line, i) => (
                          <div key={i} className={line.startsWith('**') ? 'font-semibold mt-2' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI Chat Interface */}
          <div className="card bg-base-200 border border-base-300 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Bot size={16} className="brand-primary" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <div className="bg-base-100 rounded-lg p-4 min-h-[300px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                  {messages.length === 0 && !isPlaying && (
                    <div className="text-center text-base-content/60 py-8">
                      <p>Click "Try Demo" to see AI in action</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot size={16} className="brand-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-content'
                            : 'bg-base-200 text-base-content'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">
                          {msg.content}
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center shrink-0">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                  {isPlaying && messages.length === 0 && (
                    <div className="flex justify-center">
                      <span className="loading loading-dots loading-md"></span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <Send size={16} />
                    {isPlaying ? 'Playing...' : 'Try Demo'}
                  </button>
                  <button
                    onClick={handleNextScenario}
                    className="btn btn-outline btn-sm"
                    disabled={isPlaying}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {demoConversations.map((conv, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentScenario(idx)
                setMessages([])
                setIsPlaying(false)
              }}
              className={`btn btn-sm ${
                currentScenario === idx ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {conv.scenario}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
