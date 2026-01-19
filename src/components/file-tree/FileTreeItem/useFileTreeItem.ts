import { useState, useRef, useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Id } from 'convex/_generated/dataModel'

interface UseFileTreeItemProps {
  id: string
  type: 'note' | 'folder'
  name: string
  noteId?: Id<'notes'>
  folderId?: Id<'folders'>
  isOver?: boolean
}

export function useFileTreeItem({
  id,
  type,
  name,
  noteId,
  folderId,
  isOver = false,
}: UseFileTreeItemProps) {
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

  // Determine active state - ensure only one item is active at a time
  // Use exact pathname matching (normalized) to prevent multiple items from being active
  // Extract just the pathname part (ignore query params and hash)
  const pathname = router.location.pathname.split('?')[0].split('#')[0].replace(/\/$/, '')
  const isActive = 
    (type === 'note' && noteId && pathname === `/notes/${noteId}`) ||
    (type === 'folder' && folderId && pathname === `/folders/${folderId}`)

  const isHighlighted = (isDroppableOver || isOver) && type === 'folder'

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
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

  return {
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
  }
}
