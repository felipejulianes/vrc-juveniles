'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { SessionFormSchema, type SessionFormInput } from '@/lib/attendance/schema'
import { createSession } from '@/app/(app)/lista/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface SessionFormProps {
  divisionId: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function SessionForm({ divisionId }: SessionFormProps) {
  const router = useRouter()

  const form = useForm<SessionFormInput>({
    resolver: zodResolver(SessionFormSchema),
    defaultValues: {
      session_date: todayISO(),
      division_id: divisionId,
    },
  })

  async function onSubmit(values: SessionFormInput) {
    try {
      const { sessionId } = await createSession(values)
      router.push(`/lista/${sessionId}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear la sesión')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold px-4 pt-4">Tomar lista</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="session_date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          variant="default"
          className="w-full h-12 text-base"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Abriendo...' : 'Abrir lista'}
        </Button>
      </form>
    </Form>
  )
}
