interface EditorLinkProps {
  text: string
  url: string
  raw: string
  showSyntax: boolean
}

export default function EditorLink({ text, url, showSyntax }: EditorLinkProps) {
  if (showSyntax) {
    return (
      <span className="editor-link">
        <span className="editor-syntax-marker">[</span>
        <span className="editor-link-text">{text}</span>
        <span className="editor-syntax-marker">](</span>
        <span className="editor-syntax-marker">{url}</span>
        <span className="editor-syntax-marker">)</span>
      </span>
    )
  }

  return (
    <a
      href={url}
      className="editor-link"
      onClick={(e) => {
        // Prevent navigation when in editor mode
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {text}
    </a>
  )
}
