'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PlayerFormSchema, type PlayerFormInput } from '@/lib/players/schema'
import { createPlayer, updatePlayer, setPlayerPhotoUrl } from '@/app/(app)/jugadores/actions'
import { RUGBY_POSITIONS } from '@/lib/positions/constants'
import { AvatarUpload } from './AvatarUpload'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type InitialValues = {
  id?: string
  first_name: string
  last_name: string
  dni: string | null
  birth_date: string | null
  parent_phone: string | null
  parent_name: string | null
  division_id: string
  photo_url: string | null
  position_primary: number | null
  position_alt1: number | null
}

type Props = {
  mode: 'create' | 'edit'
  initial?: InitialValues
  availableDivisions: { id: string; name: string }[]
  defaultDivisionId: string
}

const FORWARDS = RUGBY_POSITIONS.filter((p) => p.group === 'Forwards')
const BACKS = RUGBY_POSITIONS.filter((p) => p.group === 'Backs')

export function PlayerForm({ mode, initial, availableDivisions, defaultDivisionId }: Props) {
  const router = useRouter()
  // pendingPhotoBlob holds the resized Blob from AvatarUpload in create mode
  const pendingPhotoBlobRef = useRef<Blob | null>(null)
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(
    initial?.photo_url ?? null
  )

  const form = useForm<PlayerFormInput>({
    resolver: zodResolver(PlayerFormSchema),
    defaultValues: {
      first_name: initial?.first_name ?? '',
      last_name: initial?.last_name ?? '',
      dni: initial?.dni ?? '',
      birth_date: initial?.birth_date ?? '',
      parent_phone: initial?.parent_phone ?? '',
      parent_name: initial?.parent_name ?? '',
      division_id: initial?.division_id ?? defaultDivisionId,
      position_primary: initial?.position_primary ?? null,
      position_alt1: initial?.position_alt1 ?? null,
    },
  })

  const { formState: { isSubmitting } } = form

  // Called by AvatarUpload in create mode with an objectURL preview
  function handleAvatarUploaded(urlOrPreview: string) {
    if (mode === 'create') {
      // In create mode, AvatarUpload gives us an objectURL — we fetch the blob from it
      // and store it for upload after createPlayer returns the real playerId.
      // The objectURL was created from the blob, so we re-fetch it:
      fetch(urlOrPreview)
        .then((r) => r.blob())
        .then((b) => {
          pendingPhotoBlobRef.current = b
          setPendingPhotoPreview(urlOrPreview)
        })
        .catch(() => {
          // Non-critical — preview is cosmetic only
        })
    }
  }

  async function onSubmit(values: PlayerFormInput) {
    try {
      if (mode === 'create') {
        const { playerId } = await createPlayer(values)

        // Upload photo if one was picked before form submission
        const blob = pendingPhotoBlobRef.current
        if (blob) {
          const fd = new FormData()
          fd.append('playerId', playerId)
          fd.append('photo', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
          const res = await fetch('/api/players/photo', { method: 'POST', body: fd })
          if (res.ok) {
            const { url } = await res.json() as { url: string }
            await setPlayerPhotoUrl(playerId, url)
          }
        }

        toast.success('Jugador creado')
        router.push(`/jugadores/${playerId}`)
      } else {
        await updatePlayer(initial!.id!, values)
        toast.success('Cambios guardados')
        router.push(`/jugadores/${initial!.id}`)
      }
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const firstNameValue = form.watch('first_name') || ''
  const lastNameValue = form.watch('last_name') || ''

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Card 1 — Foto */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Foto</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <AvatarUpload
              playerId={mode === 'edit' ? (initial?.id ?? null) : null}
              initialPhotoUrl={pendingPhotoPreview}
              firstName={firstNameValue}
              lastName={lastNameValue}
              onUploaded={handleAvatarUploaded}
            />
          </CardContent>
        </Card>

        {/* Card 2 — Datos */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 45678901"
                      inputMode="numeric"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono del padre/madre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+54 11 5555 1234"
                      inputMode="tel"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Padre/Madre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del padre o madre"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Card 3 — División */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">División</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="division_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>División</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
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

        {/* Card 4 — Posiciones */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Posiciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="position_primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puesto principal</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === '' ? null : Number(val))}
                    value={field.value != null ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Forwards</SelectLabel>
                        {FORWARDS.map((p) => (
                          <SelectItem key={p.number} value={String(p.number)}>
                            {p.number} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Backs</SelectLabel>
                        {BACKS.map((p) => (
                          <SelectItem key={p.number} value={String(p.number)}>
                            {p.number} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position_alt1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puesto alternativo</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === '' ? null : Number(val))}
                    value={field.value != null ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Forwards</SelectLabel>
                        {FORWARDS.map((p) => (
                          <SelectItem key={p.number} value={String(p.number)}>
                            {p.number} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Backs</SelectLabel>
                        {BACKS.map((p) => (
                          <SelectItem key={p.number} value={String(p.number)}>
                            {p.number} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          variant="default"
          className="w-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : 'Guardar jugador'}
        </Button>
      </form>
    </Form>
  )
}
