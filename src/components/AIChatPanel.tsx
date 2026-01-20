import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Trash2, MessageSquare, Edit, ChevronDown, ChevronUp, Check, LogIn } from 'lucide-react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { useCurrentUser } from '../lib/auth'
import MarkdownViewer from './MarkdownViewer'
import type { Id } from 'convex/_generated/dataModel'

interface AIChatPanelProps {
  noteId: Id<'notes'>
  noteContent: string
  noteTitle: string
  onApplySuggestion?: (suggestion: string) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  suggestionId?: string
  isSuggestion?: boolean // Track if this is a suggestion that should be handled specially
  fullSuggestionContent?: string // Store full content separately for suggestions
}

type AIMode = 'chat' | 'edit' // Chat mode: just conversation, Edit mode: auto-show suggestions in editor

export default function AIChatPanel({
  noteId,
  noteContent,
  noteTitle,
  onApplySuggestion,
}: AIChatPanelProps) {
  const currentUserId = useCurrentUser()
  const { signIn } = useAuthActions()
  // Type assertions needed until Convex generates API types (run `npx convex dev`)
  const chatAction = useAction((api as any).ai?.chat)
  const addMessageMutation = useMutation((api as any).aiConversations?.addMessage)
  const clearConversationMutation = useMutation((api as any).aiConversations?.clearConversation)
  const hasAIAccess = useQuery(
    (api as any).users?.hasAIAccess,
    currentUserId ? { userId: currentUserId } : 'skip'
  )
  const conversation = useQuery(
    (api as any).aiConversations?.getConversation,
    currentUserId ? { noteId, userId: currentUserId } : 'skip'
  )

  const [messages, setMessages] = useState<Array<Message>>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Load mode from localStorage, default to 'edit'
  const [aiMode, setAiMode] = useState<AIMode>(() => {
    const saved = localStorage.getItem('ai-chat-mode')
    return (saved === 'chat' || saved === 'edit') ? saved : 'edit'
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Persist mode changes to localStorage
  const handleModeChange = (mode: AIMode) => {
    setAiMode(mode)
    localStorage.setItem('ai-chat-mode', mode)
  }

  // Check if message contains a suggestion (improved detection)
  const hasSuggestion = (message: { role: string; content: string; id: string; timestamp?: number }) => {
    if (message.role !== 'assistant') return false
    
    // Skip welcome messages and error messages
    if (message.id === 'welcome') return false
    if (message.content.toLowerCase().includes('error') || 
        message.content.toLowerCase().includes('sorry') ||
        message.content.toLowerCase().includes('i encountered')) return false
    
    // Too short to be a suggestion
    if (message.content.length < 30) return false
    
    // Check if content looks like it could be note content
    const hasMarkdown = /[#*_`[\]]/.test(message.content)
    const hasMultipleLines = message.content.split('\n').length > 1
    const isSubstantial = message.content.length > 100
    
    // Consider it a suggestion if it's substantial and looks like content
    // Prefer content with markdown or multiple lines, but also accept substantial single-line content
    return (hasMarkdown || hasMultipleLines || isSubstantial)
  }

  // Load conversation history
  useEffect(() => {
    if (conversation?.messages) {
      const loadedMessages: Array<Message> = conversation.messages.map((msg: any, index: number) => {
        const isSuggestion = hasSuggestion({
          role: msg.role,
          content: msg.content,
          id: `${msg.timestamp}-${index}`,
          timestamp: msg.timestamp,
        })
        
        // In Edit Mode, show brief message for suggestions
        // In Chat Mode, show full content
        const displayContent = aiMode === 'edit' && isSuggestion && msg.role === 'assistant'
          ? "I've prepared an improved version of your note. Check the editor to review the changes."
          : msg.content

        return {
          id: `${msg.timestamp}-${index}`,
          role: msg.role,
          content: displayContent,
          timestamp: msg.timestamp,
          suggestionId: msg.suggestionId,
          isSuggestion: isSuggestion && msg.role === 'assistant',
          fullSuggestionContent: isSuggestion && msg.role === 'assistant' ? msg.content : undefined,
        }
      })
      setMessages(loadedMessages)
    } else if (conversation === null && currentUserId) {
      // No conversation exists, show welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I can help you write and improve your documentation. Ask me anything about your note, or request help with writing, editing, or formatting.',
        timestamp: Date.now(),
      }])
    }
  }, [conversation, currentUserId, aiMode])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !currentUserId) return

    const userMessageContent = inputValue.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      // Save user message to conversation
      await addMessageMutation({
        noteId,
        userId: currentUserId,
        role: 'user',
        content: userMessageContent,
      })

      // Prepare messages for AI (excluding system messages from display)
      const conversationMessages = messages
        .filter((msg) => msg.role !== 'assistant' || msg.id !== 'welcome')
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
        .concat([{ role: 'user' as const, content: userMessageContent }])

      // Call AI action
      const response = await chatAction({
        userId: currentUserId,
        messages: conversationMessages,
        noteTitle,
        noteContent,
      })

      const isSuggestion = hasSuggestion({ 
        role: 'assistant', 
        content: response.content,
        id: '',
        timestamp: Date.now()
      })

      // In Edit Mode: Show brief message for suggestions, full content for chat
      // In Chat Mode: Always show full content
      const displayContent = aiMode === 'edit' && isSuggestion
        ? "I've prepared an improved version of your note. Check the editor to review the changes."
        : response.content

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: displayContent,
        timestamp: Date.now(),
        isSuggestion,
        fullSuggestionContent: isSuggestion ? response.content : undefined,
      }

      setMessages((prev) => [...prev, aiMessage])

      // Save AI response to conversation (save full content)
      await addMessageMutation({
        noteId,
        userId: currentUserId,
        role: 'assistant',
        content: response.content, // Always save full content
      })

      // Auto-show suggestion in editor if in edit mode and it's a substantial response
      if (aiMode === 'edit' && isSuggestion && onApplySuggestion) {
        // Small delay to ensure message is rendered first
        setTimeout(() => {
          onApplySuggestion(response.content)
        }, 100)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response. Please try again.'
      setError(errorMessage)
      
      // Show error message in chat
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearConversation = async () => {
    if (!currentUserId || isLoading) return
    
    if (confirm('Are you sure you want to clear the conversation history?')) {
      await clearConversationMutation({
        noteId,
        userId: currentUserId,
      })
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I can help you write and improve your documentation. Ask me anything about your note, or request help with writing, editing, or formatting.',
        timestamp: Date.now(),
      }])
    }
  }

  const handleApplySuggestion = (suggestion: string) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (currentUserId === null) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <Bot size={48} className="text-primary mx-auto mb-4 opacity-50" />
        <h3 className="font-bold text-lg mb-2">AI Assistant</h3>
        <p className="text-sm text-base-content/60 mb-4 text-center">
          Sign in to use the AI assistant
        </p>
        <button
          onClick={() => signIn('github')}
          className="btn btn-primary btn-sm gap-2"
        >
          <LogIn size={16} />
          Sign In
        </button>
      </div>
    )
  }

  // Check AI access (show loading state while checking)
  if (hasAIAccess === undefined) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    )
  }

  // Show premium/upgrade message if user doesn't have access
  if (hasAIAccess === false) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Bot size={48} className="text-primary mx-auto mb-4 opacity-50" />
          <h3 className="font-bold text-lg mb-2">AI Assistant</h3>
          <p className="text-sm text-base-content/70 mb-4">
            AI features are available for authorized users only. Please contact an administrator to enable AI access for your account.
          </p>
          <div className="alert alert-info">
            <span className="text-xs">
              This feature requires premium/authorized access to prevent unauthorized API usage.
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-base-300 bg-base-200/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-primary" />
            <h3 className="font-bold">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                onClick={handleClearConversation}
                className="btn btn-ghost btn-xs"
                title="Clear conversation"
              >
                <Trash2 size={14} />
              </button>
            )}
            {/* Mode toggle */}
            <div className="btn-group btn-group-xs">
              <button
                onClick={() => handleModeChange('chat')}
                className={`btn ${aiMode === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
                title="Chat mode - conversation only, click 'Show in Editor' to preview suggestions"
              >
                <MessageSquare size={14} />
                <span className="hidden sm:inline ml-1">Chat</span>
              </button>
              <button
                onClick={() => handleModeChange('edit')}
                className={`btn ${aiMode === 'edit' ? 'btn-primary' : 'btn-ghost'}`}
                title="Edit mode - suggestions appear in editor automatically"
              >
                <Edit size={14} />
                <span className="hidden sm:inline ml-1">Edit</span>
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-base-content/60">
          {aiMode === 'edit' 
            ? 'Suggestions will appear in the editor automatically'
            : 'Chat mode - click "Show in Editor" to preview suggestions'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            aiMode={aiMode}
            onApplySuggestion={onApplySuggestion ? (content) => handleApplySuggestion(content) : undefined}
          />
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="bg-base-200 rounded-lg p-3">
              <span className="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}
        {error && (
          <div className="alert alert-error alert-sm">
            <span>{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
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
            disabled={isLoading || !currentUserId}
          />
          <button
            onClick={handleSend}
            className="btn btn-primary join-item"
            disabled={!inputValue.trim() || isLoading || !currentUserId}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-base-content/50 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

// Component for rendering individual messages with suggestion handling
function MessageBubble({
  message,
  aiMode,
  onApplySuggestion,
}: {
  message: Message
  aiMode: AIMode
  onApplySuggestion?: (content: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isSuggestion = message.isSuggestion && message.fullSuggestionContent
  const fullContent = message.fullSuggestionContent || message.content

  // In Edit Mode, suggestions show brief message
  // In Chat Mode, suggestions show compact preview
  const shouldShowPreview = aiMode === 'chat' && isSuggestion

  return (
    <div>
      <div
        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        {message.role === 'assistant' && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
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
          {message.role === 'assistant' ? (
            <div className="text-sm">
              {shouldShowPreview ? (
                <SuggestionPreview
                  content={fullContent}
                  isExpanded={isExpanded}
                  onToggleExpand={() => setIsExpanded(!isExpanded)}
                  onApply={() => {
                    if (onApplySuggestion && fullContent) {
                      onApplySuggestion(fullContent)
                    }
                  }}
                />
              ) : (
                <MarkdownViewer content={message.content} />
              )}
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.content}</p>
          )}
          <span className="text-xs opacity-60 mt-1 block">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {message.role === 'user' && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
            <User size={16} />
          </div>
        )}
      </div>
    </div>
  )
}

// Compact preview component for suggestions in Chat Mode
function SuggestionPreview({
  content,
  isExpanded,
  onToggleExpand,
  onApply,
}: {
  content: string
  isExpanded: boolean
  onToggleExpand: () => void
  onApply: () => void
}) {
  const lines = content.split('\n')
  const previewLines = 3
  const hasMore = lines.length > previewLines
  const displayLines = isExpanded ? lines : lines.slice(0, previewLines)

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-primary mb-2">Suggestion Preview</div>
      <div className="bg-base-100 border border-base-300 rounded p-2 font-mono text-xs max-h-48 overflow-y-auto">
        {displayLines.map((line, idx) => (
          <div key={idx} className="text-base-content/80">
            {line || '\u00A0'}
          </div>
        ))}
        {hasMore && !isExpanded && (
          <div className="text-base-content/50 italic mt-1">... {lines.length - previewLines} more lines</div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={onApply}
          className="btn btn-primary btn-xs flex items-center gap-1"
        >
          <Check size={12} />
          Apply in Editor
        </button>
        {hasMore && (
          <button
            onClick={onToggleExpand}
            className="btn btn-ghost btn-xs flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={12} />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                Expand
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

