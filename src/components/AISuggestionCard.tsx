import { useState } from 'react'
import { Check, X, GitCompare, FileText } from 'lucide-react'
import AIDiffView from './AIDiffView'

interface AISuggestionCardProps {
  suggestion: string
  originalContent: string
  onApply: () => void
  onDismiss: () => void
}

export default function AISuggestionCard({
  suggestion,
  originalContent,
  onApply,
  onDismiss,
}: AISuggestionCardProps) {
  const [showDiff, setShowDiff] = useState(true)

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 my-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-primary">AI Suggestion</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="btn btn-ghost btn-xs"
            title={showDiff ? 'Show full suggestion' : 'Show diff view'}
          >
            {showDiff ? (
              <>
                <FileText size={12} />
                <span className="hidden sm:inline ml-1">Full</span>
              </>
            ) : (
              <>
                <GitCompare size={12} />
                <span className="hidden sm:inline ml-1">Diff</span>
              </>
            )}
          </button>
          <button
            onClick={onDismiss}
            className="btn btn-ghost btn-xs btn-circle"
            aria-label="Dismiss suggestion"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        {showDiff ? (
          <AIDiffView original={originalContent} suggested={suggestion} />
        ) : (
          <div className="bg-base-100 rounded p-3 text-sm whitespace-pre-wrap wrap-break-word border border-base-300">
            {suggestion}
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="btn btn-primary btn-sm flex-1"
        >
          <Check size={16} />
          Apply
        </button>
        <button
          onClick={onDismiss}
          className="btn btn-ghost btn-sm"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
