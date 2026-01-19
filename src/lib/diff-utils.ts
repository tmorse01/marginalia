/**
 * Simple line-based diff utility
 * Compares two texts and returns added/removed/unchanged lines
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber?: number
}

export interface DiffResult {
  lines: Array<DiffLine>
  hasChanges: boolean
  addedCount: number
  removedCount: number
}

/**
 * Calculate diff between two texts
 * Uses a line-based comparison with better matching
 */
export function calculateDiff(original: string, suggested: string): DiffResult {
  const originalLines = original.split('\n')
  const suggestedLines = suggested.split('\n')
  
  const diff: Array<DiffLine> = []
  let addedCount = 0
  let removedCount = 0
  
  // Use a simple longest common subsequence approach
  // Match lines that are identical, then mark others as added/removed
  let origIndex = 0
  let suggIndex = 0
  let lineNumber = 1
  
  while (origIndex < originalLines.length || suggIndex < suggestedLines.length) {
    const origLine = originalLines[origIndex]
    const suggLine = suggestedLines[suggIndex]
    
    if (origIndex >= originalLines.length) {
      // Only suggested lines remain - all added
      diff.push({ type: 'added', content: suggLine, lineNumber })
      addedCount++
      suggIndex++
      lineNumber++
    } else if (suggIndex >= suggestedLines.length) {
      // Only original lines remain - all removed
      diff.push({ type: 'removed', content: origLine, lineNumber })
      removedCount++
      origIndex++
      lineNumber++
    } else if (origLine === suggLine) {
      // Lines match - unchanged
      diff.push({ type: 'unchanged', content: origLine, lineNumber })
      origIndex++
      suggIndex++
      lineNumber++
    } else {
      // Lines don't match - check if we can find a match ahead
      let foundMatch = false
      const lookAhead = 5 // Look ahead up to 5 lines
      
      // Look ahead in suggested for a match
      for (let i = 1; i <= lookAhead && suggIndex + i < suggestedLines.length; i++) {
        if (originalLines[origIndex] === suggestedLines[suggIndex + i]) {
          // Found match ahead - mark intermediate lines as added
          for (let j = 0; j < i; j++) {
            diff.push({ type: 'added', content: suggestedLines[suggIndex + j], lineNumber })
            addedCount++
            lineNumber++
          }
          suggIndex += i
          foundMatch = true
          break
        }
      }
      
      // Look ahead in original for a match
      if (!foundMatch) {
        for (let i = 1; i <= lookAhead && origIndex + i < originalLines.length; i++) {
          if (originalLines[origIndex + i] === suggestedLines[suggIndex]) {
            // Found match ahead - mark intermediate lines as removed
            for (let j = 0; j < i; j++) {
              diff.push({ type: 'removed', content: originalLines[origIndex + j], lineNumber })
              removedCount++
              lineNumber++
            }
            origIndex += i
            foundMatch = true
            break
          }
        }
      }
      
      if (!foundMatch) {
        // No match found - mark as changed (removed + added)
        diff.push({ type: 'removed', content: origLine, lineNumber })
        diff.push({ type: 'added', content: suggLine, lineNumber })
        removedCount++
        addedCount++
        origIndex++
        suggIndex++
        lineNumber++
      }
    }
  }
  
  return {
    lines: diff,
    hasChanges: addedCount > 0 || removedCount > 0,
    addedCount,
    removedCount,
  }
}
