import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

const config = defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST === 'true'

  const plugins = [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    viteReact(),
  ]

  if (!isTest) {
    plugins.unshift(devtools(), netlify(), tanstackStart())
  }

  const alias: Record<string, string> = {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    'convex/_generated': fileURLToPath(new URL('./convex/_generated', import.meta.url)),
  }

  if (isTest) {
    alias.react = fileURLToPath(new URL('./node_modules/react', import.meta.url))
    alias['react-dom'] = fileURLToPath(new URL('./node_modules/react-dom', import.meta.url))
    alias['react-dom/client'] = fileURLToPath(new URL('./node_modules/react-dom/client', import.meta.url))
    alias['react-dom/test-utils'] = fileURLToPath(new URL('./node_modules/react-dom/test-utils', import.meta.url))
  }

  return {
  resolve: {
    alias,
    dedupe: ['react', 'react-dom'],
  },
  plugins,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    server: {
      deps: {
        inline: ['react', 'react-dom'],
      },
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.vscode/**',
      '**/.cursor/**',
      '**/Documents/**',
      '**/My Documents/**',
    ],
    root: process.cwd(),
  },
  }
})

export default config
