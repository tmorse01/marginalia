import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Plus, FileText, Clock, Users, Search, Filter } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSidebar } from '../lib/sidebar-context'
import { useTestUser } from '../lib/useTestUser'
import LandingPage from '../components/landing/LandingPage'
import NoteCard from '../components/NoteCard'
import type { Id } from 'convex/_generated/dataModel'

export const Route = createFileRoute('/')({
  component: HomePage,
})

type SortOption = 'updated' | 'created' | 'alphabetical' | 'alphabetical-reverse'

function HomePage() {
  const userId = useTestUser()
  const notes = useQuery(api.notes.listUserNotes, userId ? { userId } : 'skip')
  const folders = useQuery(api.folders.list, userId ? { userId } : 'skip')
  const { setIsLandingPage } = useSidebar()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<Id<'folders'> | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updated')

  // Set landing page flag when showing landing page
  useEffect(() => {
    if (notes !== undefined && notes.length === 0) {
      setIsLandingPage(true)
      return () => setIsLandingPage(false)
    }
    return () => setIsLandingPage(false)
  }, [notes, setIsLandingPage])

  // Calculate stats
  const stats = useMemo(() => {
    if (!notes || !userId) return null

    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    const recentlyUpdated = notes.filter((n: { updatedAt: number }) => n.updatedAt >= sevenDaysAgo).length
    const thisWeek = notes.filter((n: { createdAt: number }) => n.createdAt >= sevenDaysAgo).length
    const sharedNotes = notes.filter(
      (n: { visibility: 'private' | 'shared' | 'public'; ownerId: Id<'users'> }) =>
        n.visibility === 'shared' ||
        n.visibility === 'public' ||
        (n.ownerId !== userId)
    ).length

    return {
      total: notes.length,
      recentlyUpdated,
      thisWeek,
      shared: sharedNotes,
    }
  }, [notes, userId])

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    if (!notes) return []

    let filtered = [...notes]

    // Filter by folder
    if (selectedFolderId !== 'all') {
      filtered = filtered.filter((n) => n.folderId === selectedFolderId)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return b.updatedAt - a.updatedAt
        case 'created':
          return b.createdAt - a.createdAt
        case 'alphabetical':
          return (a.title || 'Untitled').localeCompare(b.title || 'Untitled')
        case 'alphabetical-reverse':
          return (b.title || 'Untitled').localeCompare(a.title || 'Untitled')
        default:
          return b.updatedAt - a.updatedAt
      }
    })

    return filtered
  }, [notes, selectedFolderId, searchQuery, sortBy])

  // Create folder map for quick lookup
  const folderMap = useMemo(() => {
    if (!folders) return new Map<Id<'folders'>, string>()
    return new Map(folders.map((f: { _id: Id<'folders'>; name: string }) => [f._id, f.name]))
  }, [folders])

  // Show landing page for first-time users (no notes yet)
  if (notes !== undefined && notes.length === 0) {
    // Use a wrapper that removes the MainContent padding to match landing layout
    return (
      <div className="-mx-4 -my-8">
        <LandingPage />
      </div>
    )
  }

  // Show notes dashboard for users with existing notes
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Notes</h1>
        <Link to="/notes/new" search={{ folderId: undefined }} className="btn btn-primary">
          <Plus size={20} />
          New Note
        </Link>
      </div>

      {notes === undefined ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          {/* Stats Section */}
          {stats && (
            <div className="stats stats-vertical lg:stats-horizontal shadow mb-6 w-full">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <FileText size={24} />
                </div>
                <div className="stat-title">Total Notes</div>
                <div className="stat-value text-primary">{stats.total}</div>
                <div className="stat-desc">All your notes</div>
              </div>
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Clock size={24} />
                </div>
                <div className="stat-title">Recently Updated</div>
                <div className="stat-value text-secondary">{stats.recentlyUpdated}</div>
                <div className="stat-desc">Last 7 days</div>
              </div>
              <div className="stat">
                <div className="stat-figure text-primary">
                  <Users size={24} />
                </div>
                <div className="stat-title">Shared Notes</div>
                <div className="stat-value text-primary">{stats.shared}</div>
                <div className="stat-desc">With others</div>
              </div>
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Plus size={24} />
                </div>
                <div className="stat-title">This Week</div>
                <div className="stat-value text-secondary">{stats.thisWeek}</div>
                <div className="stat-desc">Created last 7 days</div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
            </div>

            {/* Folder Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-base-content/60" />
              <select
                className="select select-bordered"
                value={selectedFolderId}
                onChange={(e) =>
                  setSelectedFolderId(
                    e.target.value === 'all' ? 'all' : (e.target.value as Id<'folders'>)
                  )
                }
              >
                <option value="all">All Folders</option>
                {folders?.map((folder: { _id: Id<'folders'>; name: string }) => (
                  <option key={folder._id} value={folder._id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              className="select select-bordered"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Recently Created</option>
              <option value="alphabetical">A-Z</option>
              <option value="alphabetical-reverse">Z-A</option>
            </select>
          </div>

          {/* Notes Grid */}
          {filteredAndSortedNotes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-base-content/60 text-lg mb-4">
                {searchQuery || selectedFolderId !== 'all'
                  ? 'No notes match your filters'
                  : 'No notes yet'}
              </p>
              {(searchQuery || selectedFolderId !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedFolderId('all')
                  }}
                  className="btn btn-outline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedNotes.map((note: { _id: Id<'notes'>; title: string; content: string; updatedAt: number; createdAt: number; folderId?: Id<'folders'> | null; visibility: 'private' | 'shared' | 'public'; ownerId: Id<'users'>; order?: number }) => (
                <NoteCard
                  key={note._id}
                  note={{ ...note, folderId: note.folderId ?? undefined }}
                  folderName={note.folderId ? folderMap.get(note.folderId) : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
