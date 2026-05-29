import { z } from 'zod'

export const SessionFormSchema = z.object({
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  division_id: z.string().uuid(),
})

export type SessionFormInput = z.infer<typeof SessionFormSchema>
