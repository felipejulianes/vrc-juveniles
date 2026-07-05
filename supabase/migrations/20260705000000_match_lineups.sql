-- Phase 3 (Team Builder): match_lineups
-- ADDITIVE ONLY: tabla nueva, ninguna tabla existente de infantiles se modifica.
-- Una fila por (partido, slot). Slots 1-15 = titulares, 16-23 = suplentes.
-- Los puestos que cubre un suplente se derivan de player_positions al renderizar.

CREATE TABLE IF NOT EXISTS public.match_lineups (
  match_id   uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  slot       integer NOT NULL CHECK (slot BETWEEN 1 AND 23),
  player_id  uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, slot),
  UNIQUE (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_lineups_player ON public.match_lineups(player_id);

ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;

-- Mismo patrón que matches: admin ve todo; coach solo partidos de sus divisiones.
CREATE POLICY "lineups_read" ON public.match_lineups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE m.id = match_lineups.match_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = m.division_id
        ))
    )
  );

CREATE POLICY "lineups_insert" ON public.match_lineups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE m.id = match_lineups.match_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = m.division_id
        ))
    )
  );

CREATE POLICY "lineups_update" ON public.match_lineups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE m.id = match_lineups.match_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = m.division_id
        ))
    )
  );

-- DELETE también para coaches de la división: guardar la formación reemplaza filas.
CREATE POLICY "lineups_delete" ON public.match_lineups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE m.id = match_lineups.match_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = m.division_id
        ))
    )
  );
