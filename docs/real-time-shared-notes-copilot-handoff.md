# Copilot Handoff Plan  
## Real-Time Shared Notes + Social Knowledge App

> **Goal:** Hand this document to GitHub Copilot (or Cursor / Copilot Chat) so it can scaffold, implement, and iterate on the project with minimal back-and-forth.

This document defines **scope, constraints, architecture, and non-goals**.  
Copilot should treat this as the source of truth.

---

## 1. Project Summary

Build a **real-time, shared Markdown notes app** with:

- Live co-editing
- Inline comments
- Per-note sharing & permissions
- Light social layer (forks, follows, activity)
- Opinionated UX (calm, focused, no feeds)

Think **Obsidian-style notes**, but:
- Cloud-native
- Real-time
- Collaboration-first
- Social emerges from work, not engagement farming

---

## 2. Core Product Principles (Non-Negotiable)

Copilot **must not violate these**:

1. **Markdown is the primary interface**
   - No rich text abstractions
   - Markdown source is always visible/editable

2. **Notes are living objects**
   - Presence matters
   - Edits stream in real time
   - History is meaningful

3. **Social is secondary**
   - No global feed initially
   - No likes on comments
   - No algorithmic discovery

4. **Opinionated > Flexible**
   - Fewer settings
   - Hard rules over configuration
   - Defaults matter

5. **Single-note collaboration first**
   - Vaults / folders come later
   - Do not overbuild hierarchy early

---

## 3. Tech Stack (Locked In)

Copilot must use **exactly this stack** unless explicitly told otherwise.

### Frontend
- **TanStack Start**
- React
- TypeScript
- Markdown editor (simple textarea or lightweight MD editor first)

### Backend
- **Convex**
  - Database
  - Real-time subscriptions
  - Auth
  - Presence

### Auth
- Convex Auth (simple email / magic link is fine)

---

## 4. MVP Scope (Phase 1)

Copilot should implement **only what’s listed here**.

### 4.1 Notes
- Create note
- Edit note (Markdown)
- Real-time co-editing
- View note

**Out of scope (for now):**
- Offline mode
- Advanced Markdown extensions
- Graph view

---

### 4.2 Real-Time Collaboration
- Presence indicator (who is viewing/editing)
- Live text updates
- Cursor or selection awareness (basic)

---

### 4.3 Inline Comments
- Comments anchored to a text range
- Resolve / unresolve comments
- Comments are not free-floating chat

---

### 4.4 Sharing & Permissions
Per note:
- Owner
- Editor
- Viewer
- Public read-only (via link)

No workspace-wide permissions yet.

---

### 4.5 Activity Log (Per Note)
Append-only log:
- Edits
- Comments
- Forks
- Permission changes

No global feed.

---

## 5. Explicit Non-Goals (Copilot Must Avoid)

❌ Full Obsidian replacement  
❌ Complex folder trees in MVP  
❌ Likes, reactions, emoji spam  
❌ Global timelines or trending  
❌ AI features  
❌ Heavy theming or customization  
❌ Over-abstracted component systems  

If Copilot suggests these, **reject and refocus**.

---

## 6. Data Model (Initial)

Copilot should model data **close to this shape**.

### Users
```ts
User {
  _id
  name
  email
  createdAt
}
```

### Notes
```ts
Note {
  _id
  title
  content // markdown
  ownerId
  visibility: "private" | "shared" | "public"
  createdAt
  updatedAt
}
```

### NotePermissions
```ts
NotePermission {
  noteId
  userId
  role: "owner" | "editor" | "viewer"
}
```

### Comments
```ts
Comment {
  _id
  noteId
  authorId
  body
  anchorStart
  anchorEnd
  resolved
  createdAt
}
```

### ActivityEvents
```ts
ActivityEvent {
  _id
  noteId
  type: "edit" | "comment" | "resolve" | "fork" | "permission"
  actorId
  metadata
  createdAt
}
```

---

## 7. Real-Time Expectations

Copilot must leverage Convex reactivity properly:

- Notes update live without refresh
- Comments appear instantly
- Presence updates in real time
- Activity log streams live

Avoid polling.  
Avoid client-side state duplication unless necessary.

---

## 8. UX Guidelines (Important)

Copilot should follow these UX constraints:

- Calm UI
- Minimal chrome
- No notifications spam
- Inline affordances > modals
- Focus on the note content

**Inspiration (not cloning):**
- Obsidian
- GitHub PR review
- Linear comments

---

## 9. Suggested Route Structure (TanStack Start)

```txt
/
  /notes
    /new
    /:noteId
  /public
    /:noteId
  /settings
```

Start flat.  
Do not add folders yet.

---

## 10. Iteration Plan (Future Phases)

Copilot should be aware these exist, but **not implement yet**.

### Phase 2
- Fork note
- Note lineage (parent → child)
- Personal activity feed

### Phase 3
- Folders / collections
- Public profiles
- Follow notes (not users)

### Phase 4
- Search
- Export
- Paid tiers

---

## 11. Quality Bar

Copilot should:
- Prefer clarity over cleverness
- Keep functions small
- Use Convex idioms properly
- Avoid premature optimization
- Leave TODOs with clear intent

---

## 12. Definition of “Done” for MVP

The MVP is complete when:

- Two users can open the same note
- Edit Markdown simultaneously
- See each other’s presence
- Leave inline comments
- Share the note via link
- View activity history
- No refresh required

---

## 13. Copilot Prompt (Optional)

If needed, start Copilot with:

> “Build an opinionated real-time shared Markdown notes app using TanStack Start and Convex. Follow the attached handoff document strictly. Do not add features outside the defined MVP.”

---

## 14. Final Reminder to Copilot

This project succeeds if it feels:
- Calm
- Alive
- Focused
- Slightly opinionated

It fails if it feels:
- Busy
- Social-media-like
- Overbuilt

Build the smallest thing that feels **magical in real time**.
