import React from 'react'

interface EditorBlockquoteProps {
  indent: number
  content: React.ReactNode
  showSyntax: boolean
}

export default function EditorBlockquote({
  indent,
  content,
  showSyntax,
}: EditorBlockquoteProps) {
  const blockquotePrefix = showSyntax ? '> '.repeat(indent) : null

  return (
    <div className="editor-blockquote">
      <span className="editor-blockquote-marker">
        {blockquotePrefix ? (
          <span className="editor-syntax-marker">{blockquotePrefix}</span>
        ) : (
          '>'.repeat(indent)
        )}
      </span>
      <span className="editor-blockquote-content">{content}</span>
    </div>
  )
}
