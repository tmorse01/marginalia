interface EditorTextProps {
  content: string
}

export default function EditorText({ content }: EditorTextProps) {
  return <span>{content}</span>
}
