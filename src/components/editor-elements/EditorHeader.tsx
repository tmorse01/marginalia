import React, { useRef, useEffect } from 'react'

interface EditorHeaderProps {
  level: number
  children: React.ReactNode
  showSyntax: boolean
}

export default function EditorHeader({ level, children, showSyntax }: EditorHeaderProps) {
  const HeaderTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const headerPrefix = showSyntax ? '#'.repeat(level) + ' ' : null
  const headerRef = useRef<HTMLHeadingElement>(null)

  // Deep inspection of children
  const contentInfo: Record<string, unknown> = {
    isArray: Array.isArray(children),
    length: Array.isArray(children) ? children.length : 'N/A',
    type: typeof children,
    isNull: children === null,
    isUndefined: children === undefined,
    stringValue: typeof children === 'string' ? children.substring(0, 50) : 'not string',
    reactElement: React.isValidElement(children) ? 'valid element' : 'not element',
  }

  if (Array.isArray(children)) {
    contentInfo.arrayItems = children.map((item, i) => ({
      index: i,
      type: typeof item,
      isElement: React.isValidElement(item),
      isNull: item === null,
      stringValue: typeof item === 'string' ? item.substring(0, 30) : 'not string',
    }))
  }

  console.log(`[EditorHeader] Rendering h${level}:`, {
    showSyntax,
    hasPrefix: !!headerPrefix,
    prefix: headerPrefix,
    contentInfo,
    hasChildren: !!children,
    childCount: Array.isArray(children) ? children.length : children ? 1 : 0,
  })

  // Log after mount
  useEffect(() => {
    console.log(`[EditorHeader] Mounted h${level} element in DOM`)
    if (headerRef.current) {
      const el = headerRef.current
      console.log(`[EditorHeader] DOM element for h${level}:`, {
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent ? el.textContent.substring(0, 50) : '',
        computedStyle: window.getComputedStyle(el).fontSize,
        display: window.getComputedStyle(el).display,
        visibility: window.getComputedStyle(el).visibility,
        opacity: window.getComputedStyle(el).opacity,
        parentElement: el.parentElement?.tagName,
        childNodes: el.childNodes.length,
        innerHTML: el.innerHTML.substring(0, 100),
      })
    }
  }, [level])

  return React.createElement(
    HeaderTag,
    {
      ref: headerRef,
      className: `editor-header editor-header-${level}`,
      style: {
        display: 'block',
        margin: 0,
        padding: 0,
        fontWeight: 'bold',
        visibility: 'visible',
        opacity: 1,
        color: 'inherit',
      },
      'data-header-level': level,
      'data-show-syntax': showSyntax,
    },
    <>
      {headerPrefix && <span className="editor-syntax-marker">{headerPrefix}</span>}
      {children}
    </>
  )
}
