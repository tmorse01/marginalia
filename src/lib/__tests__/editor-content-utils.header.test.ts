/**
 * Test expectations for header editing behavior
 * 
 * EXPECTATIONS:
 * 
 * 1. RENDERING (when focused):
 *    - Header line "# Header Text" should render as:
 *      <h1>
 *        <span class="editor-syntax-marker"># </span>
 *        Header Text
 *      </h1>
 *    - The prefix "# " should be visible but in a syntax marker span
 *    - The content "Header Text" should be editable
 *    - For h2: "## ", h3: "### ", etc.
 * 
 * 2. RENDERING (when unfocused):
 *    - Header line "# Header Text" should render as:
 *      <h1>Header Text</h1>
 *    - No syntax marker visible
 *    - Just the formatted header
 * 
 * 3. EXTRACTION (from DOM to markdown):
 *    - When extracting from focused header DOM, should:
 *      - Skip the syntax marker span (class="editor-syntax-marker")
 *      - Extract only the content text
 *      - Add the appropriate header prefix based on the h1-h6 tag
 *      - Return: "# Header Text" (for h1)
 *    - Should NOT duplicate the prefix
 *    - Should handle nested formatting (bold, italic, etc. in headers)
 * 
 * 4. EDITING BEHAVIOR:
 *    - User can click after the "# " prefix and type
 *    - Typing "T" in "# " should result in "# T" (not "# # T")
 *    - Backspace at the start of content should not delete the prefix
 *    - Cursor positioning should account for the prefix offset
 * 
 * 5. CURSOR POSITIONING:
 *    - Raw column 0 = start of "# " prefix
 *    - Raw column 2 = after "# " prefix, start of content
 *    - When focused, rendered offset 0 = start of "# " (visible)
 *    - When focused, rendered offset 2 = after "# ", start of content
 *    - When unfocused, rendered offset 0 = start of content (prefix not visible)
 * 
 * 6. MULTI-LEVEL HEADERS:
 *    - h1: "# " (2 chars)
 *    - h2: "## " (3 chars)
 *    - h3: "### " (4 chars)
 *    - h4: "#### " (5 chars)
 *    - h5: "##### " (6 chars)
 *    - h6: "###### " (7 chars)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { extractTextFromRenderedLine } from '../editor-content-utils'

describe('Header Editing - extractTextFromRenderedLine', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('H1 Headers', () => {
    it('should extract h1 header with prefix when syntax marker is present', () => {
      // Simulate focused header: <h1><span class="editor-syntax-marker"># </span>Header Text</h1>
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          Header Text
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('# Header Text')
    })

    it('should extract h1 header without duplicating prefix', () => {
      // Even if content somehow includes "# ", it should not duplicate
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          # Header Text
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      // Should be "# # Header Text" (content has #, prefix adds #)
      expect(result).toBe('# # Header Text')
    })

    it('should extract h1 header with formatted content (bold)', () => {
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          <strong>Bold</strong> Text
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('# **Bold** Text')
    })

    it('should extract h1 header when unfocused (no syntax marker)', () => {
      // Unfocused: <h1>Header Text</h1>
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          Header Text
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('# Header Text')
    })

    it('should handle empty h1 header', () => {
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('# ')
    })
  })

  describe('H2-H6 Headers', () => {
    it('should extract h2 header with ## prefix', () => {
      container.innerHTML = `
        <h2 class="editor-header editor-header-2">
          <span class="editor-syntax-marker">## </span>
          Header 2
        </h2>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('## Header 2')
    })

    it('should extract h3 header with ### prefix', () => {
      container.innerHTML = `
        <h3 class="editor-header editor-header-3">
          <span class="editor-syntax-marker">### </span>
          Header 3
        </h3>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('### Header 3')
    })

    it('should extract h6 header with ###### prefix', () => {
      container.innerHTML = `
        <h6 class="editor-header editor-header-6">
          <span class="editor-syntax-marker">###### </span>
          Header 6
        </h6>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('###### Header 6')
    })
  })

  describe('Edge Cases', () => {
    it('should handle header with only whitespace', () => {
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          &nbsp;&nbsp;
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result.trim()).toBe('#')
    })

    it('should handle header with nested formatting', () => {
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          <strong>Bold</strong> and <em>italic</em> text
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('# **Bold** and *italic* text')
    })

    it('should handle header with links', () => {
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          <a href="https://example.com">Link</a>
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('# [Link](https://example.com)')
    })

    it('should skip multiple syntax markers correctly', () => {
      // Should only use the one from the h1 element, not any nested ones
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          <span class="editor-syntax-marker"># </span>
          Content
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      // Should extract as "# Content" (nested marker skipped, prefix added once)
      expect(result).toBe('# Content')
    })
  })

  describe('Editing Scenarios', () => {
    it('should extract correctly after typing a character', () => {
      // User types "T" after "# "
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          T
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('# T')
    })

    it('should extract correctly after typing multiple characters', () => {
      // User types "Test" after "# "
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          Test
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      expect(result).toBe('# Test')
    })

    it('should NOT duplicate prefix when user types "#" in content', () => {
      // User types "# Test" after "# " prefix
      // The prefix should not be duplicated
      container.innerHTML = `
        <h1 class="editor-header editor-header-1">
          <span class="editor-syntax-marker"># </span>
          # Test
        </h1>
      `
      
      const result = extractTextFromRenderedLine(container)
      // Should be "# # Test" (one from prefix, one from content)
      expect(result).toBe('# # Test')
    })
  })
})
