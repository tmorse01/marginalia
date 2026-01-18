import React from 'react'

interface EditorListProps {
  type: 'unordered' | 'ordered'
  marker?: string
  number?: number
  content: React.ReactNode
  showSyntax: boolean
}

export default function EditorList({
  type,
  marker,
  number,
  content,
  showSyntax,
}: EditorListProps) {
  const listPrefix = showSyntax
    ? type === 'unordered'
      ? `${marker} `
      : `${number}. `
    : null

  const listMarker = type === 'unordered' ? marker : `${number}.`

  return (
    <div className={`editor-list-item editor-list-${type}`}>
      <span className="editor-list-marker">
        {listPrefix ? <span className="editor-syntax-marker">{listPrefix}</span> : listMarker}
      </span>
      <span className="editor-list-content">{content}</span>
    </div>
  )
}
