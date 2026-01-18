import { useState, useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Folder, Trash2, Share2, Copy, Move, Edit, Plus } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useCurrentUser } from '../lib/auth'
import ShareDialog from './ShareDialog'
import ConfirmDialog from './ConfirmDialog'
import AlertToast from './AlertToast'
import type { Id } from 'convex/_generated/dataModel'

interface FileTreeContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  itemType: 'note' | 'folder'
  itemId: Id<'notes'> | Id<'folders'>
  itemName: string
  folderId?: Id<'folders'> | null
  onClose: () => void
  onRename?: () => void
  onNewNote?: () => void
  onNewFolder?: () => void
}

export default function FileTreeContextMenu({
  isOpen,
  x,
  y,
  itemType,
  itemId,
  itemName,
  folderId: _folderId,
  onClose,
  onRename: _onRename,
  onNewNote,
  onNewFolder,
}: FileTreeContextMenuProps) {
  const navigate = useNavigate()
  const deleteNote = useMutation(api.notes.deleteNote)
  const deleteFolder = useMutation(api.folders.deleteFolder)
  const duplicateNote = useMutation(api.notes.duplicate)
  const updateNote = useMutation(api.notes.update)
  const updateFolder = useMutation(api.folders.update)
  const currentUserId = useCurrentUser()
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameInput, setShowRenameInput] = useState(false)
  const [renameValue, setRenameValue] = useState(itemName)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showRenameInput && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [showRenameInput])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false)
    try {
      if (itemType === 'note') {
        await deleteNote({ noteId: itemId as Id<'notes'> })
        navigate({ to: '/' })
      } else {
        await deleteFolder({ folderId: itemId as Id<'folders'> })
      }
      onClose()
    } catch (error) {
      console.error('Failed to delete:', error)
      setAlertMessage('Failed to delete. Please try again.')
      setShowAlert(true)
    }
  }

  const handleDuplicate = async () => {
    if (itemType !== 'note' || !currentUserId) return

    try {
      const newNoteId = await duplicateNote({
        noteId: itemId as Id<'notes'>,
        ownerId: currentUserId,
      })
      if (newNoteId) {
        navigate({ to: '/notes/$noteId', params: { noteId: newNoteId } })
      }
      onClose()
    } catch (error) {
      console.error('Failed to duplicate note:', error)
      setAlertMessage('Failed to duplicate note. Please try again.')
      setShowAlert(true)
    }
  }

  const handleRename = () => {
    setShowRenameInput(true)
    setRenameValue(itemName)
  }

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || renameValue.trim() === itemName) {
      setShowRenameInput(false)
      onClose()
      return
    }

    try {
      if (itemType === 'folder') {
        await updateFolder({
          folderId: itemId as Id<'folders'>,
          name: renameValue.trim(),
        })
      } else {
        await updateNote({
          noteId: itemId as Id<'notes'>,
          title: renameValue.trim(),
        })
      }
      setShowRenameInput(false)
      onClose()
    } catch (error) {
      console.error('Failed to rename:', error)
      setAlertMessage('Failed to rename. Please try again.')
      setShowAlert(true)
    }
  }

  const handleRenameCancel = () => {
    setShowRenameInput(false)
    setRenameValue(itemName)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 bg-base-200 border border-base-300 rounded-lg shadow-lg py-1 min-w-[180px]"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        {showRenameInput ? (
          <div className="p-2">
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
              onBlur={handleRenameCancel}
              className="input input-sm input-bordered w-full"
              placeholder="New name"
            />
          </div>
        ) : (
          <>
            {itemType === 'folder' && (
              <>
                <button
                  onClick={() => {
                    onNewNote?.()
                    onClose()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  New Note
                </button>
                <button
                  onClick={() => {
                    onNewFolder?.()
                    onClose()
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
                >
                  <Folder size={16} />
                  New Folder
                </button>
                <div className="divider my-1"></div>
              </>
            )}
            <button
              onClick={() => {
                handleRename()
              }}
              className="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
            >
              <Edit size={16} />
              Rename
            </button>
            {itemType === 'note' && (
              <>
                <button
                  onClick={() => {
                    setShowShareDialog(true)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
                >
                  <Share2 size={16} />
                  Share
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
              </>
            )}
            <button
              onClick={() => {
                setShowMoveDialog(true)
              }}
              className="w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
            >
              <Move size={16} />
              Move to Folder
            </button>
            <div className="divider my-1"></div>
            <button
              onClick={handleDeleteClick}
              className="w-full px-4 py-2 text-left hover:bg-error/20 text-error flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </>
        )}
      </div>

      {itemType === 'note' && (
        <ShareDialog
          noteId={itemId as Id<'notes'>}
          isOpen={showShareDialog}
          onClose={() => {
            setShowShareDialog(false)
            onClose()
          }}
        />
      )}

      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-200 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Move to Folder</h3>
            <p className="text-sm text-base-content/60 mb-4">
              Move "{itemName}" to a different folder
            </p>
            <p className="text-xs text-base-content/40">
              Full folder picker implementation coming soon
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowMoveDialog(false)
                  onClose()
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="btn-error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <AlertToast
        isOpen={showAlert}
        message={alertMessage}
        type="error"
        onClose={() => setShowAlert(false)}
      />
    </>
  )
}

