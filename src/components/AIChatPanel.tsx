import { useState } from 'react'
import { Send, Bot, User } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface AIChatPanelProps {
  noteId: Id<'notes'>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function AIChatPanel({ noteId: _noteId }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Array<Message>>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you write and improve your documentation. Ask me anything about your note, or request help with writing, editing, or formatting.',
      timestamp: Date.now(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response (placeholder - no actual AI integration yet)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'AI chat functionality is coming soon! This feature will allow you to collaborate with AI to write and improve your documentation.',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-base-300 bg-base-200/50">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          <h3 className="font-bold">AI Assistant</h3>
        </div>
        <p className="text-xs text-base-content/60 mt-1">
          Get help writing and improving your documentation
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot size={16} className="text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200 text-base-content'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="bg-base-200 rounded-lg p-3">
              <span className="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-base-300 bg-base-200/30">
        <div className="join w-full">
          <input
            type="text"
            className="input input-bordered join-item flex-1"
            placeholder="Ask AI to help with your note..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            className="btn btn-primary join-item"
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-base-content/50 mt-2 text-center">
          AI integration coming soon
        </p>
      </div>
    </div>
  )
}

