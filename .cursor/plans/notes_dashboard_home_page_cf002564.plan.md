# Notes Dashboard Home Page

## Overview

Transform the home page (`src/routes/index.tsx`) from a simple placeholder into a functional notes dashboard that provides users with an overview of all their notes (owned and shared), with filtering, sorting, quick access to create new notes, and a stats overview section.

## Current State

The home page currently:
- Shows a landing page for first-time users (no notes)
- Shows a simple text message for users with notes, directing them to use the file tree
- Does not display any actual notes or provide dashboard functionality

## Design Goals

Following the app's principles from `docs/real-time-shared-notes-copilot-handoff.md`:
- **Calm & Focused**: No feeds, no algorithms, minimal chrome
- **Markdown-first**: Notes are the primary focus
- **Opinionated > Flexible**: Simple defaults, few settings
- **Visual consistency**: Match the folder view card design pattern

## Implementation Plan

### 1. Dashboard Layout Structure

**File**: `src/routes/index.tsx`

Create a dashboard with:
- **Stats section**: Overview statistics using DaisyUI stat components
- **Header section**: Title, "New Note" button, view toggle (grid/list - optional for future)
- **Filter/Sort bar**: Filter by folder, sort by date/name, search
- **Notes grid**: Responsive grid layout (similar to folder view)
- **Empty state**: Helpful message when no notes match filters

### 2. Stats Section

**File**: `src/routes/index.tsx`

Add a stats overview at the top using DaisyUI's `stats` component. Display 2-4 relevant metrics:

