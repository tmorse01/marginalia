import { calculateDiff } from '../lib/diff-utils'
import type { DiffLine } from '../lib/diff-utils'

interface AIDiffViewProps {
  original: string
  suggested: string
  maxLines?: number
}

export default function AIDiffView({
  original,
  suggested,
  maxLines = 50,
}: AIDiffViewProps) {
  const diff = calculateDiff(original, suggested)
  
  if (!diff.hasChanges) {
    return (
      <div className="text-sm text-base-content/60 p-2">
        No changes detected
      </div>
    )
  }
  
  const displayLines = diff.lines.slice(0, maxLines)
  const hasMore = diff.lines.length > maxLines
  
  return (
    <div className="diff-view border border-base-300 rounded-lg overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-base-200 px-3 py-2 border-b border-base-300 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-base-content/70">
            <span className="text-error">{diff.removedCount} removed</span>
            {' • '}
            <span className="text-success">{diff.addedCount} added</span>
          </span>
        </div>
        {hasMore && (
          <span className="text-base-content/50">
            Showing first {maxLines} of {diff.lines.length} lines
          </span>
        )}
      </div>
      
      {/* Diff content */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <tbody>
            {displayLines.map((line, index) => (
              <DiffLineRow key={index} line={line} />
            ))}
          </tbody>
        </table>
      </div>
      
      {hasMore && (
        <div className="bg-base-200 px-3 py-2 border-t border-base-300 text-xs text-base-content/60 text-center">
          ... {diff.lines.length - maxLines} more lines
        </div>
      )}
    </div>
  )
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const getLineClass = () => {
    switch (line.type) {
      case 'added':
        return 'bg-success/20 border-l-2 border-success'
      case 'removed':
        return 'bg-error/20 border-l-2 border-error'
      default:
        return 'bg-base-100'
    }
  }
  
  const getPrefix = () => {
    switch (line.type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      default:
        return ' '
    }
  }
  
  const getPrefixColor = () => {
    switch (line.type) {
      case 'added':
        return 'text-success'
      case 'removed':
        return 'text-error'
      default:
        return 'text-base-content/30'
    }
  }
  
  return (
    <tr className={getLineClass()}>
      <td className={`px-2 py-1 text-right select-none ${getPrefixColor()} font-bold`}>
        {getPrefix()}
      </td>
      <td className="px-2 py-1 whitespace-pre-wrap break-words text-base-content">
        {line.content || ' '}
      </td>
    </tr>
  )
}
