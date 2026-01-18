---
name: Margin Interactions - True Marginalia
overview: "Add authentic marginalia features to document margins: personal annotations, emoji reactions, highlights, bookmarks, and creative doodles/diagrams. Focus on personalization, memory, understanding, and creative expression - the true essence of marginalia."
todos:
  - id: schema-updates
    content: Add reactions, highlights, bookmarks, and marginAnnotations tables to convex/schema.ts
    status: pending
  - id: reactions-backend
    content: Create convex/reactions.ts with add, remove, getByLine, and getByNote functions
    status: pending
  - id: highlights-backend
    content: Create convex/highlights.ts with add, remove, getByLine, and getByNote functions
    status: pending
  - id: bookmarks-backend
    content: Create convex/bookmarks.ts with add, remove, getByNote, and getByUser functions
    status: pending
  - id: margin-annotations-backend
    content: Create convex/marginAnnotations.ts for personal notes, doodles, and diagrams
    status: pending
  - id: margin-reactions-ui
    content: Create src/components/MarginReactions.tsx with emoji picker and reaction display
    status: pending
  - id: margin-highlights-ui
    content: Create src/components/MarginHighlights.tsx with color picker and highlight bars
    status: pending
  - id: margin-bookmarks-ui
    content: Create src/components/MarginBookmarks.tsx with bookmark toggle indicator
    status: pending
  - id: margin-annotations-ui
    content: Create src/components/MarginAnnotations.tsx for personal notes and quick thoughts
    status: pending
  - id: margin-doodles-ui
    content: Create src/components/MarginDoodles.tsx with simple drawing canvas for creative expression
    status: pending
  - id: commentable-content-update
    content: Update CommentableContent.tsx to include left and right margin containers
    status: pending
  - id: note-page-integration
    content: Update $noteId.tsx to fetch and pass all margin interaction data
    status: pending
  - id: margin-styling
    content: Add margin container, reaction picker, highlight, bookmark, annotation, and doodle styles to styles.css
    status: pending
---

# Margin Interactions - True Marginalia Plan

## Overview

Add authentic marginalia features that capture the essence of personal annotation: **personalization** (personal thoughts and reactions), **interaction** (close reading), **memory** (writing down reactions), **understanding** (conversation with the text), and **creativity** (doodles, diagrams, embellishments). This goes beyond social features to enable true personal expression in the margins.

## Architecture

### Data Model Changes

**New Convex Tables:**

1. **`reactions` table** (`convex/schema.ts`)

   - `noteId: Id<"notes">`
   - `lineNumber: number` (0-indexed)
   - `userId: Id<"users">`
   - `emoji: string` (single emoji character)
   - `createdAt: number`
   - Indexes: `by_note_and_line`, `by_note_and_user`

2. **`highlights` table** (`convex/schema.ts`)

   - `noteId: Id<"notes">`
   - `lineNumber: number`
   - `userId: Id<"users">`
   - `color: string` (hex color code, e.g., "#FFEB3B")
   - `createdAt: number`
   - Indexes: `by_note_and_line`, `by_note_and_user`

3. **`bookmarks` table** (`convex/schema.ts`)

   - `noteId: Id<"notes">`
   - `lineNumber: number`
   - `userId: Id<"users">`
   - `label: v.optional(v.string())` (optional custom label)
   - `createdAt: number`
   - Indexes: `by_note_and_line`, `by_note_and_user`, `by_user`

4. **`marginAnnotations` table** (`convex/schema.ts`)

   - `noteId: Id<"notes">`
   - `lineNumber: number`
   - `userId: Id<"users">`
   - `type: v.union(v.literal("note"), v.literal("doodle"), v.literal("diagram"))`
   - `content: v.string` (text for notes, SVG/path data for doodles/diagrams)
   - `isPrivate: v.boolean` (personal vs shared annotations)
   - `createdAt: number`
   - `updatedAt: number`
   - Indexes: `by_note_and_line`, `by_note_and_user`, `by_user`

### Backend Functions

**New Convex files:**

1. **`convex/reactions.ts`**

   - `add`: Add or toggle emoji reaction to a line
   - `remove`: Remove a specific reaction
   - `getByLine`: Get all reactions for a specific line
   - `getByNote`: Get all reactions for a note (grouped by line)

