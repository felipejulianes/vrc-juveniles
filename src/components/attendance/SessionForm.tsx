'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SessionFormSchema, type SessionFormInput } from '@/lib/attendance/schema'
import { createSession } from '@/app/(app)/lista/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SessionFormProps {
  availableDivisions: { id: string; name: string }[]
  defaultDivisionId: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function getDayLabelFromDate(dateStr: string): 'martes' | 'jueves' | null {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T12:00:00')
  const weekday = date.getDay()
  if (weekday === 2) return 'martes'
  if (weekday === 4) return 'jueves'
  return null
}

export function SessionForm({ availableDivisions, defaultDivisionId }: SessionFormProps) {
  const router = useRouter()

  const form = useForm<SessionFormInput>({
    resolver: zodResolver(SessionFormSchema),
    defaultValues: {
      session_date: todayISO(),
      day_label: getDayLabelFromDate(todayISO()) ?? undefined,
      division_id: defaultDivisionId,
    },
  })

  const selectedDayLabel = form.watch('day_label')
  const sessionDate = form.watch('session_date')

  // Auto-set day chip when date changes
  useEffect(() => {
    const derived = getDayLabelFromDate(sessionDate)
    if (derived) {
      form.setValue('day_label', derived)
    }
  }, [sessionDate, form])

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
        <h1 className="text-xl font-semibold px-4 pt-4">Iniciar entrenamiento</h1>

        {/* Day chip selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">¿Qué día es hoy?</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="day_label"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => form.setValue('day_label', 'martes', { shouldValidate: true })}
                        className={cn(
                          'flex-1 min-h-[56px] rounded-lg border text-base font-medium transition-colors',
                          selectedDayLabel === 'martes'
                            ? 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)] border-[color:var(--primary)]'
                            : 'bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] border-border'
                        )}
                      >
                        Martes
                      </button>
                      <button
                        type="button"
                        onClick={() => form.setValue('day_label', 'jueves', { shouldValidate: true })}
                        className={cn(
                          'flex-1 min-h-[56px] rounded-lg border text-base font-medium transition-colors',
                          selectedDayLabel === 'jueves'
                            ? 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)] border-[color:var(--primary)]'
                            : 'bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] border-border'
                        )}
                      >
                        Jueves
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Date field */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Fecha del entrenamiento</CardTitle>
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

        {/* Division selector (hidden if only one division) */}
        {availableDivisions.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">División</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="division_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">División</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccioná una división" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDivisions.map((div) => (
                          <SelectItem key={div.id} value={div.id}>
                            {div.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <div className="px-0">
          <Button
            type="submit"
            variant="default"
            className="w-full h-12 text-base"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Iniciando...' : 'Iniciar entrenamiento'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
