import { z } from 'zod'

// NOTE: Live players table uses parent_phone/parent_name (confirmed in Plan 03 — D-06 deviation).
// Plan 04 spec assumed phone/email; adjusted to match live schema.
export const PlayerFormSchema = z.object({
  first_name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  last_name: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres').max(60),
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,9}$/, 'DNI inválido (7 a 9 dígitos)')
    .optional()
    .or(z.literal('')),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
    .optional()
    .or(z.literal('')),
  parent_phone: z.string().trim().max(30).optional().or(z.literal('')),
  parent_name: z.string().trim().max(80).optional().or(z.literal('')),
  division_id: z.string().min(1, 'División requerida'),
  // Use z.number() (not z.coerce) — form converts Select string values to number before submitting
  position_primary: z.number().int().min(1).max(15).optional().nullable(),
  position_alt1: z.number().int().min(1).max(15).optional().nullable(),
  apto_medico: z.boolean(),
})

export type PlayerFormInput = z.infer<typeof PlayerFormSchema>
