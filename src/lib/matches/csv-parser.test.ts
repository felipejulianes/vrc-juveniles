import { describe, it, expect } from 'vitest'
import { parseFixtureCSV } from './csv-parser'

const HEADER = 'division,fecha_nro,fecha,equipo,local_visitante,rival,hora'

describe('parseFixtureCSV', () => {
  it('returns empty + error on empty input', () => {
    const r = parseFixtureCSV('')
    expect(r.matches).toHaveLength(0)
    expect(r.errors[0].message).toMatch(/vacío|datos/i)
  })

  it('parses a single valid row', () => {
    const csv = `${HEADER}\nM19,1,2026-04-11,A,Local,Banco Provincia,16:00`
    const r = parseFixtureCSV(csv)
    expect(r.errors).toHaveLength(0)
    expect(r.matches).toHaveLength(1)
    expect(r.matches[0]).toEqual({
      division: 'M19',
      fecha_nro: 1,
      fecha: '2026-04-11',
      equipo: 'A',
      local_visitante: 'Local',
      rival: 'Banco Provincia',
      hora: '16:00',
    })
  })

  it('reports invalid division', () => {
    const csv = `${HEADER}\nM14,1,2026-04-11,,Local,X,16:00`
    const r = parseFixtureCSV(csv)
    expect(r.matches).toHaveLength(0)
    expect(r.errors[0].message).toMatch(/División inválida/)
  })

  it('reports invalid local_visitante', () => {
    const csv = `${HEADER}\nM19,1,2026-04-11,,Casa,X,16:00`
    const r = parseFixtureCSV(csv)
    expect(r.matches).toHaveLength(0)
    expect(r.errors[0].message).toMatch(/Local\/Visitante/)
  })

  it('normalizes CRLF Windows line endings', () => {
    const csv = `${HEADER}\r\nM19,1,2026-04-11,,Local,X,16:00\r\n`
    const r = parseFixtureCSV(csv)
    expect(r.errors).toHaveLength(0)
    expect(r.matches[0].hora).toBe('16:00')
  })

  it('reports wrong column count', () => {
    const csv = `${HEADER}\nM19,1,2026-04-11,A,Local`
    const r = parseFixtureCSV(csv)
    expect(r.errors[0].message).toMatch(/7 columnas/)
  })

  it('parses empty equipo as null', () => {
    const csv = `${HEADER}\nM15,1,2026-04-11,,Local,X,16:00`
    const r = parseFixtureCSV(csv)
    expect(r.matches[0].equipo).toBeNull()
  })
})
