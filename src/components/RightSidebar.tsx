import { useState, useEffect } from 'react'
import InlineCommentsPanel from './InlineCommentsPanel'
import AIChatPanel from './AIChatPanel'
import NoteMetadataPanel from './NoteMetadataPanel'
import type { Id } from 'convex/_generated/dataModel'

interface CommentData {
  _id: Id<'comments'>
  noteId: Id<'notes'>
  authorId: Id<'users'>
  body: string
  lineNumber?: number
  lineContent?: string
  parentId?: Id<'comments'>
  resolved: boolean
  resolvedBy?: Id<'users'>
  resolvedAt?: number
  editedAt?: number
  createdAt: number
  author: { name: string; email: string } | null
  resolvedByUser?: { name: string; email: string } | null
}

interface CommentWithReplies extends CommentData {
  replies: Array<CommentData>
}

interface NoteData {
  _id: Id<'notes'>
  title: string
  content: string
  ownerId: Id<'users'>
  folderId?: Id<'folders'>
  visibility: 'private' | 'shared' | 'public'
  createdAt: number
  updatedAt: number
}

interface RightSidebarProps {
  noteId: Id<'notes'>
  note: NoteData | null | undefined
  commentsByLine: Partial<Record<number, Array<CommentWithReplies>>>
  selectedLine: number | null
  onLineSelect: (lineNumber: number | null) => void
  currentUserId?: Id<'users'>
  noteOwnerId?: Id<'users'>
  content: string
  showAllComments?: boolean
  activeTab?: 'comments' | 'ai' | 'metadata'
  onTabChange?: (tab: 'comments' | 'ai' | 'metadata') => void
}

export default function RightSidebar({
  noteId,
  note,
  commentsByLine,
  selectedLine,
  onLineSelect,
  currentUserId,
  noteOwnerId,
  content,
  showAllComments = false,
  activeTab: controlledActiveTab,
  onTabChange,
}: RightSidebarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<'comments' | 'ai' | 'metadata'>('comments')
  
  // Use controlled tab if provided, otherwise use internal state
  const activeTab = controlledActiveTab ?? internalActiveTab
  const setActiveTab = onTabChange ?? setInternalActiveTab

  // Auto-switch to comments tab when a line is selected
  useEffect(() => {
    if (selectedLine !== null && activeTab !== 'comments') {
      setActiveTab('comments')
    }
  }, [selectedLine, activeTab, setActiveTab])

  return (
    <aside className="w-full h-full bg-base-200 border border-base-300 rounded-lg flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-[400px] max-h-[80vh]">
        {activeTab === 'comments' && (
          <InlineCommentsPanel
            noteId={noteId}
            commentsByLine={commentsByLine}
            selectedLine={selectedLine}
            onLineSelect={onLineSelect}
            currentUserId={currentUserId}
            noteOwnerId={noteOwnerId}
            content={content}
            showAllComments={showAllComments}
          />
        )}
        {activeTab === 'ai' && <AIChatPanel noteId={noteId} />}
        {activeTab === 'metadata' && (
          note ? (
            <NoteMetadataPanel note={note} content={content} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-sm text-base-content/50">Note not available</p>
            </div>
          )
        )}
      </div>
    </aside>
  )
}

