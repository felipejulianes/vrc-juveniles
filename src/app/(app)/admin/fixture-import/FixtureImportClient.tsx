'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { parseFixtureCSV, type CsvParseResult } from '@/lib/matches/csv-parser'
import { confirmFixtureImport } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function FixtureImportClient() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'preview'>('upload')
  const [csvText, setCsvText] = useState<string>('')
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const result = parseFixtureCSV(text)
      setCsvText(text)
      setParseResult(result)
      setStep('preview')
    } catch {
      toast.error('No se pudo leer el archivo. Verificá que sea un CSV con el formato correcto.')
    }
  }

  function handleCancel() {
    setStep('upload')
    setCsvText('')
    setParseResult(null)
  }

  async function handleConfirm() {
    if (!parseResult || parseResult.matches.length === 0 || submitting) return
    setSubmitting(true)
    try {
      const res = await confirmFixtureImport(csvText)
      toast.success(`Fixture importado: ${res.imported} partidos cargados`)
      setStep('upload')
      setCsvText('')
      setParseResult(null)
      router.push('/fixture')
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      toast.error(
        'Falló la importación. Revisá los errores en la tabla y volvé a intentarlo.' +
          (msg ? ` (${msg})` : '')
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'upload') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Importar fixture URBA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Formato CSV con columnas: division, fecha_nro, fecha, equipo, local_visitante, rival, hora
          </p>
          <div className="space-y-2">
            <label
              htmlFor="csv-file"
              className="block text-sm font-medium"
            >
              Elegí un archivo CSV
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              aria-label="Archivo CSV del fixture"
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80 cursor-pointer"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // step === 'preview'
  if (!parseResult) return null

  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        Se encontraron {parseResult.matches.length} partidos. {parseResult.errors.length} errores.
      </p>

      {/* Matches table */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">División</th>
              <th className="px-3 py-2 text-left font-medium">Fecha #</th>
              <th className="px-3 py-2 text-left font-medium">Fecha</th>
              <th className="px-3 py-2 text-left font-medium">Equipo</th>
              <th className="px-3 py-2 text-left font-medium">L/V</th>
              <th className="px-3 py-2 text-left font-medium">Rival</th>
              <th className="px-3 py-2 text-left font-medium">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {parseResult.matches.map((m, i) => (
              <tr key={i} className="h-12 hover:bg-muted/30">
                <td className="px-3 py-2">{m.division}</td>
                <td className="px-3 py-2">{m.fecha_nro}</td>
                <td className="px-3 py-2">{m.fecha}</td>
                <td className="px-3 py-2">{m.equipo ?? '—'}</td>
                <td className="px-3 py-2">{m.local_visitante}</td>
                <td className="px-3 py-2">{m.rival}</td>
                <td className="px-3 py-2">{m.hora ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Errors section */}
      {parseResult.errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">Filas con errores (no importadas):</p>
          <div className="rounded-xl overflow-hidden ring-1 ring-destructive/30">
            <table className="w-full text-sm">
              <thead className="bg-destructive/10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-destructive">Fila</th>
                  <th className="px-3 py-2 text-left font-medium text-destructive">Error</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.errors.map((err, i) => (
                  <tr key={i} className="bg-destructive/20 text-destructive">
                    <td className="px-3 py-2">{err.row}</td>
                    <td className="px-3 py-2">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warning */}
      {parseResult.matches.length > 0 && (
        <p className="text-sm text-amber-400">
          Esto reemplazará todos los partidos URBA importados. Los partidos manuales se preservan.
        </p>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button
          className="w-full h-12"
          onClick={handleConfirm}
          disabled={parseResult.matches.length === 0 || submitting}
        >
          {submitting ? 'Importando…' : 'Confirmar import'}
        </Button>
        <Button
          className="w-full"
          variant="ghost"
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
