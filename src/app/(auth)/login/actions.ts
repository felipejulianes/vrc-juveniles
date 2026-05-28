'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const emailSchema = z.string().email('Ingresá un email válido.')

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email')

  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Email inválido.')
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo:
        (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000') +
        '/api/auth/callback',
    },
  })

  if (error) {
throw new Error('No se pudo enviar el enlace. Intentá de nuevo.')
  }

  redirect('/login?sent=1')
}
