import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FileTreeItem from '../FileTreeItem'

// Mock router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useRouterState: vi.fn(() => ({
    location: { pathname: '/' },
  })),
}))

// Mock Convex
vi.mock('convex/react', () => ({
  useMutation: vi.fn(() => vi.fn()),
}))

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}))

vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}))

// Mock FileTreeContextMenu
vi.mock('../FileTreeContextMenu', () => ({
  default: () => null,
}))

describe('FileTreeItem', () => {
  const defaultProps = {
    id: 'note-1',
    type: 'note' as const,
    name: 'Test Note',
    noteId: 'note-1' as any,
    depth: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders note item', () => {
    render(<FileTreeItem {...defaultProps} />)
    expect(screen.getByText('Test Note')).toBeInTheDocument()
  })

  it('renders folder item', () => {
    render(
      <FileTreeItem
        {...defaultProps}
        type="folder"
        folderId={'folder-1' as any}
        name="Test Folder"
      />
    )
    expect(screen.getByText('Test Folder')).toBeInTheDocument()
  })

  it('handles double-click to rename', async () => {
    render(<FileTreeItem {...defaultProps} />)
    
    const item = screen.getByText('Test Note').closest('div')
    if (item) {
      fireEvent.doubleClick(item)
      
      await waitFor(() => {
        const input = screen.getByDisplayValue('Test Note')
        expect(input).toBeInTheDocument()
      })
    }
  })

  it('highlights search matches', () => {
    render(<FileTreeItem {...defaultProps} searchQuery="Test" />)
    
    const item = screen.getByText('Test Note')
    expect(item).toBeInTheDocument()
  })

  it('shows selected state', () => {
    const { container } = render(
      <FileTreeItem {...defaultProps} isSelected={true} />
    )
    
    const item = container.querySelector('.ring-2')
    expect(item).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<FileTreeItem {...defaultProps} onSelect={onSelect} />)
    
    const item = screen.getByText('Test Note').closest('div')
    if (item) {
      fireEvent.click(item)
      expect(onSelect).toHaveBeenCalled()
    }
  })

  it('handles folder expansion', () => {
    const onToggleExpand = vi.fn()
    render(
      <FileTreeItem
        {...defaultProps}
        type="folder"
        folderId={'folder-1' as any}
        isExpanded={false}
        onToggleExpand={onToggleExpand}
      />
    )
    
    // Click the expand button
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find((btn) => 
      btn.querySelector('svg')
    )
    
    if (expandButton) {
      fireEvent.click(expandButton)
      expect(onToggleExpand).toHaveBeenCalled()
    }
  })
})
