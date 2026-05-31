import { z } from 'zod'

export const MatchFormSchema = z.object({
  division_id: z.string().min(1, 'División requerida'),
  match_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  match_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida').optional().or(z.literal('')),
  fecha_nro: z.number().int().min(1).max(50).optional().nullable(),
  rival: z.string().trim().min(1, 'Rival requerido').max(120),
  home_away: z.enum(['local', 'visitante']),
  venue: z.string().trim().max(120).optional().or(z.literal('')),
  subequipo: z.string().trim().max(4).optional().or(z.literal('')),
})

export type MatchFormInput = z.infer<typeof MatchFormSchema>

export const MatchResultSchema = z.object({
  score_home: z.number().int().min(0).max(200).nullable(),
  score_away: z.number().int().min(0).max(200).nullable(),
}).refine(
  (v) => (v.score_home === null && v.score_away === null) || (v.score_home !== null && v.score_away !== null),
  { message: 'Ambos puntajes deben estar cargados o ambos vacíos' }
)

export type MatchResultInput = z.infer<typeof MatchResultSchema>

export const ScoringEventSchema = z.object({
  match_id: z.string().min(1),
  team: z.enum(['home', 'away']),
  event_type: z.enum(['try', 'conversion', 'penalty', 'drop', 'yellow_card', 'red_card']),
  player_id: z.string().min(1).optional().nullable(),
  rival_scorer: z.string().trim().max(120).optional().nullable(),
})

export type ScoringEventInput = z.infer<typeof ScoringEventSchema>
