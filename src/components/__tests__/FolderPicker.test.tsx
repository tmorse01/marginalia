import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useQuery } from 'convex/react'
import FolderPicker from '../FolderPicker'

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

// Mock auth
vi.mock('../../lib/auth', () => ({
  useCurrentUser: vi.fn(() => 'user-123'),
}))

describe('FolderPicker', () => {
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

  const defaultProps = {
    currentFolderId: null,
    onSelect: vi.fn(),
    onCancel: vi.fn(),
    itemType: 'note' as const,
    itemName: 'Test Item',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useQuery as any).mockReturnValue(mockFolders)
  })

  it('renders folder picker', () => {
    render(<FolderPicker {...defaultProps} />)
    expect(screen.getByText('Move to Folder')).toBeInTheDocument()
  })

  it('shows root option', () => {
    render(<FolderPicker {...defaultProps} />)
    expect(screen.getByText('Root')).toBeInTheDocument()
  })

  it('shows folder tree', () => {
    render(<FolderPicker {...defaultProps} />)
    expect(screen.getByText('Folder 1')).toBeInTheDocument()
  })

  it('handles selecting root', () => {
    const onSelect = vi.fn()
    render(<FolderPicker {...defaultProps} onSelect={onSelect} />)
    
    const rootOption = screen.getByText('Root').closest('div')
    if (rootOption) {
      fireEvent.click(rootOption)
      expect(onSelect).toHaveBeenCalledWith(null)
    }
  })

  it('handles selecting folder', () => {
    const onSelect = vi.fn()
    render(<FolderPicker {...defaultProps} onSelect={onSelect} />)
    
    const folder = screen.getByText('Folder 1').closest('div')
    if (folder) {
      fireEvent.click(folder)
      expect(onSelect).toHaveBeenCalledWith('folder-1')
    }
  })

  it('handles cancel', () => {
    const onCancel = vi.fn()
    render(<FolderPicker {...defaultProps} onCancel={onCancel} />)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(onCancel).toHaveBeenCalled()
  })

  it('prevents selecting excluded folder', () => {
    const onSelect = vi.fn()
    render(
      <FolderPicker
        {...defaultProps}
        excludeFolderId={'folder-1' as any}
        onSelect={onSelect}
      />
    )
    
    const folder = screen.getByText('Folder 1').closest('div')
    if (folder) {
      fireEvent.click(folder)
      // Should not call onSelect for excluded folder
      expect(onSelect).not.toHaveBeenCalled()
    }
  })

  it('highlights current folder', () => {
    render(
      <FolderPicker
        {...defaultProps}
        currentFolderId={'folder-1' as any}
      />
    )
    
    const folder = screen.getByText('Folder 1').closest('div')
    expect(folder?.className).toContain('bg-primary/20')
  })

  it('expands folders when clicked', () => {
    render(<FolderPicker {...defaultProps} />)
    
    // Find expand button (chevron)
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find((btn) => 
      btn.querySelector('svg')
    )
    
    if (expandButton) {
      fireEvent.click(expandButton)
      // Folder 2 should become visible (it's a child of Folder 1)
      expect(screen.getByText('Folder 2')).toBeInTheDocument()
    }
  })

  it('shows loading state', () => {
    ;(useQuery as any).mockReturnValue(undefined)
    
    render(<FolderPicker {...defaultProps} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows empty state when no folders', () => {
    ;(useQuery as any).mockReturnValue([])
    
    render(<FolderPicker {...defaultProps} />)
    expect(screen.getByText(/No folders available/)).toBeInTheDocument()
  })
})
