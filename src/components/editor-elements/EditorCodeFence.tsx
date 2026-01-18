interface EditorCodeFenceProps {
  raw: string
  language?: string
}

export default function EditorCodeFence({ raw }: EditorCodeFenceProps) {
  // Code fences always show raw markdown
  return <span className="editor-line-code-fence">{raw}</span>
}
