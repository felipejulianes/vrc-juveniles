export type ParsedMatch = {
  division: string
  fecha_nro: number
  fecha: string
  equipo: string | null
  local_visitante: string
  rival: string
  hora: string | null
}

export type CsvParseResult = {
  matches: ParsedMatch[]
  errors: { row: number; message: string }[]
}

const VALID_DIVISIONS = new Set(['M15', 'M16', 'M17', 'M19'])
const VALID_HOME_AWAY = new Set(['Local', 'Visitante'])

export function parseFixtureCSV(text: string): CsvParseResult {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((l) => l.trim().length > 0)

  if (lines.length < 2) {
    return { matches: [], errors: [{ row: 0, message: 'CSV vacío o sin datos' }] }
  }

  const [, ...rows] = lines
  const matches: ParsedMatch[] = []
  const errors: { row: number; message: string }[] = []

  rows.forEach((line, idx) => {
    const rowNum = idx + 2
    const cols = line.split(',')
    if (cols.length !== 7) {
      errors.push({ row: rowNum, message: `Se esperaban 7 columnas, se encontraron ${cols.length}` })
      return
    }
    const [division, fecha_nro_str, fecha, equipo, local_visitante, rival, hora] = cols.map((c) => c.trim())

    if (!VALID_DIVISIONS.has(division)) {
      errors.push({ row: rowNum, message: `División inválida: "${division}"` })
      return
    }
    if (!VALID_HOME_AWAY.has(local_visitante)) {
      errors.push({ row: rowNum, message: `Local/Visitante inválido: "${local_visitante}"` })
      return
    }

    const fecha_nro = parseInt(fecha_nro_str, 10)
    if (isNaN(fecha_nro)) {
      errors.push({ row: rowNum, message: `Fecha N° inválida: "${fecha_nro_str}"` })
      return
    }

    matches.push({
      division,
      fecha_nro,
      fecha,
      equipo: equipo || null,
      local_visitante,
      rival,
      hora: hora || null,
    })
  })

  return { matches, errors }
}
