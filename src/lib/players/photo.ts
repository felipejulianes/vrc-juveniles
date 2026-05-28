import 'server-only'

// BLOCKING NOTE: Bucket name 'player-photos' must be verified against live Supabase Storage.
// Per Research Open Question #1, if bucket name differs (e.g., 'player_photos', 'juveniles-photos'),
// update PHOTO_BUCKET here and record deviation in SUMMARY.
// Using 'player-photos' as default — matches infantiles convention per D-06.
export const PHOTO_BUCKET = 'player-photos'
export const PHOTO_MAX_BYTES = 1_500_000 // 1.5 MB cap on uploaded payload (after client-side resize)
export const PHOTO_ALLOWED_MIME = new Set(['image/jpeg', 'image/png'])

export function photoStoragePath(playerId: string): string {
  return `${playerId}.jpg`
}
