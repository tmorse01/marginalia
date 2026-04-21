import {
  useMemo,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import ReactMarkdown from 'react-markdown'
import type { ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ShikiHighlighter, {
  createJavaScriptRegexEngine,
  rehypeInlineCodeProperty,
} from 'react-shiki/web'
import { useSyntaxHighlightTheme } from '../hooks/useSyntaxHighlightTheme'

const LANGUAGE_FROM_CLASS = /language-([\w-]+)/

const SHIKI_ENGINE = createJavaScriptRegexEngine()

const LANG_ALIAS: Record<string, string> = {
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
}

interface MarkdownViewerProps {
  content: string
  className?: string
  /** Throttle re-highlight while markdown streams (e.g. assistant chat) */
  highlightDelay?: number
}

type MarkdownCodeProps = ComponentPropsWithoutRef<'code'> &
  ExtraProps & {
    /** Set by `rehypeInlineCodeProperty` for react-markdown v9 */
    inline?: boolean
  }

function MarkdownPre({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

function MarkdownCode({
  inline,
  className,
  children,
  node: _node,
  syntaxTheme,
  highlightDelay,
  ...rest
}: MarkdownCodeProps & {
  syntaxTheme: 'github-light' | 'github-dark'
  highlightDelay?: number
}) {
  if (inline === true) {
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    )
  }

  const raw = String(children).replace(/\n$/, '')
  const token = className?.match(LANGUAGE_FROM_CLASS)?.[1]
  const language =
    token != null && token.length > 0 ? token : 'plaintext'

  return (
    <ShikiHighlighter
      language={language}
      theme={syntaxTheme}
      engine={SHIKI_ENGINE}
      langAlias={LANG_ALIAS}
      delay={highlightDelay}
      showLanguage={false}
      addDefaultStyles={false}
      className="markdown-shiki-block w-full max-w-full overflow-x-auto rounded-lg bg-base-200 p-4 font-mono text-sm"
    >
      {raw}
    </ShikiHighlighter>
  )
}

export default function MarkdownViewer({
  content,
  className = '',
  highlightDelay,
}: MarkdownViewerProps) {
  const syntaxTheme = useSyntaxHighlightTheme()

  const components = useMemo(
    () => ({
      pre: MarkdownPre,
      code: (props: MarkdownCodeProps) => (
        <MarkdownCode
          {...props}
          syntaxTheme={syntaxTheme}
          highlightDelay={highlightDelay}
        />
      ),
    }),
    [syntaxTheme, highlightDelay],
  )

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeInlineCodeProperty]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
