import { extractBoldMarkers } from '../../lib/editor-utils'

interface EditorBoldProps {
  content: string
  raw: string
  showSyntax: boolean
}

export default function EditorBold({ content, raw, showSyntax }: EditorBoldProps) {
  const boldMarkers = showSyntax ? extractBoldMarkers(raw) : null

  if (showSyntax && !boldMarkers) {
    console.warn(`[EditorBold] showSyntax=true but no markers found for raw:`, raw)
  }

  return (
    <strong className="editor-bold">
      {boldMarkers && <span className="editor-syntax-marker">{boldMarkers[0]}</span>}
      {content}
      {boldMarkers && <span className="editor-syntax-marker">{boldMarkers[1]}</span>}
    </strong>
  )
}
