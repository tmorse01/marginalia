import { useState, useRef, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
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
  const router = useRouterState()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(name)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const updateNote = useMutation(api.notes.update)
  const updateFolder = useMutation(api.folders.update)
  // Disable dragging for folders by default - they can be moved via context menu
  // Files remain draggable for easy reorganization
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: type === 'folder', // Disable drag for folders
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isRenaming) {
      setIsRenaming(true)
      setRenameValue(name)
    }
  }

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || renameValue.trim() === name) {
      setIsRenaming(false)
      setRenameValue(name)
      return
    }

    try {
      if (type === 'folder' && folderId) {
        await updateFolder({
          folderId,
          name: renameValue.trim(),
        })
      } else if (type === 'note' && noteId) {
        await updateNote({
          noteId,
          title: renameValue.trim(),
        })
      }
      setIsRenaming(false)
    } catch (error) {
      console.error('Failed to rename:', error)
      setIsRenaming(false)
      setRenameValue(name)
    }
  }

  const handleRenameCancel = () => {
    setIsRenaming(false)
    setRenameValue(name)
  }

  // Update rename value when name prop changes
  useEffect(() => {
    if (!isRenaming) {
      setRenameValue(name)
    }
  }, [name, isRenaming])

  // Custom drag handlers that prevent drag when clicking on interactive elements
  // For folders, completely disable drag - they should be moved via context menu
  // For files, allow dragging from anywhere on the item
  const handlePointerDown = (e: React.PointerEvent) => {
    // Folders are not draggable - disable drag entirely
    if (type === 'folder') {
      return
    }

    const target = e.target as HTMLElement
    // Only prevent drag if clicking directly on a button or input
    // Allow dragging from links and anywhere else on the file item
    if (
      target.tagName === 'BUTTON' ||
      target.closest('input')
    ) {
      return
    }
    // Use the original listeners for files - allow dragging from anywhere
    // This includes the link text, icons, and any other part of the item
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e)
    }
  }

  // Merge listeners but override onPointerDown
  // For files, apply drag listeners to allow dragging from anywhere
  // For folders, no drag listeners
  const customListeners = type === 'folder' 
    ? {} // No drag listeners for folders
    : {
        ...listeners,
        onPointerDown: handlePointerDown,
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
        style={{ paddingLeft, ...style }}
        {...attributes}
        {...customListeners}
        className={`group flex items-center gap-1 px-2 py-1 rounded hover:bg-base-300 ${
          type === 'folder' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
        } ${
          isActive ? 'bg-primary/20' : ''
        } ${isSelected ? 'ring-2 ring-primary/50 bg-primary/10' : ''} ${
          isDragging ? 'z-50 opacity-50' : ''
        } ${
          (isDroppableOver || isOver) && type === 'folder' ? 'bg-primary/10 ring-2 ring-primary' : ''
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

