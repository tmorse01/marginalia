# Header Editing Expectations

This document defines the expected behavior for header editing in the markdown editor.

## Core Principle

Headers should display their markdown syntax prefix (e.g., `# `, `## `) when **focused/editing**, but this prefix should be:
1. **Visible** - User can see the markdown syntax
2. **Non-editable** - User cannot delete or modify the prefix directly
3. **Preserved** - The prefix is maintained in the raw markdown
4. **Not duplicated** - When extracting from DOM, prefix should be added exactly once

## Rendering Behavior

### When Focused (isFocused = true)

**Input:** `# Header Text`

**DOM Structure:**
```html
<h1 class="editor-header editor-header-1">
  <span class="editor-syntax-marker"># </span>
  Header Text
</h1>
```

**Visual:** User sees `# Header Text` where:
- `# ` is in a syntax marker span (styled differently, non-editable)
- `Header Text` is the editable content

### When Unfocused (isFocused = false)

**Input:** `# Header Text`

**DOM Structure:**
```html
<h1 class="editor-header editor-header-1">
  Header Text
</h1>
```

**Visual:** User sees formatted header text only (no syntax marker)

## Extraction Behavior

### From Focused Header DOM → Markdown

**DOM:**
```html
<h1>
  <span class="editor-syntax-marker"># </span>
  Header Text
</h1>
```

**Expected Output:** `# Header Text`

**Rules:**
1. Skip the `<span class="editor-syntax-marker">` element entirely
2. Extract content from the `<h1>` element
3. Add the header prefix based on the tag level (h1 = `# `, h2 = `## `, etc.)
4. **DO NOT** add the prefix if it's already in the extracted content

### From Unfocused Header DOM → Markdown

**DOM:**
```html
<h1>Header Text</h1>
```

**Expected Output:** `# Header Text`

**Rules:**
1. Extract content from the `<h1>` element
2. Add the header prefix based on the tag level

## Editing Scenarios

### Scenario 1: Typing a Character

**Initial State:** `# ` (empty header, just prefix)

**User Action:** Types "T"

**Expected Result:** `# T`

**DOM After:**
```html
<h1>
  <span class="editor-syntax-marker"># </span>
  T
</h1>
```

**Extraction Result:** `# T` ✅

### Scenario 2: Typing Multiple Characters

**Initial State:** `# `

**User Action:** Types "Test"

**Expected Result:** `# Test`

**Extraction Result:** `# Test` ✅

### Scenario 3: User Types "#" in Content

**Initial State:** `# `

**User Action:** Types "# Test"

**Expected Result:** `# # Test`

**Note:** This is correct! The user typed "#" in the content area, so it becomes part of the content. The prefix is separate.

**Extraction Result:** `# # Test` ✅

### Scenario 4: Backspace at Start of Content

**Initial State:** `# Test`

**User Action:** Cursor at position 2 (after `# `), presses Backspace

**Expected Result:** `# est` (deletes 'T', prefix remains)

**Extraction Result:** `# est` ✅

## Cursor Positioning

### Raw Column vs Rendered Offset

**Raw Markdown:** `# Header Text`
- Raw column 0 = start of `#`
- Raw column 1 = after `#`, before space
- Raw column 2 = after `# `, start of "Header"
- Raw column 8 = after "Header", before space
- Raw column 9 = start of "Text"

### When Focused (syntax visible)

**Rendered DOM:** `<h1><span># </span>Header Text</h1>`
- Rendered offset 0 = start of `#` (in syntax marker)
- Rendered offset 1 = after `#`, before space
- Rendered offset 2 = after `# `, start of "Header"
- Rendered offset 8 = after "Header", before space
- Rendered offset 9 = start of "Text"

**Mapping:**
- Raw col 0-1 → Rendered offset 0-1 (prefix)
- Raw col 2+ → Rendered offset 2+ (content, offset by prefix length)

### When Unfocused (syntax hidden)

**Rendered DOM:** `<h1>Header Text</h1>`
- Rendered offset 0 = start of "Header" (prefix not visible)
- Rendered offset 6 = after "Header", before space
- Rendered offset 7 = start of "Text"

**Mapping:**
- Raw col 0-1 → Should not be accessible (prefix not visible)
- Raw col 2+ → Rendered offset (rawCol - prefixLength)

## Header Levels

| Level | Prefix | Prefix Length | Example |
|-------|--------|---------------|---------|
| h1    | `# `   | 2             | `# Header` |
| h2    | `## `  | 3             | `## Header` |
| h3    | `### ` | 4             | `### Header` |
| h4    | `#### ` | 5            | `#### Header` |
| h5    | `##### ` | 6           | `##### Header` |
| h6    | `###### ` | 7          | `###### Header` |

## Test Cases

See `src/lib/__tests__/editor-content-utils.header.test.ts` for comprehensive test cases covering:

1. ✅ Basic extraction (h1-h6)
2. ✅ Extraction with syntax marker present
3. ✅ Extraction without syntax marker (unfocused)
4. ✅ Extraction with formatted content (bold, italic, links)
5. ✅ Edge cases (empty headers, whitespace, nested formatting)
6. ✅ Editing scenarios (typing, backspace)
7. ✅ Prefix duplication prevention

## Implementation Notes

### extractTextFromRenderedLine

The function should:
1. Check if first child is an `<h1>`-`<h6>` element
2. Call `extractFromNode(firstChild)` which:
   - Skips `editor-syntax-marker` elements
   - Extracts content from children
   - Adds header prefix based on tag level
3. Return the result (prefix already added, don't add again!)

**Current Implementation:**
```typescript
if (/^h[1-6]$/.test(tagName)) {
  // extractFromNode already adds the header prefix when processing h1-h6 elements
  // So we just return what it extracts without adding the prefix again
  return extractFromNode(firstChild)
}
```

This is correct! ✅

## Common Bugs to Avoid

1. ❌ **Prefix Duplication**: Adding prefix twice (once in extractFromNode, once in header handler)
2. ❌ **Including Syntax Marker**: Not skipping `editor-syntax-marker` elements
3. ❌ **Wrong Prefix Length**: Using wrong number of `#` for header level
4. ❌ **Cursor Offset Mismatch**: Not accounting for prefix length in cursor positioning
