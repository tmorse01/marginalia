import { describe, it, expect } from 'vitest'
import { parseInlineMarkdown, getLineType, tokenizeLine } from '../markdown-parser'

describe('parseInlineMarkdown', () => {
  it('parses bold text', () => {
    const result = parseInlineMarkdown('hello **world**')
    expect(result).toEqual([
      { type: 'text', content: 'hello ' },
      { type: 'bold', content: 'world', raw: '**world**' },
    ])
  })

  it('parses italic text', () => {
    const result = parseInlineMarkdown('hello *world*')
    expect(result).toEqual([
      { type: 'text', content: 'hello ' },
      { type: 'italic', content: 'world', raw: '*world*' },
    ])
  })

  it('parses inline code', () => {
    const result = parseInlineMarkdown('hello `world`')
    expect(result).toEqual([
      { type: 'text', content: 'hello ' },
      { type: 'code', content: 'world', raw: '`world`' },
    ])
  })

  it('parses links', () => {
    const result = parseInlineMarkdown('hello [world](https://example.com)')
    expect(result).toEqual([
      { type: 'text', content: 'hello ' },
      {
        type: 'link',
        text: 'world',
        url: 'https://example.com',
        raw: '[world](https://example.com)',
      },
    ])
  })

  it('parses strikethrough', () => {
    const result = parseInlineMarkdown('hello ~~world~~')
    expect(result).toEqual([
      { type: 'text', content: 'hello ' },
      { type: 'strikethrough', content: 'world', raw: '~~world~~' },
    ])
  })

  it('parses nested inline elements', () => {
    const result = parseInlineMarkdown('**bold *and italic***')
    expect(result).toEqual([
      {
        type: 'bold',
        content: 'bold *and italic*',
        raw: '**bold *and italic***',
      },
    ])
  })

  it('handles unclosed markers', () => {
    const result = parseInlineMarkdown('**unclosed')
    expect(result).toEqual([{ type: 'text', content: '**unclosed' }])
  })

  it('handles empty string', () => {
    const result = parseInlineMarkdown('')
    expect(result).toEqual([{ type: 'text', content: '' }])
  })

  it('handles escaped characters', () => {
    const result = parseInlineMarkdown('\\*not bold\\*')
    expect(result).toEqual([{ type: 'text', content: '\\*not bold\\*' }])
  })

  it('parses multiple elements', () => {
    const result = parseInlineMarkdown('**bold** and *italic*')
    expect(result).toEqual([
      { type: 'bold', content: 'bold', raw: '**bold**' },
      { type: 'text', content: ' and ' },
      { type: 'italic', content: 'italic', raw: '*italic*' },
    ])
  })

  it('handles adjacent elements', () => {
    const result = parseInlineMarkdown('**bold****more bold**')
    expect(result).toEqual([
      { type: 'bold', content: 'bold', raw: '**bold**' },
      { type: 'bold', content: 'more bold', raw: '**more bold**' },
    ])
  })

  it('prioritizes code over other elements', () => {
    const result = parseInlineMarkdown('`code **bold**`')
    expect(result).toEqual([
      { type: 'code', content: 'code **bold**', raw: '`code **bold**`' },
    ])
  })
})

describe('getLineType', () => {
  it('detects empty line', () => {
    expect(getLineType('')).toEqual({ type: 'empty' })
    expect(getLineType('   ')).toEqual({ type: 'empty' })
  })

  it('detects headers by # count', () => {
    expect(getLineType('# Header')).toEqual({ type: 'header', level: 1 })
    expect(getLineType('## Header')).toEqual({ type: 'header', level: 2 })
    expect(getLineType('###### Header')).toEqual({ type: 'header', level: 6 })
  })

  it('detects unordered list items', () => {
    expect(getLineType('- item')).toEqual({
      type: 'unordered-list',
      marker: '-',
      indent: 0,
    })
    expect(getLineType('* item')).toEqual({
      type: 'unordered-list',
      marker: '*',
      indent: 0,
    })
    expect(getLineType('+ item')).toEqual({
      type: 'unordered-list',
      marker: '+',
      indent: 0,
    })
    expect(getLineType('  - item')).toEqual({
      type: 'unordered-list',
      marker: '-',
      indent: 2,
    })
  })

  it('detects ordered list items', () => {
    expect(getLineType('1. item')).toEqual({
      type: 'ordered-list',
      number: 1,
      indent: 0,
    })
    expect(getLineType('42. item')).toEqual({
      type: 'ordered-list',
      number: 42,
      indent: 0,
    })
    expect(getLineType('  2. item')).toEqual({
      type: 'ordered-list',
      number: 2,
      indent: 2,
    })
  })

  it('detects blockquotes', () => {
    expect(getLineType('> quote')).toEqual({
      type: 'blockquote',
      indent: 1,
    })
    expect(getLineType('>>> quote')).toEqual({
      type: 'blockquote',
      indent: 3,
    })
  })

  it('detects horizontal rules', () => {
    expect(getLineType('---')).toEqual({ type: 'horizontal-rule' })
    expect(getLineType('***')).toEqual({ type: 'horizontal-rule' })
    expect(getLineType('___')).toEqual({ type: 'horizontal-rule' })
  })

  it('detects code fence boundaries', () => {
    expect(getLineType('```')).toEqual({
      type: 'code-fence',
      language: undefined,
      isStart: true,
    })
    expect(getLineType('```javascript')).toEqual({
      type: 'code-fence',
      language: 'javascript',
      isStart: true,
    })
  })

  it('detects regular paragraphs', () => {
    expect(getLineType('Regular text')).toEqual({ type: 'paragraph' })
    expect(getLineType('Text with **bold**')).toEqual({ type: 'paragraph' })
  })
})

describe('tokenizeLine', () => {
  it('combines line type with inline parsing', () => {
    const result = tokenizeLine('# **Bold** Header')
    expect(result.lineType).toEqual({ type: 'header', level: 1 })
    expect(result.tokens).toEqual([
      { type: 'bold', content: 'Bold', raw: '**Bold**' },
      { type: 'text', content: ' Header' },
    ])
  })

  it('handles code fence content (no inline parsing)', () => {
    const result = tokenizeLine('```javascript')
    expect(result.lineType).toEqual({
      type: 'code-fence',
      language: 'javascript',
      isStart: true,
    })
    expect(result.tokens).toEqual([
      { type: 'text', content: '```javascript' },
    ])
  })

  it('handles list items with inline formatting', () => {
    const result = tokenizeLine('- **Bold** item')
    expect(result.lineType).toEqual({
      type: 'unordered-list',
      marker: '-',
      indent: 0,
    })
    expect(result.tokens).toEqual([
      { type: 'bold', content: 'Bold', raw: '**Bold**' },
      { type: 'text', content: ' item' },
    ])
  })

  it('handles blockquotes with inline formatting', () => {
    const result = tokenizeLine('> *Italic* quote')
    expect(result.lineType).toEqual({
      type: 'blockquote',
      indent: 1,
    })
    expect(result.tokens).toEqual([
      { type: 'italic', content: 'Italic', raw: '*Italic*' },
      { type: 'text', content: ' quote' },
    ])
  })

  it('handles empty lines', () => {
    const result = tokenizeLine('')
    expect(result.lineType).toEqual({ type: 'empty' })
    expect(result.tokens).toEqual([{ type: 'text', content: '' }])
  })
})

