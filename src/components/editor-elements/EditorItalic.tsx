import { extractItalicMarkers } from '../../lib/editor-utils'

interface EditorItalicProps {
  content: string
  raw: string
  showSyntax: boolean
}

export default function EditorItalic({ content, raw, showSyntax }: EditorItalicProps) {
  const italicMarkers = showSyntax ? extractItalicMarkers(raw) : null

  return (
    <em className="editor-italic">
      {italicMarkers && <span className="editor-syntax-marker">{italicMarkers[0]}</span>}
      {content}
      {italicMarkers && <span className="editor-syntax-marker">{italicMarkers[1]}</span>}
    </em>
  )
}
