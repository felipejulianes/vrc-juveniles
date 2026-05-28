import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHOTO_BUCKET, PHOTO_MAX_BYTES, PHOTO_ALLOWED_MIME, photoStoragePath } from '@/lib/players/photo'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']
type CoachDivisionRow = Database['public']['Tables']['coach_divisions']['Row']

export const runtime = 'nodejs' // Storage upload uses Node Buffer
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const playerId = form.get('playerId')
    const photo = form.get('photo')

    if (typeof playerId !== 'string' || playerId.length < 8) {
      return NextResponse.json({ error: 'playerId inválido' }, { status: 400 })
    }
    if (!(photo instanceof File)) {
      return NextResponse.json({ error: 'Foto faltante' }, { status: 400 })
    }
    if (!PHOTO_ALLOWED_MIME.has(photo.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido (solo JPEG / PNG)' },
        { status: 415 }
      )
    }
    if (photo.size > PHOTO_MAX_BYTES) {
      return NextResponse.json({ error: 'Foto demasiado grande (máx 1.5 MB)' }, { status: 413 })
    }

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Authorization: confirm caller owns this player via RLS-aware select
    const { data: rowData } = await sb
      .from('players')
      .select('id, division_id')
      .eq('id', playerId)
      .maybeSingle()

    const row = rowData as Pick<PlayerRow, 'id' | 'division_id'> | null
    if (!row) return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })

    const { data: profileData } = await sb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileData as Pick<ProfileRow, 'role'> | null

    if (profile?.role !== 'admin') {
      const { data: cdData } = await sb
        .from('coach_divisions')
        .select('division_id')
        .eq('coach_id', user.id)
        .eq('division_id', row.division_id)
        .maybeSingle()

      const cd = cdData as Pick<CoachDivisionRow, 'division_id'> | null
      if (!cd)
        return NextResponse.json({ error: 'No tenés acceso a este jugador' }, { status: 403 })
    }

    const buffer = Buffer.from(await photo.arrayBuffer())
    const path = photoStoragePath(playerId)

    const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: 'image/jpeg', // client always resizes to JPEG before sending
    })

    if (upErr)
      return NextResponse.json(
        { error: 'Storage upload failed: ' + upErr.message },
        { status: 500 }
      )

    const { data: pub } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: pub.publicUrl + `?v=${Date.now()}` })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