2. **`convex/highlights.ts`**

   - `add`: Add or toggle highlight on a line
   - `remove`: Remove highlight
   - `getByLine`: Get all highlights for a line
   - `getByNote`: Get all highlights for a note (grouped by line)

3. **`convex/bookmarks.ts`**

   - `add`: Add bookmark to a line
   - `remove`: Remove bookmark
   - `getByNote`: Get all bookmarks for a note (grouped by line)
   - `getByUser`: Get all bookmarks for a user (across all notes)

4. **`convex/marginAnnotations.ts`**

   - `create`: Create personal annotation (note, doodle, or diagram)
   - `update`: Update annotation content
   - `remove`: Remove annotation
   - `getByLine`: Get all annotations for a line (filtered by privacy)
   - `getByNote`: Get all annotations for a note (filtered by privacy)
   - `getByUser`: Get user's personal annotations (including private ones)

### UI Components

**Left Margin (New):**

1. **`src/components/MarginReactions.tsx`**

   - Shows emoji reaction picker on hover
   - Displays existing reactions with counts
   - Click to add/remove your reaction
   - Positioned on the left side of each line

2. **`src/components/MarginHighlights.tsx`**

   - Shows highlight color picker on hover
   - Displays existing highlights as colored bars
   - Click to add/remove highlight
   - Stacked highlights show multiple users' colors

**Right Margin (Enhanced):**

3. **`src/components/MarginBookmarks.tsx`**

   - Bookmark icon indicator (star/bookmark icon)
   - Shows on hover, persists when bookmarked
   - Positioned near comment indicators but distinct
   - Click to toggle bookmark

4. **`src/components/MarginAnnotations.tsx`**

   - Personal notes/thoughts in margins
   - Quick text input on hover/click
   - Toggle privacy (personal vs shared)
   - Small note icon indicator when annotation exists
   - Expandable to show full note on click

5. **`src/components/MarginDoodles.tsx`**

   - Simple drawing canvas for doodles and diagrams
   - Opens on click, small preview icon when doodle exists
   - SVG-based drawing (lightweight)
   - Save as personal or shared
   - Supports simple shapes and freehand drawing

**Integration:**

4. **Update `src/components/CommentableContent.tsx`**

   - Add left margin container for reactions and highlights
   - Keep right margin for comments and bookmarks
   - Adjust layout to accommodate both margins

5. **Update `src/routes/notes/$noteId.tsx`**

   - Fetch reactions, highlights, and bookmarks data
   - Pass data to CommentableContent component

### Styling Updates

**`src/styles.css`:**

- Add `.margin-left` and `.margin-right` container styles
- Add `.reaction-picker` styles for emoji picker popover
- Add `.highlight-indicator` styles for colored highlight bars
- Add `.bookmark-indicator` styles
- Ensure margins don't interfere with existing comment indicators

## Implementation Details

### Emoji Reactions (Personal Expression)

- **Location**: Left margin, aligned with each line
- **Purpose**: Quick personal reactions to text (memory, understanding)
- **UI**: Small emoji picker on hover (6-8 common emojis: 👍 ❤️ 😂 🎉 🤔 💡 ✨ 📝)
- **Display**: Show existing reactions as small emoji badges with count
- **Interaction**: Click emoji to toggle your reaction, click existing reaction to remove yours
- **Real-time**: Updates via Convex subscriptions
- **Personalization**: Each user's reactions are personal markers of engagement

### Highlights (Memory & Understanding)

- **Location**: Left margin, below reactions
- **Purpose**: Mark important passages for memory and understanding
- **UI**: Color picker on hover (4-5 preset colors: yellow, green, blue, pink, orange)
- **Display**: Colored vertical bar showing all highlights on that line
- **Interaction**: Click color to toggle highlight, click existing highlight to remove
- **Visual**: Stacked highlights show as multi-colored bar or gradient
- **Personalization**: Each user can have their own color-coded system

### Bookmarks (Memory & Reference)

- **Location**: Right margin, above comment indicators
- **Purpose**: Mark lines for later reference (memory aid)
- **UI**: Bookmark icon (star or bookmark) that appears on hover
- **Display**: Filled icon when bookmarked, outline when not
- **Interaction**: Click to toggle bookmark
- **Optional**: Right-click for custom label/note
- **Personalization**: Each user's bookmarks are personal reference points

### Personal Annotations (Close Reading & Understanding)

