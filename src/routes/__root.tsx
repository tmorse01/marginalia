import { HeadContent, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ConvexProvider } from 'convex/react'
import { useEffect } from 'react'

import AppLayout from '../components/AppLayout'
import LandingLayout from '../components/LandingLayout'
import { SidebarProvider } from '../lib/sidebar-context'
import { convex } from '../lib/convex'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Marginalia - Real-Time Shared Notes',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocumentContent({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLandingRoute = location.pathname === '/landing'

  // Use landing layout for /landing route, app layout for everything else
  // Note: When index route shows landing page, it uses app layout but sidebar won't render
  if (isLandingRoute) {
    return <LandingLayout>{children}</LandingLayout>
  }

  return <AppLayout>{children}</AppLayout>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    // Update favicon based on theme
    const updateFavicon = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      const favicon = theme === 'light' ? '/favicon-light.svg' : '/favicon-dark.svg'
      const link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
      if (link) {
        link.href = favicon
      }
    }
    
    updateFavicon()
    
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      updateFavicon()
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    
    return () => observer.disconnect()
  }, [])

  return (
    <html lang="en" data-theme="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-base-200 text-base-content">
        <ConvexProvider client={convex}>
          <SidebarProvider>
            <RootDocumentContent>{children}</RootDocumentContent>
          </SidebarProvider>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}
