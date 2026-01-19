import { X, Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import MarkdownViewer from './MarkdownViewer'

interface MarkdownCheatSheetModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CheatSheetItem {
  title: string
  syntax: string
  example: string
  description?: string
}

export default function MarkdownCheatSheetModal({
  isOpen,
  onClose,
}: MarkdownCheatSheetModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sections: Array<{ title: string; items: Array<CheatSheetItem> }> = [
    {
      title: 'Headers',
      items: [
        {
          title: 'H1',
          syntax: '# Heading 1',
          example: '# Heading 1',
        },
        {
          title: 'H2',
          syntax: '## Heading 2',
          example: '## Heading 2',
        },
        {
          title: 'H3',
          syntax: '### Heading 3',
          example: '### Heading 3',
        },
        {
          title: 'H4',
          syntax: '#### Heading 4',
          example: '#### Heading 4',
        },
        {
          title: 'H5',
          syntax: '##### Heading 5',
          example: '##### Heading 5',
        },
        {
          title: 'H6',
          syntax: '###### Heading 6',
          example: '###### Heading 6',
        },
      ],
    },
    {
      title: 'Text Formatting',
      items: [
        {
          title: 'Bold',
          syntax: '**bold text**',
          example: '**bold text**',
          description: 'or __bold text__',
        },
        {
          title: 'Italic',
          syntax: '*italic text*',
          example: '*italic text*',
          description: 'or _italic text_',
        },
        {
          title: 'Strikethrough',
          syntax: '~~strikethrough text~~',
          example: '~~strikethrough text~~',
        },
      ],
    },
    {
      title: 'Code',
      items: [
        {
          title: 'Inline Code',
          syntax: '`code`',
          example: 'Use `code` for inline snippets',
        },
        {
          title: 'Code Block',
          syntax: '```language\ncode block\n```',
          example: '```javascript\nfunction example() {\n  return true\n}\n```',
          description: 'Add language after opening ``` for syntax highlighting',
        },
      ],
    },
    {
      title: 'Links',
      items: [
        {
          title: 'Link',
          syntax: '[text](url)',
          example: '[Visit Example](https://example.com)',
        },
      ],
    },
    {
      title: 'Lists',
      items: [
        {
          title: 'Unordered List',
          syntax: '- item',
          example: '- First item\n- Second item\n- Third item',
          description: 'or use * or +',
        },
        {
          title: 'Ordered List',
          syntax: '1. item',
          example: '1. First item\n2. Second item\n3. Third item',
        },
      ],
    },
    {
      title: 'Blockquotes',
      items: [
        {
          title: 'Blockquote',
          syntax: '> quote text',
          example: '> This is a blockquote\n> It can span multiple lines',
        },
      ],
    },
    {
      title: 'Horizontal Rules',
      items: [
        {
          title: 'Horizontal Rule',
          syntax: '---',
          example: '---',
          description: 'or use *** or ___',
        },
      ],
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="modal modal-open">
        <div className="modal-box max-w-4xl max-h-[90vh] p-0 flex flex-col">
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-6 pb-4 border-b border-base-300 shrink-0">
            <h3 className="text-2xl font-bold">Markdown Cheat Sheet</h3>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost"
              aria-label="Close"
            >
              <X className="size-[1.2em]" strokeWidth={2.5} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border-b border-base-300 pb-6 last:border-b-0">
                  <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
                  <div className="space-y-4">
                    {section.items.map((item, itemIndex) => {
                      const globalIndex = sectionIndex * 100 + itemIndex
                      const isCopied = copiedIndex === globalIndex

                      return (
                        <div
                          key={itemIndex}
                          className="card bg-base-200 border border-base-300"
                        >
                          <div className="card-body p-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-medium text-sm">{item.title}</h5>
                                  {item.description && (
                                    <span className="text-xs text-base-content/60">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                                <div className="bg-base-300 rounded p-2 mb-3">
                                  <code className="text-sm font-mono wrap-break-word whitespace-pre-wrap">
                                    {item.syntax}
                                  </code>
                                </div>
                                <div className="border-l-4 border-primary pl-3">
                                  <MarkdownViewer content={item.example} />
                                </div>
                              </div>
                              <button
                                onClick={() => handleCopy(item.syntax, globalIndex)}
                                className="btn btn-sm btn-ghost btn-square shrink-0"
                                aria-label={`Copy ${item.title} syntax`}
                              >
                                {isCopied ? (
                                  <Check size={16} className="text-success" />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="modal-action p-6 pt-4 border-t border-base-300 shrink-0">
            <button onClick={onClose} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
