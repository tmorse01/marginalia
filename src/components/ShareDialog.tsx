import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Check, Copy, Share2, UserPlus, X } from 'lucide-react'
import type { Id } from 'convex/_generated/dataModel'

interface ShareDialogProps {
  noteId: Id<'notes'>
  isOpen: boolean
  onClose: () => void
}

export default function ShareDialog({
  noteId,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const permissions = useQuery(api.permissions.list, { noteId })
  const note = useQuery(api.notes.get, { noteId })
  const grantPermission = useMutation(api.permissions.grant)
  const revokePermission = useMutation(api.permissions.revoke)
  const updateNote = useMutation(api.notes.update)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [isGranting, setIsGranting] = useState(false)
  const [copied, setCopied] = useState(false)

  const publicUrl = note?.visibility === 'public'
    ? `${window.location.origin}/public/${noteId}`
    : null

  const handleGrantPermission = () => {
    if (!email.trim()) return

    setIsGranting(true)
    try {
      // TODO: Get user ID from email lookup
      // For now, this is a placeholder
      alert('User lookup by email not yet implemented')
      setEmail('')
    } catch (error) {
      console.error('Failed to grant permission:', error)
      alert(
        error instanceof Error
          ? `Failed to grant permission: ${error.message}`
          : 'Failed to grant permission. Please try again.'
      )
    } finally {
      setIsGranting(false)
    }
  }

  const handleCopyLink = async () => {
    if (publicUrl) {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleMakePublic = async () => {
    await updateNote({ noteId, visibility: 'public' })
  }

  const handleRevoke = async (userId: Id<'users'>) => {
    await revokePermission({ noteId, userId })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="modal modal-open">
        <div className="modal-box max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Share2 size={24} />
              Share Note
            </h3>
            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Make Public Section */}
            <div>
              <h4 className="font-semibold mb-2">Public Access</h4>
              {note?.visibility === 'public' ? (
                <div className="alert alert-success">
                  <div className="flex-1">
                    <p className="font-medium">This note is publicly accessible</p>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        readOnly
                        value={publicUrl || ''}
                        className="input input-bordered flex-1 text-sm"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
                      >
                        {copied ? (
                          <>
                            <Check size={16} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleMakePublic}
                  className="btn btn-outline btn-primary"
                >
                  Make Public
                </button>
              )}
            </div>

            {/* Share with Users Section */}
            <div>
              <h4 className="font-semibold mb-2">Share with Users</h4>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="input input-bordered flex-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <select
                  className="select select-bordered"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={handleGrantPermission}
                  className="btn btn-primary"
                  disabled={!email.trim() || isGranting}
                >
                  {isGranting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Add
                    </>
                  )}
                </button>
              </div>

              {/* Permissions List */}
              <div className="space-y-2">
                {permissions === undefined ? (
                  <div className="text-center py-4">
                    <span className="loading loading-spinner"></span>
                  </div>
                ) : permissions.length === 0 ? (
                  <div className="alert alert-info">
                    <p className="text-sm">No shared users yet</p>
                  </div>
                ) : (
                  permissions.map((perm) => (
                    <div
                      key={perm._id}
                      className="card bg-base-200 border border-base-300"
                    >
                      <div className="card-body p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">
                              {perm.user?.name || perm.user?.email || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="badge badge-outline badge-sm capitalize">
                                {perm.role}
                              </span>
                              {perm.role === 'owner' && (
                                <span className="badge badge-primary badge-sm">Owner</span>
                              )}
                            </div>
                          </div>
                          {perm.role !== 'owner' && (
                            <button
                              onClick={() => handleRevoke(perm.userId)}
                              className="btn btn-sm btn-ghost text-error"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button onClick={onClose} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

