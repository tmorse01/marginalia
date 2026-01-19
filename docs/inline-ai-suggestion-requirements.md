# Inline AI Suggestion Feature - Requirements Document

## Overview
This document specifies the requirements for the inline AI suggestion feature that allows users to preview and apply AI-generated content suggestions directly within the note editor, similar to VSCode's inline suggestions.

## Current State
- AI chat panel exists and can generate suggestions
- Diff calculation utility exists (`diff-utils.ts`)
- Editor supports displaying diff states (added/removed lines)
- Basic "Show in Editor" button exists but may not be working as expected

## Core Requirements

### 1. Suggestion Display Behavior

#### 1.1 Default Behavior (Edit Mode)
- **When**: When AI generates a response in "Edit Mode"
- **What**: The AI's response should automatically appear as an inline diff in the editor
- **How**: 
  - Calculate diff between current note content and AI suggestion
  - Display removed lines (current content) with red highlighting and `-` prefix
  - Display added lines (AI suggestion) with green highlighting and `+` prefix
  - Show added lines immediately after removed lines as preview/ghost lines
  - Added lines should be non-editable (preview only)
  - User can still edit the original content while preview is visible

#### 1.2 Chat Mode Behavior
- **When**: When AI generates a response in "Chat Mode"
- **What**: AI response stays in chat panel only
- **How**:
  - No automatic diff display in editor
  - "Show in Editor" button appears below AI messages that contain suggestions
  - Clicking "Show in Editor" manually triggers the diff display in the editor
  - Same diff visualization as Edit Mode once triggered

### 2. Mode Toggle

#### 2.1 Toggle Location
- Located in AI Chat Panel header
- Two buttons: "Chat" and "Edit"
- Visual indication of active mode (highlighted/primary color)

#### 2.2 Mode Persistence
- Mode preference should persist across:
  - Page refreshes (localStorage or user preference)
  - Different notes (global preference)
  - Session changes

#### 2.3 Mode Descriptions
- **Chat Mode**: "Conversation only - click 'Show in Editor' to preview suggestions"
- **Edit Mode**: "Suggestions appear in editor automatically"

### 3. Suggestion Detection

#### 3.1 When to Show Suggestions
A message should be considered a "suggestion" if:
- It's from the assistant (role === 'assistant')
- It's substantial (length > 30 characters minimum, preferably > 100)
- It doesn't contain error messages (no "error", "Sorry", etc.)
- It looks like content (has markdown syntax, multiple lines, or substantial length)

#### 3.2 When NOT to Show Suggestions
- Error messages
- Short responses (< 30 chars)
- Conversational responses that aren't content suggestions
- System messages or welcome messages

### 4. Diff Visualization

#### 4.1 Visual Design
- **Removed lines** (current content being replaced):
  - Red background tint (`bg-error/20`)
  - Red left border (`border-l-2 border-error`)
  - Reduced opacity (`opacity-75`)
  - `-` prefix in red
  
- **Added lines** (AI suggestion):
  - Green background tint (`bg-success/20`)
  - Green left border (`border-l-2 border-success`)
  - Normal opacity
  - `+` prefix in green
  - Appears as preview/ghost lines (non-editable)

#### 4.2 Line Positioning
- Added lines appear immediately after the removed line they replace
- Multiple added lines stack vertically after a removed line
- Unchanged lines remain in their original position with no highlighting

#### 4.3 Diff Calculation
- Use line-based diff algorithm (`calculateDiff` from `diff-utils.ts`)
- Compare entire note content (original) vs entire AI suggestion
- Handle edge cases:
  - Empty original content
  - Empty suggestion
  - Identical content (no diff)
  - Completely different content (all removed, all added)

### 5. User Actions

#### 5.1 Apply Suggestion
- **Button**: "Apply All" button appears at bottom of editor when diff is visible
- **Action**: 
  - Replace current note content with suggested content
  - Clear the suggestion state
  - Save changes to backend (debounced)
  - Hide diff visualization
- **Keyboard shortcut**: Consider `Ctrl+Enter` or `Cmd+Enter` (optional)

#### 5.2 Dismiss Suggestion
- **Button**: "Dismiss" button next to "Apply All"
- **Action**:
  - Clear the suggestion state
  - Hide diff visualization
  - Restore original editor view
- **Keyboard shortcut**: `Escape` key (optional)

#### 5.3 Edit During Preview
- User should be able to edit original content while preview is visible
- Editing original content should update the diff calculation
- Changes to original content should be reflected in real-time diff

### 6. State Management

#### 6.1 Suggestion State
- Stored in parent component (`$noteId.tsx`) as `aiSuggestion` state
- Passed to `NoteEditor` as `suggestedContent` prop
- Cleared when:
  - User applies suggestion
  - User dismisses suggestion
  - New suggestion replaces old one

#### 6.2 Editor State
- Editor maintains current content separately from suggestion
- Suggestion is overlay/preview only until applied
- Original content remains editable

### 7. Integration Points

#### 7.1 AI Chat Panel (`AIChatPanel.tsx`)
- Detects if message contains suggestion (`hasSuggestion` function)
- In Edit Mode: Automatically calls `onApplySuggestion` callback
- In Chat Mode: Shows "Show in Editor" button that calls `onApplySuggestion`
- Passes full AI response content as suggestion

#### 7.2 Note Editor (`NoteEditor.tsx`)
- Receives `suggestedContent` prop
- Calculates diff using `calculateDiff`
- Maps diff lines to editor lines
- Renders diff visualization inline
- Shows "Apply All" / "Dismiss" buttons when diff exists

