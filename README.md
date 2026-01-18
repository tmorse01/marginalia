# Marginalia - Real-Time Shared Notes

A real-time collaborative Markdown notes application built with TanStack Start, Convex, and Tailwind CSS + DaisyUI.

## Features

- **Real-time Collaboration**: Edit notes simultaneously with other users
- **Markdown Support**: Write in Markdown, view rendered HTML
- **Inline Comments**: Add comments anchored to specific text ranges
- **Sharing & Permissions**: Share notes with specific users or make them public
- **Activity Log**: Track all changes and events per note
- **Presence Indicators**: See who's currently viewing/editing a note

## Tech Stack

- **Frontend**: TanStack Start (React + TypeScript)
- **Backend**: Convex (Database + Real-time + Auth)
- **Styling**: Tailwind CSS + DaisyUI
- **Markdown**: react-markdown + remark-gfm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Convex account (free tier available)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up Convex:
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (if needed)
   - Generate the Convex URL
   - Set up the database schema

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Convex URL from the Convex dashboard

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
marginalia/
├── convex/           # Convex backend functions
│   ├── schema.ts     # Database schema
│   ├── notes.ts      # Note operations
│   ├── comments.ts   # Comment operations
│   ├── permissions.ts # Permission management
│   └── ...
├── src/
│   ├── routes/       # TanStack Router routes
│   ├── components/   # React components
│   └── lib/          # Utilities
└── ...
```

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier

## Deployment

This project is configured for Netlify deployment. The build output is in `dist/client`.

## Notes

- Authentication is currently a placeholder - implement proper Convex Auth setup
- User ID handling needs to be connected to actual authentication
- Presence tracking uses a simplified approach - can be enhanced with Convex's built-in presence API

## License

MIT
