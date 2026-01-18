interface EditorStrikethroughProps {
  content: string
  raw: string
  showSyntax: boolean
}

export default function EditorStrikethrough({ content, showSyntax }: EditorStrikethroughProps) {
  const strikethroughMarkers = showSyntax ? ['~~', '~~'] : null

  return (
    <del className="editor-strikethrough">
      {strikethroughMarkers && <span className="editor-syntax-marker">{strikethroughMarkers[0]}</span>}
      {content}
      {strikethroughMarkers && <span className="editor-syntax-marker">{strikethroughMarkers[1]}</span>}
    </del>
  )
}
