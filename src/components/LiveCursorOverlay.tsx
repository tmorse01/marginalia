import type { Id } from 'convex/_generated/dataModel'

interface PresenceEntry {
  userId: Id<'users'>
  user?: {
    name?: string
  } | null
  mode: 'editing' | 'viewing'
  cursorStart?: number
  cursorEnd?: number
}

interface LiveCursorOverlayProps {
  content: string
  entries: Array<PresenceEntry>
  currentUserId?: Id<'users'> | null
}

const CURSOR_COLORS = [
  '#60a5fa',
  '#f97316',
  '#34d399',
  '#f472b6',
  '#facc15',
  '#a78bfa',
  '#22d3ee',
]

function getCursorColor(userId: Id<'users'>) {
  const id = userId.toString()
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1_000_000
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length]
}

function getLineInfo(content: string, cursorStart?: number) {
  if (cursorStart === undefined) {
    return null
  }

  const clamped = Math.max(0, Math.min(content.length, cursorStart))
  const before = content.slice(0, clamped)
  const line = before.split('\n').length
  const lineStart = before.lastIndexOf('\n') + 1
  const lineText = content.slice(lineStart, lineStart + 120).trim()

  return {
    line,
    snippet: lineText.length > 0 ? lineText : '…',
  }
}

export default function LiveCursorOverlay({
  content,
  entries,
  currentUserId,
}: LiveCursorOverlayProps) {
  const activeEditors = entries.filter(
    (entry) =>
      entry.userId !== currentUserId &&
      entry.mode === 'editing' &&
      entry.cursorStart !== undefined
  )

  if (activeEditors.length === 0) {
    return null
  }

  return (
    <div className="card bg-base-100/95 border border-base-300 shadow-lg absolute right-4 top-4 z-10 backdrop-blur">
      <div className="card-body p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/70 mb-2">
          Live cursors
        </h4>
        <div className="flex flex-col gap-2">
          {activeEditors.map((entry) => {
            const info = getLineInfo(content, entry.cursorStart)
            if (!info) return null
            const color = getCursorColor(entry.userId)
            return (
              <div key={entry.userId} className="flex items-start gap-2">
                <span
                  className="mt-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-base-content">
                    {entry.user?.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-base-content/60">
                    Line {info.line} · {info.snippet}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

