// Siembra datos de PRUEBA en las divisiones juveniles (M15-M19):
//   - ~24 jugadores por división, dni = 'TEST-...' (marcador para borrado)
//   - entrenamientos martes y jueves de las últimas 4 semanas, notes = 'SEED-TEST'
//   - asistencia realista (cada jugador tiene una tasa base 40-95%)
// Borrado total: node scripts/delete-test-data.mjs
// Uso: node scripts/seed-test-data.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const FIRST = ['Juan', 'Mateo', 'Thiago', 'Bautista', 'Santino', 'Valentín', 'Benjamín', 'Joaquín', 'Franco', 'Lautaro', 'Tomás', 'Felipe', 'Ramiro', 'Santiago', 'Nicolás', 'Agustín', 'Facundo', 'Ignacio', 'Máximo', 'Simón', 'Lucas', 'Pedro', 'Gonzalo', 'Bruno', 'Dante', 'Ciro']
const LAST = ['Fernández', 'Gómez', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'Sánchez', 'Romero', 'Díaz', 'Álvarez', 'Torres', 'Ruiz', 'Acosta', 'Benítez', 'Medina', 'Herrera', 'Aguirre', 'Molina', 'Castro', 'Ríos', 'Vega', 'Silva', 'Rojas', 'Ledesma', 'Cabrera', 'Ponce']

// Distribución de puestos tipo plantel (números canónicos de roles)
const POSITIONS = [
  1, 1, 1, 1,        // pilares
  2, 2,              // hookers
  4, 4, 4, 4,        // segundas
  6, 6, 6,           // alas
  8, 8,              // octavos
  9, 9,              // medio scrums
  10, 10,            // aperturas
  12, 12, 12,        // centros
  11, 11, 11,        // wings
  15, 15,            // fullbacks
]
const ALT_BY_PRIMARY = { 1: 2, 2: 1, 4: 6, 6: 8, 8: 6, 9: 10, 10: 12, 12: 11, 11: 15, 15: 11 }

// Formato local YYYY-MM-DD (toISOString corre el día por el offset UTC)
function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function lastTuesdaysAndThursdays(weeks = 4) {
  const dates = []
  const today = new Date()
  for (let d = 1; d <= weeks * 7 + 2; d++) {
    const day = new Date(today)
    day.setDate(today.getDate() - d)
    const dow = day.getDay() // 2 = martes, 4 = jueves
    if (dow === 2 || dow === 4) dates.push(localISO(day))
    if (dates.length >= weeks * 2) break
  }
  return dates.reverse()
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260705)

async function main() {
  const { data: divisions, error: divErr } = await supabase
    .from('divisions')
    .select('id, name')
    .eq('is_juvenile', true)
    .order('name')
  if (divErr) throw divErr

  const dates = lastTuesdaysAndThursdays(4)
  console.log('Divisiones:', divisions.map((d) => d.name).join(', '))
  console.log('Fechas de entrenamiento (mar/jue):', dates.join(', '))

  for (const div of divisions) {
    // 1. Jugadores
    const players = POSITIONS.map((pos, i) => ({
      first_name: FIRST[(i + FIRST.length * divisions.indexOf(div)) % FIRST.length],
      last_name: LAST[(i * 3 + divisions.indexOf(div)) % LAST.length],
      dni: `TEST-${div.name}-${String(i + 1).padStart(2, '0')}`,
      division_id: div.id,
      active: true,
      apto_medico: rand() > 0.15, // ~15% sin apto para probar el warning
    }))

    const { data: inserted, error: playersErr } = await supabase
      .from('players')
      .upsert(players, { onConflict: 'dni', ignoreDuplicates: false })
      .select('id, dni')
    if (playersErr) throw playersErr

    // 2. Puestos
    const byDni = new Map(inserted.map((p) => [p.dni, p.id]))
    const positionRows = POSITIONS.map((pos, i) => {
      const dni = `TEST-${div.name}-${String(i + 1).padStart(2, '0')}`
      return {
        player_id: byDni.get(dni),
        position_primary: pos,
        position_alt1: rand() > 0.5 ? ALT_BY_PRIMARY[pos] : null,
      }
    }).filter((r) => r.player_id)

    const { error: posErr } = await supabase
      .from('player_positions')
      .upsert(positionRows, { onConflict: 'player_id' })
    if (posErr) throw posErr

    // 3. Sesiones de entrenamiento (skip si ya existe una en esa fecha)
    const sessionRows = dates.map((session_date) => ({
      division_id: div.id,
      session_date,
      session_type: 'entrenamiento',
      notes: 'SEED-TEST',
    }))
    const { error: sessErr } = await supabase
      .from('training_sessions')
      .upsert(sessionRows, { onConflict: 'division_id,session_date', ignoreDuplicates: true })
    if (sessErr) throw sessErr

    const { data: sessions, error: sessSelErr } = await supabase
      .from('training_sessions')
      .select('id, session_date')
      .eq('division_id', div.id)
      .eq('session_type', 'entrenamiento')
      .in('session_date', dates)
    if (sessSelErr) throw sessSelErr

    // 4. Asistencia: tasa base por jugador (40-95%)
    const attendance = []
    inserted.forEach((p, i) => {
      const baseRate = 0.4 + 0.55 * rand()
      for (const s of sessions) {
        attendance.push({
          session_id: s.id,
          player_id: p.id,
          present: rand() < baseRate,
        })
      }
    })
    const { error: attErr } = await supabase
      .from('attendance_records')
      .upsert(attendance, { onConflict: 'session_id,player_id' })
    if (attErr) throw attErr

    console.log(
      `${div.name}: ${inserted.length} jugadores, ${sessions.length} sesiones, ${attendance.length} registros de asistencia`
    )
  }

  console.log('\nListo. Para borrar todo: node scripts/delete-test-data.mjs')
}

main().catch((e) => {
  console.error('ERROR:', e.message ?? e)
  process.exit(1)
})
