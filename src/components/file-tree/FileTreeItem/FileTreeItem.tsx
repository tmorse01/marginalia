import { Link } from '@tanstack/react-router'
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react'
import FileTreeContextMenu from '../FileTreeContextMenu'
import { useFileTreeItem } from './useFileTreeItem'
import type { Id } from 'convex/_generated/dataModel'

interface FileTreeItemProps {
  id: string
  type: 'note' | 'folder'
  name: string
  noteId?: Id<'notes'>
  folderId?: Id<'folders'>
  parentFolderId?: Id<'folders'> | null
  isExpanded?: boolean
  onToggleExpand?: () => void
  children?: React.ReactNode
  depth: number
  onRename?: () => void
  onNewNote?: () => void
  onNewFolder?: () => void
  isOver?: boolean
  isSelected?: boolean
  onSelect?: () => void
  searchQuery?: string
}

export default function FileTreeItem({
  id,
  type,
  name,
  noteId,
  folderId,
  parentFolderId,
  isExpanded = false,
  onToggleExpand,
  children,
  depth,
  onRename,
  onNewNote,
  onNewFolder,
  isOver = false,
  isSelected = false,
  onSelect,
  searchQuery = '',
}: FileTreeItemProps) {
  const {
    contextMenu,
    setContextMenu,
    isRenaming,
    renameValue,
    setRenameValue,
    renameInputRef,
    combinedRef,
    style,
    isActive,
    isHighlighted,
    isDragging,
    customListeners,
    attributes,
    handleContextMenu,
    handleDoubleClick,
    handleRenameSubmit,
    handleRenameCancel,
  } = useFileTreeItem({
    id,
    type,
    name,
    noteId,
    folderId,
    isOver,
  })

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleExpand?.()
  }

  const paddingLeft = `${depth * 1.25}rem`

  // Highlight search matches
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return text

    const before = text.slice(0, index)
    const match = text.slice(index, index + query.length)
    const after = text.slice(index + query.length)

    return (
      <>
        {before}
        <mark className="bg-warning/30 text-warning-content rounded px-0.5">{match}</mark>
        {after}
      </>
    )
  }

  return (
    <>
      <div
        ref={combinedRef}
        style={{
          paddingLeft,
          ...style,
          ...(isHighlighted ? { outline: '2px solid hsl(var(--p))', outlineOffset: '2px' } : {}),
        }}
        {...attributes}
        {...customListeners}
        className={`group flex items-center gap-1 px-2 py-1 rounded mb-0.5 ${
          type === 'folder' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
        } ${
          isActive 
            ? 'bg-primary/20' 
            : 'hover:bg-base-300'
        } ${!isActive && isSelected ? 'ring-2 ring-primary/50 bg-primary/10' : ''} ${
          isDragging ? 'z-50 opacity-50' : ''
        } ${
          !isActive && isHighlighted ? 'bg-primary/10' : ''
        }`}
        onContextMenu={handleContextMenu}
        onClick={() => {
          // Only handle selection, not expand/collapse (that's handled by the button)
          onSelect?.()
        }}
        onDoubleClick={handleDoubleClick}
      >
        {type === 'folder' ? (
          <>
            <button
              onClick={handleExpandClick}
              className="p-0.5 hover:bg-base-200 rounded shrink-0"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-base-content/60" />
              ) : (
                <ChevronRight size={16} className="text-base-content/60" />
              )}
            </button>
            <Folder size={16} className="text-primary shrink-0" />
          </>
        ) : (
          <div className="w-5" /> // Spacer for alignment
        )}

        {type === 'note' ? (
          <FileText size={16} className="text-base-content/70 shrink-0" />
        ) : null}

        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit()
              } else if (e.key === 'Escape') {
                handleRenameCancel()
              }
            }}
            onBlur={handleRenameSubmit}
            className="flex-1 min-w-0 text-sm input input-sm input-bordered px-2 py-0.5 h-auto"
            onClick={(e) => e.stopPropagation()}
          />
        ) : type === 'note' && noteId ? (
          <Link
            to="/notes/$noteId"
            params={{ noteId }}
            className="flex-1 min-w-0 truncate text-sm"
            onClick={(e) => {
              // Only navigate if not dragging - drag takes priority
              if (isDragging) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            {highlightText(name, searchQuery)}
          </Link>
        ) : type === 'folder' && folderId ? (
          <Link
            {...({ to: "/folders/$folderId", params: { folderId } } as any)}
            className="flex-1 min-w-0 truncate text-sm font-medium"
            onClick={(e) => {
              // Stop propagation so clicking the folder name doesn't trigger expand/collapse
              e.stopPropagation()
            }}
          >
            {highlightText(name, searchQuery)}
          </Link>
        ) : (
          <span
            className="flex-1 min-w-0 truncate text-sm font-medium"
          >
            {highlightText(name, searchQuery)}
          </span>
        )}
      </div>

      {isExpanded && children && (
        <div className="ml-0">
          {children}
        </div>
      )}

      {contextMenu && (
        <FileTreeContextMenu
          isOpen={true}
          x={contextMenu.x}
          y={contextMenu.y}
          itemType={type}
          itemId={(type === 'note' ? noteId : folderId)!}
          itemName={name}
          folderId={parentFolderId}
          onClose={() => setContextMenu(null)}
          onRename={onRename}
          onNewNote={onNewNote}
          onNewFolder={onNewFolder}
        />
      )}
    </>
  )
}
