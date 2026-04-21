import { useMemo, useState, type ReactNode } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'
import ShikiHighlighter, {
  createJavaScriptRegexEngine,
} from 'react-shiki/web'
import { useSyntaxHighlightTheme } from '../hooks/useSyntaxHighlightTheme'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CommentData {
  _id: Id<'comments'>
  noteId: Id<'notes'>
  authorId: Id<'users'>
  body: string
  lineNumber?: number
  lineContent?: string
  resolved: boolean
  createdAt: number
  author: { name: string; email: string } | null
}

interface CommentWithReplies extends CommentData {
  replies: Array<CommentData>
}

interface CommentableContentProps {
  content: string
  noteId: Id<'notes'>
  commentsByLine: Partial<Record<number, Array<CommentWithReplies>>>
  currentUserId?: Id<'users'> | null
  noteOwnerId?: Id<'users'>
  selectedLine?: number | null
  onLineSelect?: (lineNumber: number | null) => void
  onOpenComments?: () => void
  className?: string
}

/**
 * Renders markdown content with hover-to-comment and inline indicators
 * Clicking indicators opens the right sidebar with comments for that line
 */
export default function CommentableContent({
  content,
  noteId: _noteId,
  commentsByLine,
  currentUserId: _currentUserId,
  noteOwnerId: _noteOwnerId,
  selectedLine = null,
  onLineSelect,
  onOpenComments,
  className = '',
}: CommentableContentProps) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const syntaxTheme = useSyntaxHighlightTheme()

  const handleIndicatorClick = (lineNumber: number) => {
    // Open comments sidebar if it's closed
    if (onOpenComments) {
      onOpenComments()
    }
    
    if (onLineSelect) {
      // Toggle: if clicking the same line, deselect it
      onLineSelect(selectedLine === lineNumber ? null : lineNumber)
    }
  }

  const engine = useMemo(() => createJavaScriptRegexEngine(), [])

  const lines = useMemo(() => content.split('\n'), [content])

  const langAlias: Record<string, string> = useMemo(
    () => ({
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      py: 'python',
      rb: 'ruby',
      rs: 'rust',
      sh: 'bash',
      shell: 'bash',
      yml: 'yaml',
      md: 'markdown',
    }),
    [],
  )

  const renderIndicator = (lineIndex: number) => {
    const threads = commentsByLine[lineIndex] || []
    const unresolvedCount = threads.filter((t) => !t.resolved).length
    const hasComments = threads.length > 0
    const hasUnresolvedComments = unresolvedCount > 0
    const hasOnlyResolvedComments = hasComments && unresolvedCount === 0
    const isHovered = hoveredLine === lineIndex
    const isSelected = selectedLine === lineIndex

    return (
      <button
        onClick={() => handleIndicatorClick(lineIndex)}
        className={`comment-indicator ${
          isHovered || hasComments ? 'visible' : ''
        } ${hasUnresolvedComments ? 'has-comments' : ''} ${
          hasOnlyResolvedComments ? 'has-resolved-comments' : ''
        } ${isSelected ? 'is-open' : ''}`}
        title={
          hasComments
            ? `${threads.length} comment${threads.length > 1 ? 's' : ''} (${unresolvedCount} unresolved)`
            : 'Add comment'
        }
        type="button"
      >
        {hasComments ? (
          <span className="comment-count">
            {unresolvedCount || <MessageSquare size={12} />}
          </span>
        ) : (
          <Plus size={14} />
        )}
      </button>
    )
  }

  const renderedLines = useMemo(() => {
    const nodes: Array<ReactNode> = []

    let inFence = false
    let fenceLanguage = 'plaintext'
    let fenceStartIndex = -1
    let fenceCodeLines: Array<string> = []

    const flushUnclosedFenceAsPlain = () => {
      if (!inFence || fenceStartIndex < 0) return
      for (let i = fenceStartIndex; i < lines.length; i++) {
        nodes.push(
          <div
            key={`plain-${i}`}
            className="commentable-line"
            onMouseEnter={() => setHoveredLine(i)}
            onMouseLeave={() => setHoveredLine(null)}
          >
            <div className="commentable-line-content">
              <LineContent line={lines[i]} />
            </div>
            {renderIndicator(i)}
          </div>,
        )
      }
      inFence = false
      fenceStartIndex = -1
      fenceCodeLines = []
      fenceLanguage = 'plaintext'
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const fenceMatch = line.match(/^```(\S+)?\s*$/)

      if (fenceMatch) {
        if (!inFence) {
          inFence = true
          fenceLanguage = fenceMatch[1] || 'plaintext'
          fenceStartIndex = i
          fenceCodeLines = []
          continue
        }

        const fenceEndIndex = i
        const blockCode = fenceCodeLines.join('\n')
        const codeLineCount = fenceCodeLines.length

        nodes.push(
          <div key={`fence-${fenceStartIndex}`} className="commentable-codeblock">
            <ShikiHighlighter
              language={fenceLanguage}
              theme={syntaxTheme}
              engine={engine}
              langAlias={langAlias}
              showLanguage={false}
              addDefaultStyles={false}
              className="markdown-shiki-block w-full max-w-full overflow-x-auto rounded-lg bg-base-200 p-4 font-mono text-sm leading-5"
            >
              {blockCode}
            </ShikiHighlighter>

            <div className="commentable-codeblock-gutter">
              {/* opener fence line */}
              <div
                className="commentable-line commentable-codeblock-line"
                onMouseEnter={() => setHoveredLine(fenceStartIndex)}
                onMouseLeave={() => setHoveredLine(null)}
              >
                <div className="commentable-line-content">&nbsp;</div>
                {renderIndicator(fenceStartIndex)}
              </div>

              {/* code lines */}
              {codeLineCount === 0 ? (
                <div
                  className="commentable-line commentable-codeblock-line"
                  onMouseEnter={() => setHoveredLine(fenceStartIndex + 1)}
                  onMouseLeave={() => setHoveredLine(null)}
                >
                  <div className="commentable-line-content">&nbsp;</div>
                  {renderIndicator(fenceStartIndex + 1)}
                </div>
              ) : (
                fenceCodeLines.map((_, innerIdx) => {
                  const lineIndex = fenceStartIndex + 1 + innerIdx
                  return (
                    <div
                      key={lineIndex}
                      className="commentable-line commentable-codeblock-line"
                      onMouseEnter={() => setHoveredLine(lineIndex)}
                      onMouseLeave={() => setHoveredLine(null)}
                    >
                      <div className="commentable-line-content">&nbsp;</div>
                      {renderIndicator(lineIndex)}
                    </div>
                  )
                })
              )}

              {/* closer fence line */}
              <div
                className="commentable-line commentable-codeblock-line"
                onMouseEnter={() => setHoveredLine(fenceEndIndex)}
                onMouseLeave={() => setHoveredLine(null)}
              >
                <div className="commentable-line-content">&nbsp;</div>
                {renderIndicator(fenceEndIndex)}
              </div>
            </div>
          </div>,
        )

        // close fence
        inFence = false
        fenceStartIndex = -1
        fenceCodeLines = []
        fenceLanguage = 'plaintext'
        continue
      }

      if (inFence) {
        fenceCodeLines.push(line)
        continue
      }

      const threads = commentsByLine[i] || []
      const unresolvedCount = threads.filter((t) => !t.resolved).length
      const hasUnresolvedComments = unresolvedCount > 0
      const hasOnlyResolvedComments = threads.length > 0 && unresolvedCount === 0
      const isSelected = selectedLine === i

      nodes.push(
        <div
          key={i}
          className={`commentable-line ${hasUnresolvedComments ? 'has-comments' : ''} ${
            hasOnlyResolvedComments ? 'has-resolved-comments' : ''
          } ${isSelected ? 'is-active' : ''}`}
          onMouseEnter={() => setHoveredLine(i)}
          onMouseLeave={() => setHoveredLine(null)}
        >
          <div className="commentable-line-content">
            <LineContent line={line} />
          </div>
          {renderIndicator(i)}
        </div>,
      )
    }

    // if fence never closed, fall back to plain line rendering
    if (inFence) {
      nodes.length = 0
      flushUnclosedFenceAsPlain()
    }

    return nodes
  }, [
    commentsByLine,
    engine,
    hoveredLine,
    langAlias,
    lines,
    selectedLine,
    syntaxTheme,
  ])

  return (
    <div className={`commentable-content ${className}`}>
      {renderedLines}
    </div>
  )
}

function LineContent({ line }: { line: string }) {
  if (!line.trim()) {
    return <div className="h-6">&nbsp;</div>
  }

  return (
    <div className="prose prose-sm max-w-none inline-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
        }}
      >
        {line}
      </ReactMarkdown>
    </div>
  )
}