- **Location**: Left margin, below highlights
- **Purpose**: Personal notes, thoughts, questions - "conversation with the text"
- **UI**: Small note icon appears on hover/click
- **Display**: Expandable note card showing personal thoughts
- **Interaction**: Click to add/edit personal note, toggle privacy (personal vs shared)
- **Features**: 
  - Quick text input for thoughts and reactions
  - Mark as private (personal) or shared (collaborative)
  - Small indicator when annotation exists
  - Expand to read full note
- **Personalization**: Core to making the text meaningful to the reader

### Doodles & Diagrams (Creativity & Inspiration)

- **Location**: Left margin, below annotations
- **Purpose**: Creative expression triggered by the text (doodles, diagrams, embellishments)
- **UI**: Small drawing icon appears on hover/click
- **Display**: Opens simple drawing canvas, shows preview icon when doodle exists
- **Interaction**: Click to open drawing tool, save as personal or shared
- **Features**:
  - SVG-based lightweight drawing canvas
  - Simple shapes (circles, rectangles, lines) and freehand drawing
  - Color picker for creative expression
  - Save as private doodle or shared diagram
  - Small preview thumbnail in margin
- **Creativity**: Enables visual expression and diagramming of concepts

## Data Flow

```
User hovers line
  ↓
Margin indicators appear (reactions, highlights, bookmarks, annotations, doodles)
  ↓
User clicks interaction
  ↓
Convex mutation updates database
  ↓
Real-time subscription updates all clients (respecting privacy)
  ↓
UI reflects changes immediately
  ↓
Personal annotations/doodles: Only visible to creator if private
  Shared annotations/doodles: Visible to all with note access
```

### Privacy Model

- **Reactions, Highlights, Bookmarks**: Always visible to all users with note access (social features)
- **Annotations**: Can be private (personal) or shared (collaborative)
- **Doodles/Diagrams**: Can be private (personal creative expression) or shared (collaborative diagrams)

## Files to Create/Modify

**New Files:**

- `convex/reactions.ts`
- `convex/highlights.ts`
- `convex/bookmarks.ts`
- `convex/marginAnnotations.ts`
- `src/components/MarginReactions.tsx`
- `src/components/MarginHighlights.tsx`
- `src/components/MarginBookmarks.tsx`
- `src/components/MarginAnnotations.tsx`
- `src/components/MarginDoodles.tsx`

**Modified Files:**

- `convex/schema.ts` - Add new tables
- `src/components/CommentableContent.tsx` - Add margin containers
- `src/routes/notes/$noteId.tsx` - Fetch and pass margin data
- `src/styles.css` - Add margin styling

## Considerations

1. **Performance**: All margin interactions should be lightweight queries, possibly cached. Doodles/diagrams stored as SVG strings (compressed)
2. **Permissions**: Respect note permissions. Personal annotations/doodles can be private even on shared notes
3. **Mobile**: Margins may need to collapse or move to overlay on mobile. Drawing may need touch-optimized interface
4. **Accessibility**: Keyboard navigation and screen reader support for all margin interactions
5. **Visual Hierarchy**: Ensure margins don't overwhelm the content. Use progressive disclosure (hover to reveal)
6. **Real-time Updates**: Use Convex subscriptions for live updates when others interact (respecting privacy settings)
7. **Privacy**: Personal annotations and doodles can be private (only visible to creator) or shared (visible to all with note access)
8. **Storage**: Doodles/diagrams stored as SVG paths (efficient). Consider compression for large drawings
9. **User Experience**: Margins should feel like natural extension of reading, not intrusive UI elements

## Philosophy Alignment

This implementation aligns with the true purpose of marginalia:

- **Personalization**: Each user's reactions, highlights, bookmarks, annotations, and doodles make the text meaningful to them
- **Interaction**: Close reading through annotations, questions, and thoughts
- **Memory**: Bookmarks and highlights help remember important passages
- **Understanding**: Annotations enable "conversation with the author" through questioning and processing ideas
- **Creativity**: Doodles and diagrams allow creative expression triggered by the text

## Future Enhancements (Out of Scope)

- Advanced drawing tools (shapes, text, layers)
- Annotation templates (question format, summary format, etc.)
- Export personal marginalia as a separate document
- Search within personal annotations
- Collaborative annotation threads
- Diagram templates (flowcharts, mind maps)
- Emoji reactions with custom emoji support
- Highlight categories/tags for organization