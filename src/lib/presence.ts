import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

const HEARTBEAT_MS = 5000
const UPDATE_DEBOUNCE_MS = 200

interface UsePresenceOptions {
  noteId?: Id<'notes'>
  userId?: Id<'users'> | null
  mode: 'editing' | 'viewing'
  cursorStart?: number
  cursorEnd?: number
}

export function useNotePresence({
  noteId,
  userId,
  mode,
  cursorStart,
  cursorEnd,
}: UsePresenceOptions) {
  const upsertPresence = useMutation(api.presence.upsert)
  const removePresence = useMutation(api.presence.remove)
  const debounceRef = useRef<number | undefined>(undefined)
  const latestRef = useRef({
    mode,
    cursorStart,
    cursorEnd,
  })

  useEffect(() => {
    latestRef.current = { mode, cursorStart, cursorEnd }
  }, [mode, cursorStart, cursorEnd])

  useEffect(() => {
    if (!noteId || !userId) return

    const sendPresence = () =>
      upsertPresence({
        noteId,
        userId,
        mode: latestRef.current.mode,
        cursorStart: latestRef.current.cursorStart,
        cursorEnd: latestRef.current.cursorEnd,
      })

    sendPresence()

    const heartbeat = window.setInterval(() => {
      sendPresence()
    }, HEARTBEAT_MS)

    return () => {
      window.clearInterval(heartbeat)
      removePresence({ noteId, userId })
    }
  }, [noteId, userId, upsertPresence, removePresence])

  useEffect(() => {
    if (!noteId || !userId) return

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      upsertPresence({
        noteId,
        userId,
        mode,
        cursorStart,
        cursorEnd,
      })
    }, UPDATE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(debounceRef.current)
    }
  }, [noteId, userId, mode, cursorStart, cursorEnd, upsertPresence])
}

