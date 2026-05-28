import { openDB, type IDBPDatabase } from 'idb'
import type { SupabaseClient } from '@supabase/supabase-js'

const DB_NAME = 'vrc-juveniles-offline'
const DB_VERSION = 1
const QUEUE_STORE = 'attendance-queue'
const PLAYERS_STORE = 'players-cache'

export type AttendanceQueueItem = {
  id?: number
  session_id: string
  player_id: string
  present: boolean
  timestamp: number
}

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDB(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('IDB only available in the browser')
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const s = db.createObjectStore(QUEUE_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          })
          s.createIndex('by_session', 'session_id')
        }
        if (!db.objectStoreNames.contains(PLAYERS_STORE)) {
          db.createObjectStore(PLAYERS_STORE, { keyPath: 'division_id' })
        }
      },
    })
  }
  return dbPromise
}

export async function enqueueAttendance(
  item: Omit<AttendanceQueueItem, 'id'>
): Promise<void> {
  const db = await getDB()
  await db.add(QUEUE_STORE, item)
}

export async function getQueuedItems(): Promise<AttendanceQueueItem[]> {
  const db = await getDB()
  return db.getAll(QUEUE_STORE)
}

export async function deleteQueuedItem(id: number): Promise<void> {
  const db = await getDB()
  await db.delete(QUEUE_STORE, id)
}

export async function flushQueue(
  supabase: SupabaseClient
): Promise<{ flushed: number; errors: number }> {
  const items = await getQueuedItems()
  if (items.length === 0) return { flushed: 0, errors: 0 }

  // Collapse duplicates: keep the LATEST entry per (session_id, player_id) by timestamp
  const latest = new Map<string, AttendanceQueueItem>()
  for (const it of items) {
    const key = `${it.session_id}::${it.player_id}`
    const prev = latest.get(key)
    if (!prev || it.timestamp > prev.timestamp) latest.set(key, it)
  }

  let flushed = 0
  let errors = 0

  // Upsert in one batch
  const collapsed = Array.from(latest.values())
  const rows = collapsed.map((i) => ({
    session_id: i.session_id,
    player_id: i.player_id,
    present: i.present,
  }))

  const { error } = await supabase
    .from('attendance_records')
    .upsert(rows, { onConflict: 'session_id,player_id' })

  if (error) {
    errors = items.length
    return { flushed, errors }
  }

  // Success: clear all queued items
  for (const it of items) {
    if (it.id != null) {
      try {
        await deleteQueuedItem(it.id)
        flushed++
      } catch {
        errors++
      }
    }
  }
  return { flushed, errors }
}
