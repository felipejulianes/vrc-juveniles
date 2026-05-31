import { describe, it, expect } from 'vitest'
import { getMatchResult, formatMatchDate } from './utils'

describe('getMatchResult', () => {
  it('returns pending when no scores', () => {
    expect(getMatchResult(null, null, '2026-04-11')).toBe('pending')
  })
  it('returns won when home > away', () => {
    expect(getMatchResult(24, 17, '2026-04-11')).toBe('won')
  })
  it('returns lost when home < away', () => {
    expect(getMatchResult(10, 21, '2026-04-11')).toBe('lost')
  })
  it('returns draw when home === away', () => {
    expect(getMatchResult(15, 15, '2026-04-11')).toBe('draw')
  })
})

describe('formatMatchDate', () => {
  it('formats ISO date into es-AR short weekday + DD/MM', () => {
    const out = formatMatchDate('2026-04-11')
    expect(out.toLowerCase()).toMatch(/sáb|sab/) // tolerate accent variation
    expect(out).toContain('11/04')
  })
})
