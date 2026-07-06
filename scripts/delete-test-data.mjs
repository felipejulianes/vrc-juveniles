// Borra TODOS los datos de prueba sembrados por seed-test-data.mjs:
//   - jugadores con dni 'TEST-%' (asistencia, puestos y formaciones caen en cascada)
//   - sesiones de entrenamiento con notes = 'SEED-TEST'
// No toca nada más. Uso: node scripts/delete-test-data.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const { data: players, error: pErr } = await supabase
    .from('players')
    .delete()
    .like('dni', 'TEST-%')
    .select('id')
  if (pErr) throw pErr

  const { data: sessions, error: sErr } = await supabase
    .from('training_sessions')
    .delete()
    .eq('notes', 'SEED-TEST')
    .select('id')
  if (sErr) throw sErr

  console.log(`Borrados: ${players.length} jugadores de prueba, ${sessions.length} sesiones de prueba.`)
  console.log('La asistencia, puestos y formaciones asociadas cayeron en cascada.')
}

main().catch((e) => {
  console.error('ERROR:', e.message ?? e)
  process.exit(1)
})
