import React from 'react'

interface EditorParagraphProps {
  content: React.ReactNode
}

export default function EditorParagraph({ content }: EditorParagraphProps) {
  return <div className="editor-paragraph">{content}</div>
}
