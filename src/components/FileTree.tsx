import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Folder, FileText } from 'lucide-react'
import { useCurrentUser } from '../lib/auth'
import FileTreeItem from './FileTreeItem'
import AlertToast from './AlertToast'
import type {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent} from '@dnd-kit/core';
import type { Id } from 'convex/_generated/dataModel'

interface TreeNode {
  id: string
  type: 'note' | 'folder'
  name: string
  noteId?: Id<'notes'>
  folderId?: Id<'folders'>
  parentId?: Id<'folders'> | null
  order: number
  children?: Array<TreeNode>
}

export default function FileTree() {
  const userId = useCurrentUser()
  const folders = useQuery(api.folders.list, userId ? { userId } : 'skip')
  const notes = useQuery(api.notes.listUserNotes, userId ? { userId } : 'skip')
  const moveNote = useMutation(api.notes.moveToFolder)
  const moveFolder = useMutation(api.folders.move)
  const reorderNote = useMutation(api.notes.reorder)
  const reorderFolder = useMutation(api.folders.reorder)
  const createNote = useMutation(api.notes.create)
  const createFolder = useMutation(api.folders.create)
  const navigate = useNavigate()

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'error' | 'warning' | 'info'>('error')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fileTreeExpanded')
    if (saved) {
      try {
        setExpandedFolders(new Set(JSON.parse(saved)))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  // Save expanded state to localStorage
  useEffect(() => {
    if (expandedFolders.size > 0) {
      localStorage.setItem('fileTreeExpanded', JSON.stringify(Array.from(expandedFolders)))
    }
  }, [expandedFolders])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  // Build tree structure
  const tree = useMemo(() => {
    if (!folders || !notes || !userId) return []

    const folderMap = new Map<string, TreeNode>()
    const noteMap = new Map<string, TreeNode>()

    // Create folder nodes
    folders.forEach((folder) => {
      folderMap.set(folder._id, {
        id: `folder-${folder._id}`,
        type: 'folder',
        name: folder.name,
        folderId: folder._id,
        parentId: folder.parentId,
        order: folder.order,
        children: [],
      })
    })

    // Create note nodes
    notes.forEach((note) => {
      noteMap.set(note._id, {
        id: `note-${note._id}`,
        type: 'note',
        name: note.title || 'Untitled',
        noteId: note._id,
        parentId: note.folderId ?? null,
        order: note.order ?? note.updatedAt, // Use updatedAt as fallback for ordering
      })
    })

    // Build tree
    const rootNodes: Array<TreeNode> = []

    // Add folders to tree
    folderMap.forEach((folder) => {
      if (!folder.parentId) {
        rootNodes.push(folder)
      } else {
        const parent = folderMap.get(folder.parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(folder)
        }
      }
    })

    // Add notes to tree
    noteMap.forEach((note) => {
      if (!note.parentId) {
        rootNodes.push(note)
      } else {
        const parent = folderMap.get(note.parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(note)
        }
      }
    })

    // Sort all nodes by order
    const sortNodes = (nodes: Array<TreeNode>): Array<TreeNode> => {
      const sorted = [...nodes].sort((a, b) => a.order - b.order)
      return sorted.map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }))
    }

    return sortNodes(rootNodes)
  }, [folders, notes, userId])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (event.over) {
      setOverId(event.over.id as string)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over || active.id === over.id) return

    const draggedId = active.id as string
    const targetId = over.id as string

    // Determine if we're moving within same parent or to different parent
    const activeType = draggedId.startsWith('folder-') ? 'folder' : 'note'
    const overType = targetId.startsWith('folder-') ? 'folder' : 'note'

    // Find the nodes
    const findNode = (id: string, nodes: Array<TreeNode>): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
          const found = findNode(id, node.children)
          if (found) return found
        }
      }
      return null
    }

    const activeNode = findNode(draggedId, tree)
    const overNode = findNode(targetId, tree)

    if (!activeNode || !overNode) return

    // Prevent moving folder into itself or its descendants
    if (activeType === 'folder' && overType === 'folder' && activeNode.folderId === overNode.folderId) {
      return // Can't move folder into itself
    }

    // If dropping on a folder, move into that folder
    if (overType === 'folder' && overNode.folderId) {
      // Don't move if already in that folder
      if (activeNode.parentId === overNode.folderId) {
        return
      }

      try {
        if (activeType === 'note' && activeNode.noteId) {
          await moveNote({
            noteId: activeNode.noteId,
            folderId: overNode.folderId,
          })
        } else if (activeType === 'folder' && activeNode.folderId) {
          // Check if trying to move into a descendant
          let checkParentId = overNode.parentId
          let isDescendant = false
          while (checkParentId) {
            if (checkParentId === activeNode.folderId) {
              isDescendant = true
              break
            }
            const parentNode = findNode(`folder-${checkParentId}`, tree)
            checkParentId = parentNode?.parentId
          }
          
          if (isDescendant) {
            setAlertMessage('Cannot move folder into its own descendant')
            setAlertType('warning')
            setShowAlert(true)
            return
          }

          await moveFolder({
            folderId: activeNode.folderId,
            newParentId: overNode.folderId,
          })
        }
      } catch (error) {
        console.error('Failed to move item:', error)
        setAlertMessage('Failed to move item. Please try again.')
        setAlertType('error')
        setShowAlert(true)
      }
      return
    }

    // Otherwise, reorder within same parent
    const activeParentId = activeNode.parentId
    const overParentId = overNode.parentId

    if (activeParentId !== overParentId) return // Different parents, handled above

    // Get siblings
    const siblings = activeParentId
      ? (findNode(activeParentId ? `folder-${activeParentId}` : '', tree)?.children ?? [])
      : tree

    const oldIndex = siblings.findIndex((n) => n.id === draggedId)
    const newIndex = siblings.findIndex((n) => n.id === targetId)

    if (oldIndex === -1 || newIndex === -1) return

    try {
      if (activeType === 'note' && activeNode.noteId) {
        await reorderNote({
          noteId: activeNode.noteId,
          newOrder: newIndex,
        })
      } else if (activeType === 'folder' && activeNode.folderId) {
        await reorderFolder({
          folderId: activeNode.folderId,
          newOrder: newIndex,
        })
      }
    } catch (error) {
      console.error('Failed to reorder item:', error)
      setAlertMessage('Failed to reorder item. Please try again.')
      setAlertType('error')
      setShowAlert(true)
    }
  }

  const handleNewNote = async (parentFolderId?: Id<'folders'>) => {
    if (!userId) return

    try {
      const noteId = await createNote({
        title: 'New Note',
        content: '',
        ownerId: userId,
        folderId: parentFolderId,
      })
      navigate({ to: '/notes/$noteId', params: { noteId } })
    } catch (error) {
      console.error('Failed to create note:', error)
      setAlertMessage('Failed to create note. Please try again.')
      setAlertType('error')
      setShowAlert(true)
    }
  }

  const handleNewFolder = async (parentFolderId?: Id<'folders'>) => {
    if (!userId) return

    try {
      await createFolder({
        name: 'New Folder',
        ownerId: userId,
        parentId: parentFolderId,
      })
      // Expand parent folder to show new folder
      if (parentFolderId) {
        setExpandedFolders((prev) => new Set(prev).add(parentFolderId))
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
      setAlertMessage('Failed to create folder. Please try again.')
      setAlertType('error')
      setShowAlert(true)
    }
  }


  const renderTree = (nodes: Array<TreeNode>, depth: number = 0): React.ReactNode => {
    return (
      <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        {nodes.map((node) => {
          const isExpanded = node.type === 'folder' && expandedFolders.has(node.folderId!)
          const children = node.children ? renderTree(node.children, depth + 1) : null

          return (
            <FileTreeItem
              key={node.id}
              id={node.id}
              type={node.type}
              name={node.name}
              noteId={node.noteId}
              folderId={node.folderId}
              parentFolderId={node.parentId}
              isExpanded={isExpanded}
              onToggleExpand={() => node.folderId && toggleFolder(node.folderId)}
              depth={depth}
              onRename={undefined}
              onNewNote={() => handleNewNote(node.folderId)}
              onNewFolder={() => handleNewFolder(node.folderId)}
              isOver={overId === node.id}
            >
              {children}
            </FileTreeItem>
          )
        })}
      </SortableContext>
    )
  }

  if (userId === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner"></span>
      </div>
    )
  }

  if (folders === undefined || notes === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner"></span>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="file-tree">
        <div className="flex items-center justify-between px-2 py-2 border-b border-base-300">
          <h2 className="text-sm font-semibold text-base-content/70">Files</h2>
          <div className="flex gap-1">
            <button
              onClick={() => handleNewNote()}
              className="btn btn-ghost btn-xs btn-square"
              title="New Note"
            >
              <Plus className="size-[1.2em]" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => handleNewFolder()}
              className="btn btn-ghost btn-xs btn-square"
              title="New Folder"
            >
              <Folder className="size-[1.2em]" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">
          {tree.length === 0 ? (
            <div className="p-4 text-center text-sm text-base-content/60">
              No files yet. Create a note or folder to get started.
            </div>
          ) : (
            renderTree(tree)
          )}
        </div>
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="opacity-50 bg-base-200 p-2 rounded flex items-center gap-2">
            {activeId.startsWith('folder-') ? (
              <Folder size={16} />
            ) : (
              <FileText size={16} />
            )}
            <span>{activeId}</span>
          </div>
        ) : null}
      </DragOverlay>

      <AlertToast
        isOpen={showAlert}
        message={alertMessage}
        type={alertType}
        onClose={() => setShowAlert(false)}
      />
    </DndContext>
  )
}

