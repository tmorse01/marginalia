import { extractCodeMarkers } from '../../lib/editor-utils'

interface EditorCodeProps {
  content: string
  raw: string
  showSyntax: boolean
}

export default function EditorCode({ content, raw, showSyntax }: EditorCodeProps) {
  const codeMarkers = showSyntax ? extractCodeMarkers(raw) : null

  return (
    <code className="editor-inline-code">
      {codeMarkers && <span className="editor-syntax-marker">{codeMarkers[0]}</span>}
      {content}
      {codeMarkers && <span className="editor-syntax-marker">{codeMarkers[1]}</span>}
    </code>
  )
}
