//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      'convex/_generated/**',
      'dist/**',
      '.netlify/**',
      'node_modules/**',
      '*.config.js',
      'prettier.config.js',
      'eslint.config.js',
    ],
  },
]
