import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { HelpCircle } from 'lucide-react'
import NoteEditor from '../../components/NoteEditor'
import CommentableContent from '../../components/CommentableContent'
import GeneralComments from '../../components/GeneralComments'
import ShareDialog from '../../components/ShareDialog'
import ActivityLog from '../../components/ActivityLog'
import LiveCursorOverlay from '../../components/LiveCursorOverlay'
import RightSidebar from '../../components/RightSidebar'
import NotePageHeader from '../../components/NotePageHeader'
import MarkdownCheatSheetModal from '../../components/MarkdownCheatSheetModal'
import { useTestUser } from '../../lib/useTestUser'
import { useNotePresence } from '../../lib/presence'

export const Route = createFileRoute('/notes/$noteId')({
  component: NotePage,
  // Disable SSR for this route to avoid CodeMirror import issues
  ssr: false,
})

function NotePage() {
  const { noteId } = Route.useParams()
  const navigate = useNavigate()
  const note = useQuery(api.notes.get, { noteId: noteId as any })
  const updateNote = useMutation(api.notes.update)
  const currentUserId = useTestUser()
  const activeUsers = useQuery(api.presence.getActiveUsers, { noteId: noteId as any })
  const allComments = useQuery(api.comments.listByNote, { noteId: noteId as any })
  
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const [cursorStart, setCursorStart] = useState<number | undefined>(undefined)
  const [cursorEnd, setCursorEnd] = useState<number | undefined>(undefined)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState<'comments' | 'ai' | 'metadata'>('comments')
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  // Extract line comments and general comments from API response
  const lineComments = allComments?.byLine ?? {}
  const generalComments = allComments?.general ?? []

  // Update local state when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  // Real-time sync: Update local state when note changes from other users
  useEffect(() => {
    if (note && !isEditing) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note, isEditing])

  // Debounced save for content (only when editing)
  useEffect(() => {
    if (!isEditing || !note) return

    const timeoutId = setTimeout(() => {
      if (content !== note.content) {
        updateNote({
          noteId: noteId as any,
          content: content !== note.content ? content : undefined,
        })
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [content, isEditing, note, noteId, updateNote])

  // Debounced save for title
  useEffect(() => {
    if (!note) return

    const timeoutId = setTimeout(() => {
      if (title !== note.title) {
        updateNote({
          noteId: noteId as any,
          title: title !== note.title ? title : undefined,
        })
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [title, note, noteId, updateNote])

  useNotePresence({
    noteId: noteId as any,
    userId: currentUserId ?? null,
    mode: isEditing ? 'editing' : 'viewing',
    cursorStart: isEditing ? cursorStart : undefined,
    cursorEnd: isEditing ? cursorEnd : undefined,
  })

  if (note === undefined || currentUserId === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (note === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Note not found or you don't have permission to view it</span>
        </div>
        <button
          onClick={() => navigate({ to: '/' })}
          className="btn btn-primary mt-4"
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <div className="w-full">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl px-2 sm:px-4 lg:px-6">
          <NotePageHeader
            note={note}
            isEditing={isEditing}
            onEditToggle={() => {
              setIsEditing(!isEditing)
            }}
            showSidebar={showSidebar}
            activeTab={activeTab}
            onCommentsClick={() => {
              if (showSidebar && activeTab === 'comments') {
                setShowSidebar(false)
              } else {
                setShowSidebar(true)
                setActiveTab('comments')
              }
            }}
            onAIChatClick={() => {
              if (showSidebar && activeTab === 'ai') {
                setShowSidebar(false)
              } else {
                setShowSidebar(true)
                setActiveTab('ai')
              }
            }}
            onMetadataClick={() => {
              if (showSidebar && activeTab === 'metadata') {
                setShowSidebar(false)
              } else {
                setShowSidebar(true)
                setActiveTab('metadata')
              }
            }}
            onShareClick={() => setShowShareDialog(true)}
            onTitleChange={setTitle}
            noteId={noteId as any}
            currentUserId={currentUserId}
            activeUsers={activeUsers ?? undefined}
          />
        </div>
      </div>

      {/* Main Content with Right Sidebar */}
      <div className="flex gap-4 w-full">
        {/* Main Content Area - fixed width to prevent layout shift */}
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl px-2 py-4 sm:px-4 sm:py-8 lg:px-6 w-full">
          <div className="card bg-base-100 border-2 border-base-300 shadow-2xl rounded-2xl overflow-hidden w-full">
            {/* Content Section */}
            <div className="card-body p-3 sm:p-6 w-full">
              {isEditing ? (
                <>
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={() => setShowCheatSheet(true)}
                      className="btn btn-sm btn-ghost tooltip tooltip-bottom"
                      data-tip="Markdown Cheat Sheet"
                    >
                      <HelpCircle size={18} />
                      <span className="hidden sm:inline ml-2">Markdown Help</span>
                    </button>
                  </div>
                  <NoteEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Start writing in Markdown..."
                    onCursorChange={(start, end) => {
                      setCursorStart(start)
                      setCursorEnd(end)
                    }}
                    suggestedContent={aiSuggestion || undefined}
                    onApplySuggestion={() => {
                      if (aiSuggestion) {
                        setContent(aiSuggestion)
                        setAiSuggestion(null)
                        setTimeout(() => {
                          updateNote({
                            noteId: noteId as any,
                            content: aiSuggestion,
                          })
                        }, 100)
                      }
                    }}
                    onDismissSuggestion={() => {
                      setAiSuggestion(null)
                    }}
                  />
                </>
              ) : (
                <>
                  <LiveCursorOverlay
                    content={content}
                    entries={activeUsers ?? []}
                    currentUserId={currentUserId}
                  />
                  <CommentableContent
                    content={content}
                    noteId={noteId as any}
                    commentsByLine={lineComments}
                    currentUserId={currentUserId}
                    noteOwnerId={note.ownerId}
                    selectedLine={selectedLine}
                    onLineSelect={setSelectedLine}
                    onOpenComments={() => {
                      if (!showSidebar) {
                        setShowSidebar(true)
                        setActiveTab('comments')
                      }
                    }}
                  />
                </>
              )}

              {!isEditing && (
                <div id="comments-section" className="mt-6">
                  <GeneralComments
                    noteId={noteId as any}
                    threads={generalComments}
                    currentUserId={currentUserId}
                    noteOwnerId={note.ownerId}
                  />
                  <ActivityLog noteId={noteId as any} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - scrolls with content */}
        {showSidebar && (
          <div className="w-80 shrink-0 px-4 py-4">
            <RightSidebar
              noteId={noteId as any}
              note={note}
              commentsByLine={lineComments as any}
              selectedLine={selectedLine}
              onLineSelect={setSelectedLine}
              currentUserId={currentUserId}
              noteOwnerId={note.ownerId}
              content={content}
              showAllComments={true}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onApplyAISuggestion={(suggestion) => {
                // Set suggestion to show inline diff in editor
                setAiSuggestion(suggestion)
              }}
            />
          </div>
        )}
      </div>

      <ShareDialog
        noteId={noteId as any}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
      <MarkdownCheatSheetModal
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
      />
    </div>
  )
}
