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
  DragOverlay,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Folder, FileText, Search, X } from 'lucide-react'
import { useTestUser } from '../../lib/useTestUser'
import AlertToast from '../AlertToast'
import FileTreeItem from './FileTreeItem'
import type {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent} from '@dnd-kit/core';
import type { Id } from 'convex/_generated/dataModel'

// Root drop zone - covers the entire scrollable area to catch drops in empty space
function RootDropZone({ activeId }: { activeId: string | null }) {
  const { setNodeRef } = useDroppable({
    id: 'root-drop-zone',
    disabled: !activeId,
  })

  if (!activeId) return null

  // Cover entire area - this will catch drops when not over any folder/item
  return (
    <div
      ref={setNodeRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: 'auto' }}
    />
  )
}

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
  const userId = useTestUser()
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
  const [activeItemName, setActiveItemName] = useState<string | null>(null)
  const [activeItemType, setActiveItemType] = useState<'note' | 'folder' | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [isOverRoot, setIsOverRoot] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'error' | 'warning' | 'info'>('error')

  // Use activation distance to prevent accidental drags
  // Files are easy to drag, but require small movement to start
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts - prevents accidental drags while allowing easy file dragging
      },
    }),
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

  // Build tree structure
  const tree = useMemo(() => {
    if (!folders || !notes) return []

    const folderMap = new Map<string, TreeNode>()
    const noteMap = new Map<string, TreeNode>()

    // Create folder nodes
    folders.forEach((folder: { _id: Id<'folders'>; name: string; parentId?: Id<'folders'> | null; order: number }) => {
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
    notes.forEach((note: { _id: Id<'notes'>; title?: string; folderId?: Id<'folders'> | null; order?: number; updatedAt: number }) => {
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
  }, [folders, notes])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

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

      const getAllNodes = (nodes: Array<TreeNode>): Array<TreeNode> => {
        const result: Array<TreeNode> = []
        for (const node of nodes) {
          result.push(node)
          if (node.children) {
            result.push(...getAllNodes(node.children))
          }
        }
        return result
      }

      const allNodes = getAllNodes(tree)
      const currentIndex = selectedId
        ? allNodes.findIndex((n) => n.id === selectedId)
        : -1

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (allNodes.length > 0) {
            const nextIndex = currentIndex < allNodes.length - 1 ? currentIndex + 1 : 0
            setSelectedId(allNodes[nextIndex].id)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (allNodes.length > 0) {
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : allNodes.length - 1
            setSelectedId(allNodes[prevIndex].id)
          }
          break
        case 'Enter':
          e.preventDefault()
          if (selectedId) {
            const node = findNode(selectedId, tree)
            if (node) {
              if (node.type === 'note' && node.noteId) {
                navigate({ to: '/notes/$noteId', params: { noteId: node.noteId } })
              } else if (node.type === 'folder' && node.folderId) {
                toggleFolder(node.folderId)
              }
            }
          }
          break
        case 'F2':
          e.preventDefault()
          // Rename will be handled by FileTreeItem
          break
        case 'Delete':
          e.preventDefault()
          if (selectedId) {
            const node = findNode(selectedId, tree)
            if (node) {
              // Delete will be handled by context menu or we can add direct delete
              // For now, just show alert that delete should be done via context menu
            }
          }
          break
        case 'Escape':
          setSelectedId(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tree, selectedId, navigate])

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

  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree

    const query = searchQuery.toLowerCase().trim()
    const filterNodes = (nodes: Array<TreeNode>): Array<TreeNode> => {
      const filtered: Array<TreeNode> = []
      for (const node of nodes) {
        const matches = node.name.toLowerCase().includes(query)
        const filteredChildren = node.children ? filterNodes(node.children) : undefined
        const hasMatchingChildren = filteredChildren && filteredChildren.length > 0

        if (matches || hasMatchingChildren) {
          filtered.push({
            ...node,
            children: filteredChildren,
          })
        }
      }
      return filtered
    }

    return filterNodes(tree)
  }, [tree, searchQuery])

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = event.active.id as string
    setActiveId(draggedId)
    
    // Find the node to get its name and type
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
    
    const node = findNode(draggedId, tree)
    if (node) {
      setActiveItemName(node.name)
      setActiveItemType(node.type)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (event.over) {
      const overIdStr = event.over.id as string
      setOverId(overIdStr)
      // Show root highlight if over root drop zone
      setIsOverRoot(overIdStr === 'root-drop-zone')
    } else {
      // If not over any item (dragging over empty space), show root highlight
      setOverId(null)
      setIsOverRoot(true)
    }
  }

  // Also handle when drag leaves all items - show root highlight
  const handleDragCancel = () => {
    setActiveId(null)
    setActiveItemName(null)
    setActiveItemType(null)
    setOverId(null)
    setIsOverRoot(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveItemName(null)
    setActiveItemType(null)
    setOverId(null)
    setIsOverRoot(false)

    if (!over || active.id === over.id) {
      // If dropped on nothing (empty space), move to root
      if (over === null && active.id) {
        const draggedId = active.id as string
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
        if (!activeNode || !activeNode.parentId) return

        const activeType = draggedId.startsWith('folder-') ? 'folder' : 'note'

        try {
          if (activeType === 'note' && activeNode.noteId) {
            await moveNote({
              noteId: activeNode.noteId,
              folderId: undefined,
            })
          } else if (activeType === 'folder' && activeNode.folderId) {
            await moveFolder({
              folderId: activeNode.folderId,
              newParentId: undefined,
            })
          }
        } catch (error) {
          console.error('Failed to move to root:', error)
          setAlertMessage('Failed to move to root. Please try again.')
          setAlertType('error')
          setShowAlert(true)
        }
      }
      return
    }

    const draggedId = active.id as string
    const targetId = over.id as string

    // Handle dropping on root
    if (targetId === 'root-drop-zone') {
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
      if (!activeNode) return

      // Don't move if already at root
      if (!activeNode.parentId) return

      const activeType = draggedId.startsWith('folder-') ? 'folder' : 'note'

      try {
        if (activeType === 'note' && activeNode.noteId) {
          await moveNote({
            noteId: activeNode.noteId,
            folderId: undefined,
          })
        } else if (activeType === 'folder' && activeNode.folderId) {
          await moveFolder({
            folderId: activeNode.folderId,
            newParentId: undefined,
          })
        }
      } catch (error) {
        console.error('Failed to move to root:', error)
        setAlertMessage('Failed to move to root. Please try again.')
        setAlertType('error')
        setShowAlert(true)
      }
      return
    }

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
              onNewNote={() => handleNewNote(node.folderId ?? undefined)}
              onNewFolder={() => handleNewFolder(node.folderId ?? undefined)}
              isOver={overId === node.id}
              isSelected={selectedId === node.id}
              onSelect={() => setSelectedId(node.id)}
              searchQuery={searchQuery}
            >
              {children}
            </FileTreeItem>
          )
        })}
      </SortableContext>
    )
  }



  if (folders === undefined || notes === undefined || userId === undefined) {
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
      onDragCancel={handleDragCancel}
    >
      <div className="file-tree">
        <div className="border-b border-base-300">
          <div className="flex items-center justify-between px-2 py-2">
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
          <div className="px-2 pb-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm input-bordered w-full pl-8 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-square"
                  title="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 relative px-1 py-0.5">
          <RootDropZone activeId={activeId} />
          {/* Root highlight line - shows when dragging over root area (empty space or root drop zone) */}
          {activeId && isOverRoot && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-20 shadow-sm" />
          )}
          {filteredTree.length === 0 ? (
            <div className="p-4 text-center text-sm text-base-content/60">
              {searchQuery ? 'No files match your search.' : 'No files yet. Create a note or folder to get started.'}
            </div>
          ) : (
            renderTree(filteredTree)
          )}
        </div>
      </div>
      <DragOverlay>
        {activeId && activeItemName ? (
          <div className="opacity-80 bg-base-200 border border-base-300 shadow-lg p-2 rounded flex items-center gap-2 min-w-[120px]">
            {activeItemType === 'folder' ? (
              <Folder size={16} className="text-primary" />
            ) : (
              <FileText size={16} className="text-base-content/70" />
            )}
            <span className="text-sm font-medium truncate">{activeItemName}</span>
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
