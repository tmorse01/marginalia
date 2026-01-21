import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { ChevronRight, ChevronDown, Folder, Home } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface FolderNode {
  _id: Id<'folders'>
  name: string
  parentId?: Id<'folders'> | null
  children?: Array<FolderNode>
}

interface FolderPickerProps {
  currentFolderId?: Id<'folders'> | null
  excludeFolderId?: Id<'folders'> // For preventing self-selection
  onSelect: (folderId: Id<'folders'> | null) => void
  onCancel: () => void
  itemType: 'note' | 'folder'
  itemName: string
}

export default function FolderPicker({
  currentFolderId,
  excludeFolderId,
  onSelect,
  onCancel,
  itemType,
  itemName,
}: FolderPickerProps) {
  const folders = useQuery(api.folders.list, 'skip')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Build tree structure
  const folderTree = useMemo(() => {
    if (!folders) return []

    const folderMap = new Map<string, FolderNode>()

    // Create folder nodes
    folders.forEach((folder: { _id: Id<'folders'>; name: string; parentId?: Id<'folders'> | null }) => {
      folderMap.set(folder._id, {
        _id: folder._id,
        name: folder.name,
        parentId: folder.parentId,
        children: [],
      })
    })

    // Build tree
    const rootNodes: Array<FolderNode> = []

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

    // Sort by name
    const sortFolders = (nodes: Array<FolderNode>): Array<FolderNode> => {
      const sorted = [...nodes].sort((a, b) => a.name.localeCompare(b.name))
      return sorted.map((node) => ({
        ...node,
        children: node.children ? sortFolders(node.children) : undefined,
      }))
    }

    return sortFolders(rootNodes)
  }, [folders])

  // Check if a folder is a descendant of excludeFolderId
  const isDescendant = (folderId: Id<'folders'>): boolean => {
    if (!excludeFolderId) return false

    const findFolder = (id: Id<'folders'>): FolderNode | null => {
      const findInTree = (nodes: Array<FolderNode>): FolderNode | null => {
        for (const node of nodes) {
          if (node._id === id) return node
          if (node.children) {
            const found = findInTree(node.children)
            if (found) return found
          }
        }
        return null
      }
      return findInTree(folderTree)
    }

    let currentId: Id<'folders'> | null | undefined = folderId
    while (currentId) {
      if (currentId === excludeFolderId) return true
      const folder = findFolder(currentId)
      currentId = folder?.parentId
    }
    return false
  }

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

  const handleFolderClick = (folderId: Id<'folders'>) => {
    // Prevent selecting excluded folder or its descendants
    if (folderId === excludeFolderId || isDescendant(folderId)) {
      return
    }
    onSelect(folderId)
  }

  const handleRootClick = () => {
    // Can't move folder to root if it's already at root
    if (itemType === 'folder' && !currentFolderId) {
      return
    }
    onSelect(null)
  }

  const renderFolder = (folder: FolderNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(folder._id)
    const isCurrent = folder._id === currentFolderId
    const isExcluded = folder._id === excludeFolderId
    const isDescendantOfExcluded = isDescendant(folder._id)
    const isDisabled = isExcluded || isDescendantOfExcluded

    const paddingLeft = `${depth * 1.25}rem`

    return (
      <div key={folder._id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${
            isCurrent
              ? 'bg-primary/20 text-primary'
              : isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-base-300'
          }`}
          style={{ paddingLeft }}
          onClick={() => !isDisabled && handleFolderClick(folder._id)}
        >
          {folder.children && folder.children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder._id)
              }}
              className="p-0.5 hover:bg-base-200 rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-base-content/60" />
              ) : (
                <ChevronRight size={16} className="text-base-content/60" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <Folder size={16} className="text-primary flex-shrink-0" />
          <span className="flex-1 min-w-0 truncate text-sm">{folder.name}</span>
          {isCurrent && (
            <span className="text-xs text-base-content/60">(current)</span>
          )}
          {isExcluded && (
            <span className="text-xs text-base-content/60">(cannot select)</span>
          )}
        </div>
        {isExpanded && folder.children && (
          <div>{folder.children.map((child) => renderFolder(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  if (folders === undefined) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner"></span>
      </div>
    )
  }

  return (
    <div className="bg-base-200 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
      <h3 className="text-lg font-bold mb-2">Move to Folder</h3>
      <p className="text-sm text-base-content/60 mb-4">
        Move "{itemName}" to a different folder
      </p>

      <div className="overflow-y-auto flex-1 min-h-0 border border-base-300 rounded p-2 mb-4">
        {/* Root option */}
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${
            !currentFolderId
              ? 'bg-primary/20 text-primary'
              : itemType === 'folder' && !currentFolderId
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-base-300'
          }`}
          onClick={handleRootClick}
        >
          <Home size={16} className="text-primary flex-shrink-0" />
          <span className="flex-1 min-w-0 truncate text-sm font-medium">Root</span>
          {!currentFolderId && (
            <span className="text-xs text-base-content/60">(current)</span>
          )}
        </div>

        {/* Folder tree */}
        {folderTree.length === 0 ? (
          <div className="p-4 text-center text-sm text-base-content/60">
            No folders available
          </div>
        ) : (
          <div>{folderTree.map((folder) => renderFolder(folder))}</div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
