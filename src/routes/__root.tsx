import {
  HeadContent,
  Scripts,
  createRootRoute,
  useLocation,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { useEffect } from 'react'
import { Home, FileQuestion } from 'lucide-react'

import AppLayout from '../components/AppLayout'
import LandingLayout from '../components/LandingLayout'
import { SidebarProvider } from '../lib/sidebar-context'
import { convex } from '../lib/convex'
import { CurrentUserProvider, useCurrentUserShellState } from '../lib/useTestUser'

import appCss from '../styles.css?url'

function ConvexAuthProviderWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <ConvexAuthProvider
      client={convex}
      replaceURL={(href) => {
        if (import.meta.env.DEV) {
          console.debug('[auth] ConvexAuthProvider.replaceURL', { href })
        }
        void navigate({ to: href, replace: true })
      }}
    >
      {children}
    </ConvexAuthProvider>
  )
}

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
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center px-4">
        <FileQuestion size={64} className="mx-auto mb-4 text-base-content/40" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-base-content/70 mb-6">Page not found</p>
        <p className="text-base-content/60 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary gap-2">
          <Home size={20} />
          Go Home
        </Link>
      </div>
    </div>
  )
}

function AppShellGate({ children }: { children: React.ReactNode }) {
  const userState = useCurrentUserShellState()
  if (userState.status === 'loading') {
    return null
  }
  return <AppLayout>{children}</AppLayout>
}

function RootDocumentContent({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLandingRoute = location.pathname === '/landing'

  if (isLandingRoute) {
    return <LandingLayout>{children}</LandingLayout>
  }

  return (
    <CurrentUserProvider>
      <AppShellGate>{children}</AppShellGate>
    </CurrentUserProvider>
  )
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

  const content = (
    <SidebarProvider>
      <RootDocumentContent>{children}</RootDocumentContent>
    </SidebarProvider>
  )

  return (
    <html lang="en" data-theme="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-base-200 text-base-content">
        <ConvexAuthProviderWithRouter>
          {content}
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
        </ConvexAuthProviderWithRouter>
        <Scripts />
      </body>
    </html>
  )
}
