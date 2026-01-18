---
name: Obsidian-style markdown editor
overview: Build a custom markdown editor from scratch that always renders markdown visually (headers big/bold, bold text bold, etc.) and shows raw syntax markers (##, **, etc.) on the focused line, similar to Obsidian's Live Preview mode.
todos: []
---

# Obsidian-Style Markdown Editor Implementation Plan

## Architecture Overview

The editor will use a **contenteditable-per-line** approach where:

- Each line is a contenteditable div that renders markdown visually
- When a line is focused, syntax markers are inserted/overlaid alongside rendered content
- Cursor position is tracked in rendered content but mapped to raw markdown for editing
- Text changes are captured and converted back to raw markdown

## Core Components

### 1. **NoteEditor.tsx** (Main Editor Component)

- **State Management:**
- `content: string` - Raw markdown content
- `focusedLine: number | null` - Currently focused line index
- `cursorOffset: number` - Current cursor position in raw markdown
- `lines: string[]` - Split content into lines

- **Rendering:**
- Map over lines array, render each as `EditorLine` component
- Container div with proper styling and focus handling
- Handle placeholder when content is empty

- **Event Handlers:**
- `handleLineFocus(lineIndex, cursorCol)` - Set focused line, track cursor
- `handleLineChange(lineIndex, newRawLine)` - Update single line in content
- `handleKeyDown(e)` - Handle Enter (new line), Backspace at line start, etc.
- `handlePaste(e)` - Handle paste events, convert HTML to markdown if needed

### 2. **EditorLine.tsx** (Individual Line Component)

- **Props:**
- `line: string` - Raw markdown line
- `lineIndex: number`
- `isFocused: boolean`
- `cursorCol?: number` - Cursor column in raw markdown
- `onFocus: (lineIndex, col) => void`
- `onChange: (lineIndex, newLine) => void`

- **Rendering Strategy:**
- Parse line using `tokenizeLine()` from `markdown-parser.ts`
- Render tokens visually (headers big, bold text bold, etc.)
- When `isFocused`, insert syntax markers:
- Headers: Show `##` prefix before rendered header text
- Bold: Show `**` before and after rendered bold text
- Italic: Show `*` before and after rendered italic text
- Links: Show [`text`](url) syntax instead of just link
- Lists: Show `- ` or `1. ` prefix
- Blockquotes: Show `> ` prefix
- Use contenteditable div with `contentEditable={true}`

- **Cursor Position Mapping:**
- Track cursor in rendered DOM position
- Map rendered position to raw markdown position using token offsets
- Handle cursor positioning when syntax markers are shown/hidden

- **Event Handlers:**
- `onInput` - Capture text changes, convert to raw markdown
- `onKeyDown` - Handle special keys (Enter, Backspace, etc.)
- `onClick` - Set focus and cursor position
- `onFocus` - Notify parent of focus
- `onBlur` - Notify parent of blur

### 3. **Position Mapping Utilities** (New functions in `cursor-utils.ts`)

- `renderedToRawOffset(line: string, renderedOffset: number, isFocused: boolean): number`
- Maps cursor position in rendered content to raw markdown offset
- Accounts for syntax markers when line is focused

- `rawToRenderedOffset(line: string, rawOffset: number, isFocused: boolean): number`
- Maps raw markdown offset to rendered DOM position
- Accounts for syntax markers when line is focused

- `getTokenAtOffset(tokens: Token[], offset: number): { token: Token, offsetInToken: number }`
- Find which token contains a given offset
- Used for cursor positioning within tokens

### 4. **Content Conversion Utilities** (New file: `editor-content-utils.ts`)

- `extractTextFromRenderedLine(element: HTMLElement): string`
- Extract raw markdown from a rendered contenteditable line
- Walk through DOM nodes, reconstruct markdown syntax

- `insertSyntaxMarkers(line: string, tokens: Token[]): string`
- Insert syntax ma