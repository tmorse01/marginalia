import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useQuery, useMutation } from 'convex/react'
import FileTree from '../file-tree/FileTree'

// Mock Convex hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

// Mock router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to?: string }) => (
    <a href={typeof to === 'string' ? to : '#'} {...rest}>
      {children}
    </a>
  ),
  useNavigate: vi.fn(() => vi.fn()),
  useRouterState: vi.fn(() => ({
    location: { pathname: '/', href: '/' },
    matches: [] as unknown[],
  })),
}))

vi.mock('../../lib/useTestUser', () => ({
  useTestUser: vi.fn(() => 'user-123' as any),
}))

// Mock FileTreeItem
vi.mock('../FileTreeItem', () => ({
  default: ({ name, type }: any) => (
    <div data-testid={`file-tree-item-${type}`}>{name}</div>
  ),
}))

// Mock AlertToast
vi.mock('../AlertToast', () => ({
  default: () => null,
}))

describe('FileTree', () => {
  const mockFolders = [
    {
      _id: 'folder-1' as any,
      name: 'Folder 1',
      ownerId: 'user-123' as any,
      parentId: null,
      order: 0,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      _id: 'folder-2' as any,
      name: 'Folder 2',
      ownerId: 'user-123' as any,
      parentId: 'folder-1' as any,
      order: 0,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ]

  const mockNotes = [
    {
      _id: 'note-1' as any,
      title: 'Note 1',
      content: '',
      ownerId: 'user-123' as any,
      folderId: null,
      order: 0,
      visibility: 'private' as const,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      _id: 'note-2' as any,
      title: 'Note 2',
      content: '',
      ownerId: 'user-123' as any,
      folderId: 'folder-1' as any,
      order: 0,
      visibility: 'private' as const,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    let useQueryCall = 0
    ;(useQuery as any).mockImplementation((_query: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      useQueryCall += 1
      // FileTree calls folders.list then listUserNotes on each render
      return useQueryCall % 2 === 1 ? mockFolders : mockNotes
    })
    ;(useMutation as any).mockReturnValue(vi.fn())
  })

  it('renders file tree with folders and notes', () => {
    render(<FileTree />)
    expect(screen.getByText('Files')).toBeInTheDocument()
  })

  it('shows empty state when no files', () => {
    let useQueryCall = 0
    ;(useQuery as any).mockImplementation((_query: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      useQueryCall += 1
      return useQueryCall % 2 === 1 ? [] : []
    })

    render(<FileTree />)
    expect(screen.getByText(/No files yet/)).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<FileTree />)
    const searchInput = screen.getByPlaceholderText('Search files...')
    expect(searchInput).toBeInTheDocument()
  })

  it('filters tree based on search query', () => {
    render(<FileTree />)
    const searchInput = screen.getByPlaceholderText('Search files...')
    
    fireEvent.change(searchInput, { target: { value: 'Note 1' } })
    
    // Should filter to show only matching items
    expect(searchInput).toHaveValue('Note 1')
  })

  it('clears search when clear button clicked', () => {
    render(<FileTree />)
    const searchInput = screen.getByPlaceholderText('Search files...')
    
    fireEvent.change(searchInput, { target: { value: 'test' } })
    expect(searchInput).toHaveValue('test')
    
    const clearButton = screen.getByTitle('Clear search')
    fireEvent.click(clearButton)
    
    expect(searchInput).toHaveValue('')
  })

  it('shows new note and folder buttons', () => {
    render(<FileTree />)
    const newNoteButton = screen.getByTitle('New Note')
    const newFolderButton = screen.getByTitle('New Folder')
    
    expect(newNoteButton).toBeInTheDocument()
    expect(newFolderButton).toBeInTheDocument()
  })

  it('handles creating new note', async () => {
    const createNote = vi.fn().mockResolvedValue('new-note-id')
    let mutationCall = 0
    ;(useMutation as any).mockImplementation(() => {
      mutationCall += 1
      // FileTree registers 6 mutations per render; api.notes.create is 5th
      if ((mutationCall - 1) % 6 === 4) return createNote
      return vi.fn()
    })

    render(<FileTree />)
    const newNoteButton = screen.getByTitle('New Note')
    fireEvent.click(newNoteButton)

    await waitFor(() => {
      expect(createNote).toHaveBeenCalled()
    })
  })

  it('handles creating new folder', async () => {
    const createFolder = vi.fn().mockResolvedValue('new-folder-id')
    let mutationCall = 0
    ;(useMutation as any).mockImplementation(() => {
      mutationCall += 1
      if ((mutationCall - 1) % 6 === 5) return createFolder
      return vi.fn()
    })

    render(<FileTree />)
    const newFolderButton = screen.getByTitle('New Folder')
    fireEvent.click(newFolderButton)

    await waitFor(() => {
      expect(createFolder).toHaveBeenCalled()
    })
  })
})
