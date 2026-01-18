import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import FileTreeContextMenu from './FileTreeContextMenu'
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
}: FileTreeItemProps) {
  const router = useRouterState()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: false,
  })

  const { setNodeRef: setDroppableRef, isOver: isDroppableOver } = useDroppable({
    id,
    disabled: type !== 'folder',
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Combine refs for sortable and droppable
  const combinedRef = (node: HTMLElement | null) => {
    setNodeRef(node)
    if (type === 'folder') {
      setDroppableRef(node)
    }
  }

  const isActive = type === 'note' && noteId && router.location.pathname.includes(noteId)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleExpand?.()
  }

  // Custom drag handlers that prevent drag when clicking on interactive elements
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    // Don't start drag if clicking on a link, button, or their children
    if (
      target.closest('a') ||
      target.closest('button') ||
      target.tagName === 'A' ||
      target.tagName === 'BUTTON'
    ) {
      return
    }
    // Use the original listeners
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e)
    }
  }

  // Merge listeners but override onPointerDown
  const customListeners = {
    ...listeners,
    onPointerDown: handlePointerDown,
  }

  const paddingLeft = `${depth * 1.25}rem`

  return (
    <>
      <div
        ref={combinedRef}
        style={{ paddingLeft, ...style }}
        {...attributes}
        {...customListeners}
        className={`group flex items-center gap-1 px-2 py-1 rounded hover:bg-base-300 cursor-grab active:cursor-grabbing ${
          isActive ? 'bg-primary/20' : ''
        } ${isDragging ? 'z-50 opacity-50' : ''} ${
          (isDroppableOver || isOver) && type === 'folder' ? 'bg-primary/10 ring-2 ring-primary' : ''
        }`}
        onContextMenu={handleContextMenu}
      >
        {type === 'folder' ? (
          <>
            <button
              onClick={handleExpandClick}
              className="p-0.5 hover:bg-base-200 rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-base-content/60" />
              ) : (
                <ChevronRight size={16} className="text-base-content/60" />
              )}
            </button>
            <Folder size={16} className="text-primary flex-shrink-0" />
          </>
        ) : (
          <div className="w-5" /> // Spacer for alignment
        )}

        {type === 'note' ? (
          <FileText size={16} className="text-base-content/70 flex-shrink-0" />
        ) : null}

        {type === 'note' && noteId ? (
          <Link
            to="/notes/$noteId"
            params={{ noteId }}
            className="flex-1 min-w-0 truncate text-sm"
          >
            {name}
          </Link>
        ) : (
          <span
            className="flex-1 min-w-0 truncate text-sm font-medium"
            onClick={type === 'folder' ? handleExpandClick : undefined}
          >
            {name}
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

