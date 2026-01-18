import { describe, it, expect } from 'vitest'
import {
  offsetToLineCol,
  lineColToOffset,
  getLineNumber,
  getLineStart,
  getLineEnd,
  getLineContent,
  getLines,
  isOffsetInLineRange,
} from '../cursor-utils'

describe('offsetToLineCol', () => {
  it('converts offset 0 to line 0, col 0', () => {
    expect(offsetToLineCol('hello', 0)).toEqual({ line: 0, col: 0 })
  })

  it('handles newlines correctly', () => {
    const content = 'line1\nline2\nline3'
    expect(offsetToLineCol(content, 0)).toEqual({ line: 0, col: 0 })
    expect(offsetToLineCol(content, 5)).toEqual({ line: 0, col: 5 })
    expect(offsetToLineCol(content, 6)).toEqual({ line: 1, col: 0 })
    expect(offsetToLineCol(content, 12)).toEqual({ line: 1, col: 6 })
    expect(offsetToLineCol(content, 13)).toEqual({ line: 2, col: 0 })
  })

  it('clamps out-of-bounds offsets', () => {
    const content = 'hello'
    expect(offsetToLineCol(content, -1)).toEqual({ line: 0, col: 0 })
    expect(offsetToLineCol(content, 100)).toEqual({ line: 0, col: 5 })
  })

  it('handles empty string', () => {
    expect(offsetToLineCol('', 0)).toEqual({ line: 0, col: 0 })
    expect(offsetToLineCol('', 10)).toEqual({ line: 0, col: 0 })
  })

  it('handles content with only newlines', () => {
    const content = '\n\n\n'
    expect(offsetToLineCol(content, 0)).toEqual({ line: 0, col: 0 })
    expect(offsetToLineCol(content, 1)).toEqual({ line: 1, col: 0 })
    expect(offsetToLineCol(content, 2)).toEqual({ line: 2, col: 0 })
    expect(offsetToLineCol(content, 3)).toEqual({ line: 3, col: 0 })
  })
})

describe('lineColToOffset', () => {
  it('converts line 0, col 0 to offset 0', () => {
    expect(lineColToOffset('hello', 0, 0)).toBe(0)
  })

  it('handles multi-line content', () => {
    const content = 'line1\nline2\nline3'
    expect(lineColToOffset(content, 0, 0)).toBe(0)
    expect(lineColToOffset(content, 0, 5)).toBe(5)
    expect(lineColToOffset(content, 1, 0)).toBe(6)
    expect(lineColToOffset(content, 1, 6)).toBe(12)
    expect(lineColToOffset(content, 2, 0)).toBe(13)
  })

  it('clamps out-of-bounds coordinates', () => {
    const content = 'hello\nworld'
    expect(lineColToOffset(content, -1, 0)).toBe(0)
    expect(lineColToOffset(content, 0, 100)).toBe(5)
    expect(lineColToOffset(content, 100, 0)).toBe(11)
  })

  it('handles empty string', () => {
    expect(lineColToOffset('', 0, 0)).toBe(0)
    expect(lineColToOffset('', 0, 10)).toBe(0)
  })
})

describe('getLineNumber', () => {
  it('returns correct line number for offset', () => {
    const content = 'line1\nline2\nline3'
    expect(getLineNumber(content, 0)).toBe(0)
    expect(getLineNumber(content, 5)).toBe(0)
    expect(getLineNumber(content, 6)).toBe(1)
    expect(getLineNumber(content, 12)).toBe(1)
    expect(getLineNumber(content, 13)).toBe(2)
  })
})

describe('getLineStart', () => {
  it('returns start offset of line', () => {
    const content = 'line1\nline2\nline3'
    expect(getLineStart(content, 0)).toBe(0)
    expect(getLineStart(content, 1)).toBe(6)
    expect(getLineStart(content, 2)).toBe(13)
  })

  it('handles out-of-bounds line numbers', () => {
    const content = 'hello'
    expect(getLineStart(content, -1)).toBe(0)
    expect(getLineStart(content, 10)).toBe(5)
  })
})

describe('getLineEnd', () => {
  it('returns end offset of line including newline', () => {
    const content = 'line1\nline2\nline3'
    expect(getLineEnd(content, 0)).toBe(5)
    expect(getLineEnd(content, 1)).toBe(12)
    expect(getLineEnd(content, 2)).toBe(18)
  })

  it('handles last line without newline', () => {
    const content = 'line1\nline2'
    expect(getLineEnd(content, 0)).toBe(5)
    expect(getLineEnd(content, 1)).toBe(11)
  })
})

describe('getLineContent', () => {
  it('returns text content of specific line', () => {
    const content = 'line1\nline2\nline3'
    expect(getLineContent(content, 0)).toBe('line1')
    expect(getLineContent(content, 1)).toBe('line2')
    expect(getLineContent(content, 2)).toBe('line3')
  })

  it('handles out-of-bounds line numbers', () => {
    const content = 'hello'
    expect(getLineContent(content, -1)).toBe('')
    expect(getLineContent(content, 10)).toBe('')
  })
})

describe('getLines', () => {
  it('splits content into lines', () => {
    const content = 'line1\nline2\nline3'
    expect(getLines(content)).toEqual(['line1', 'line2', 'line3'])
  })

  it('handles empty string', () => {
    expect(getLines('')).toEqual([''])
  })

  it('handles content with trailing newline', () => {
    const content = 'line1\nline2\n'
    expect(getLines(content)).toEqual(['line1', 'line2', ''])
  })
})

describe('isOffsetInLineRange', () => {
  it('checks if offset is within line range', () => {
    const content = 'line1\nline2\nline3\nline4'
    expect(isOffsetInLineRange(content, 0, 0, 1)).toBe(true)
    expect(isOffsetInLineRange(content, 6, 0, 1)).toBe(true)
    expect(isOffsetInLineRange(content, 12, 0, 1)).toBe(false)
    expect(isOffsetInLineRange(content, 12, 2, 3)).toBe(true)
  })

  it('handles single line range', () => {
    const content = 'line1\nline2\nline3'
    expect(isOffsetInLineRange(content, 0, 0, 0)).toBe(true)
    expect(isOffsetInLineRange(content, 5, 0, 0)).toBe(true)
    expect(isOffsetInLineRange(content, 6, 0, 0)).toBe(false)
  })
})