#### 7.3 Editor Line (`EditorLine.tsx`)
- Receives `diffState` prop ('added' | 'removed' | undefined)
- Applies appropriate styling based on diff state
- Shows `+` or `-` prefix
- Prevents editing when `diffState === 'added'` (preview lines)

#### 7.4 Note Page (`$noteId.tsx`)
- Manages `aiSuggestion` state
- Passes `onApplyAISuggestion` callback to `RightSidebar`
- Passes `suggestedContent` to `NoteEditor`
- Handles apply/dismiss callbacks

### 8. Edge Cases & Error Handling

#### 8.1 No Changes Detected
- If diff calculation shows no changes, don't display diff
- Don't show "Apply All" button
- Log warning for debugging

#### 8.2 Large Suggestions
- Handle suggestions that are much larger than original content
- Handle suggestions that are much smaller than original content
- Ensure performance with large diffs (consider virtualization if needed)

#### 8.3 Concurrent Edits
- If user edits content while suggestion is visible, recalculate diff
- If user applies suggestion while editing, merge appropriately
- Handle race conditions with debounced saves

#### 8.4 Multiple Suggestions
- Only one suggestion visible at a time
- New suggestion replaces old one
- User must apply or dismiss before new suggestion appears

### 9. User Experience Flow

#### 9.1 Edit Mode Flow
1. User types message in AI chat
2. AI responds with suggestion
3. Suggestion automatically appears as inline diff in editor
4. User reviews changes (red removed, green added)
5. User clicks "Apply All" or "Dismiss"
6. If applied: content updates, diff disappears
7. If dismissed: diff disappears, original content remains

#### 9.2 Chat Mode Flow
1. User types message in AI chat
2. AI responds with suggestion
3. Suggestion appears only in chat panel
4. "Show in Editor" button appears below message
5. User clicks "Show in Editor"
6. Suggestion appears as inline diff in editor
7. User reviews and applies/dismisses as in Edit Mode

### 10. Performance Requirements

#### 10.1 Diff Calculation
- Should complete in < 100ms for typical note sizes (< 10,000 lines)
- Should not block UI rendering
- Consider debouncing if recalculating on every keystroke

#### 10.2 Rendering
- Should render smoothly without jank
- Consider virtualization for very long notes
- Minimize re-renders when diff state changes

### 11. Accessibility

#### 11.1 Keyboard Navigation
- Tab through "Apply All" and "Dismiss" buttons
- Escape to dismiss suggestion
- Consider keyboard shortcuts for apply

#### 11.2 Screen Readers
- Announce when suggestion appears
- Describe diff changes (X lines removed, Y lines added)
- Label buttons clearly

### 12. Testing Requirements

#### 12.1 Unit Tests
- Test `hasSuggestion` detection logic
- Test diff calculation edge cases
- Test apply/dismiss callbacks

#### 12.2 Integration Tests
- Test Edit Mode auto-display
- Test Chat Mode manual trigger
- Test apply suggestion flow
- Test dismiss suggestion flow

#### 12.3 Visual Tests
- Verify diff colors and styling
- Verify line positioning
- Verify button visibility

## Open Questions / Clarifications Needed

1. **Suggestion Scope**: Should the AI suggestion replace the entire note content, or should it be able to suggest changes to specific sections? (Current implementation replaces entire content)

2. **Partial Application**: Should users be able to apply individual line changes, or only "all or nothing"? (Current implementation is "all or nothing")

3. **Suggestion Persistence**: Should suggestions persist across page refreshes, or clear on refresh? (Current implementation clears on refresh)

4. **Multiple Suggestions**: Can users queue multiple suggestions, or only one at a time? (Current implementation: one at a time)

5. **Undo/Redo**: Should applying a suggestion be undoable? (Current implementation: no explicit undo)

6. **Conflict Resolution**: What happens if user edits content while suggestion is visible, then tries to apply? (Current implementation: applies suggestion, overwriting edits)

7. **Suggestion Format**: Should AI always return full note content, or can it return partial content with instructions? (Current implementation: expects full content)

8. **Mode Default**: Should Edit Mode or Chat Mode be the default? (Current implementation: Edit Mode is default)

## Implementation Notes

### Current Implementation Status
- ✅ Diff calculation utility exists
- ✅ Editor supports diff visualization
- ✅ Mode toggle UI exists
- ✅ Basic apply/dismiss buttons exist
- ⚠️ "Show in Editor" button may not be working correctly
- ⚠️ Auto-display in Edit Mode may not be working correctly
- ⚠️ Suggestion detection may need refinement

### Files Involved
- `src/components/AIChatPanel.tsx` - AI chat interface, mode toggle, suggestion detection
- `src/components/NoteEditor.tsx` - Main editor, diff calculation, apply/dismiss UI
- `src/components/EditorLine.tsx` - Individual line rendering with diff states
- `src/routes/notes/$noteId.tsx` - State management, orchestration
- `src/lib/diff-utils.ts` - Diff calculation algorithm
- `src/components/RightSidebar.tsx` - Passes callbacks between chat and editor

### Next Steps
1. Debug why "Show in Editor" button doesn't work
2. Verify auto-display in Edit Mode works correctly
3. Test edge cases (empty content, large diffs, etc.)
4. Add keyboard shortcuts
5. Add mode persistence
6. Improve suggestion detection accuracy
7. Add loading states during diff calculation
8. Add error handling for diff calculation failures