**Suggested Stats:**
- **Total Notes**: Count of all notes (owned + shared)
- **Recently Updated**: Count of notes updated in the last 7 days
- **Shared Notes**: Count of notes shared with others (visibility: "shared" or "public", or notes where user has permissions but isn't owner)
- **This Week**: Count of notes created in the last 7 days

**Implementation:**
- Use `stats stats-horizontal shadow` for horizontal layout
- Calculate stats from the `notes` array using `useMemo`
- Use appropriate icons from `lucide-react` (FileText, Clock, Users, Plus)
- Make stats responsive: `stats-vertical lg:stats-horizontal` for mobile/desktop

**Example Structure:**
```tsx
<div className="stats stats-vertical lg:stats-horizontal shadow mb-6">
  <div className="stat">
    <div className="stat-figure text-primary">
      <FileText size={24} />
    </div>
    <div className="stat-title">Total Notes</div>
    <div className="stat-value text-primary">{totalNotes}</div>
    <div className="stat-desc">All your notes</div>
  </div>
  <div className="stat">
    <div className="stat-figure text-secondary">
      <Clock size={24} />
    </div>
    <div className="stat-title">Recently Updated</div>
    <div className="stat-value text-secondary">{recentlyUpdated}</div>
    <div className="stat-desc">Last 7 days</div>
  </div>
</div>
```

### 3. Note Card Component

**File**: `src/components/NoteCard.tsx` (new)

Create a reusable note card component that displays:
- Note title (with fallback to "Untitled")
- Content preview (first 100-150 chars, markdown stripped)
- Last updated date (relative time preferred, e.g., "2 hours ago")
- Folder indicator (if in a folder)
- Visibility badge (private/shared/public)
- Owner/contributor indicator (if shared)
- Hover effects matching folder view cards

**Design**: Match the card style from `src/routes/folders/$folderId.tsx` (lines 132-154)

### 4. Filtering & Sorting

**File**: `src/routes/index.tsx`

Add client-side filtering and sorting:
- **Filter by folder**: Dropdown to show "All folders" or specific folder
- **Sort options**: 
  - Recently updated (default)
  - Recently created
  - Alphabetical (A-Z)
  - Reverse alphabetical (Z-A)
- **Search**: Filter notes by title/content (client-side for MVP)
- **Filter by visibility**: Optional - show all, private only, shared only

### 5. Data Fetching

**File**: `src/routes/index.tsx`

Use existing query:
- `api.notes.listUserNotes` - already fetches all notes user has access to (owned + shared)
- Fetch folders for filter dropdown: `api.folders.list`
- Optionally fetch recent activity for "recently active" sorting

### 6. Empty States

Handle multiple empty states:
- **No notes at all**: Show landing page (current behavior)
- **No notes match filters**: Show message with option to clear filters
- **Loading state**: Show spinner while fetching

### 7. Responsive Design

- **Mobile**: Single column grid, vertical stats
- **Tablet**: 2 columns, horizontal stats
- **Desktop**: 3-4 columns (match folder view: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), horizontal stats

### 8. Quick Actions

Add quick actions to note cards (optional, can be hover-only):
- Click card: Navigate to note
- Context menu (future): Duplicate, move, delete
- Keyboard shortcuts (future): Create note with `Ctrl+N` or `Cmd+N`

## File Changes

### New Files
- `src/components/NoteCard.tsx` - Reusable note card component

### Modified Files
- `src/routes/index.tsx` - Complete dashboard implementation with stats section

### Potentially Modified Files
- `src/components/FileTree.tsx` - May need to ensure consistency with dashboard
- `convex/notes.ts` - May need additional query for dashboard-specific data (if needed)

## Implementation Details

### Stats Calculation

Calculate stats in `useMemo` hooks for performance:

```typescript
const stats = useMemo(() => {
  if (!notes) return null
  
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  
  const recentlyUpdated = notes.filter(n => n.updatedAt >= sevenDaysAgo).length
  const thisWeek = notes.filter(n => n.createdAt >= sevenDaysAgo).length
  const sharedNotes = notes.filter(n => 
    n.visibility === 'shared' || 
    n.visibility === 'public' || 
    (n.ownerId !== userId && notes.some(/* has permissions */))
  ).length
  
  return {
    total: notes.length,
    recentlyUpdated,
    thisWeek,
    shared: sharedNotes
  }
}, [notes, userId])
```

### NoteCard Component Props
```typescript
interface NoteCardProps {
  note: {
    _id: Id<'notes'>
    title: string
    content: string
    updatedAt: number
    createdAt: number
    folderId?: Id<'folders'>
    visibility: 'private' | 'shared' | 'public'
    ownerId: Id<'users'>
  }
  folderName?: string // Optional folder name for display
  ownerName?: string // Optional owner name for display
}
```

### Dashboard State Management
- Use React state for filters/sort/search
- Use `useMemo` for filtered/sorted notes and stats
- Use `useQuery` for data fetching

### Styling
- Use existing DaisyUI classes
- Match folder view card styling
- Use `brand-primary` for accents
- Maintain consistent spacing and hover effects
- Stats: Use `shadow` class for elevation, `text-primary`/`text-secondary` for color accents

## Acceptance Criteria

This feature is complete when ALL of the following are true:

1. ✅ `pnpm typecheck` passes with exit code 0
2. ✅ `pnpm lint` passes with exit code 0
3. ✅ All existing unit tests pass (`pnpm test`)
4. ✅ Dashboard displays stats section with 2-4 relevant metrics
5. ✅ Stats are calculated correctly from notes data
6. ✅ Stats layout is responsive (vertical on mobile, horizontal on desktop)
7. ✅ Dashboard displays all user notes in a responsive grid
8. ✅ Filtering by folder works correctly
9. ✅ Sorting by date/name works correctly
10. ✅ Search filters notes by title/content
11. ✅ Note cards are clickable and navigate to note page
12. ✅ Empty states are handled gracefully
13. ✅ Loading states show spinners
14. ✅ Dashboard matches folder view visual style
15. ✅ Feature works in browser without console errors

## Implementation Approach

This feature will use the **Ralph Wiggum Iterative Approach**:

1. Implement the feature according to the plan
2. Run validation checks:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - Manual browser testing
3. Fix any issues found
4. Repeat steps 2-3 until ALL checks pass
5. Only mark complete when all acceptance criteria are met

## Future Enhancements (Out of Scope)

- List view option (alternative to grid)
- Drag-and-drop reordering
- Bulk actions (select multiple notes)
- Recent activity timeline
- Note statistics (word count, last edited by, etc.)
- Advanced search with filters
- Saved filter presets
- More detailed stats (notes by folder, notes by visibility, etc.)
