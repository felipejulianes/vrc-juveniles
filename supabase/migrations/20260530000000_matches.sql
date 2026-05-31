-- Phase 02 Plan 01: matches + match_scoring_events
-- Adds the fixture (calendar of matches) and rugby scoring events tables.
-- RLS replicates the pattern from training_sessions: explicit JOIN with profiles + coach_divisions.

-- ─── matches ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id   uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  match_date    date NOT NULL,
  match_time    time,
  fecha_nro     integer,
  rival         text NOT NULL,
  home_away     text NOT NULL CHECK (home_away IN ('local', 'visitante')),
  venue         text,
  subequipo     text,
  score_home    integer,
  score_away    integer,
  manual        boolean NOT NULL DEFAULT false,
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_score_consistency CHECK (
    (score_home IS NULL AND score_away IS NULL)
    OR (score_home IS NOT NULL AND score_away IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_matches_division_date ON public.matches(division_id, match_date);
CREATE INDEX IF NOT EXISTS idx_matches_manual ON public.matches(manual);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.matches_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_matches_updated_at ON public.matches;
CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.matches_set_updated_at();

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_read" ON public.matches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.coach_divisions
      WHERE coach_id = auth.uid() AND division_id = matches.division_id
    )
  );

CREATE POLICY "matches_insert" ON public.matches
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.coach_divisions
      WHERE coach_id = auth.uid() AND division_id = matches.division_id
    )
  );

CREATE POLICY "matches_update" ON public.matches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.coach_divisions
      WHERE coach_id = auth.uid() AND division_id = matches.division_id
    )
  );

CREATE POLICY "matches_delete" ON public.matches
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── match_scoring_events ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_scoring_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team         text NOT NULL CHECK (team IN ('home', 'away')),
  event_type   text NOT NULL CHECK (event_type IN ('try', 'conversion', 'penalty', 'drop', 'yellow_card', 'red_card')),
  player_id    uuid REFERENCES public.players(id) ON DELETE SET NULL,
  rival_scorer text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_match ON public.match_scoring_events(match_id);

ALTER TABLE public.match_scoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoring_read" ON public.match_scoring_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE m.id = match_scoring_events.match_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = m.division_id
        ))
    )
  );

CREATE POLICY "scoring_insert" ON public.match_scoring_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE m.id = match_scoring_events.match_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = m.division_id
        ))
    )
  );

CREATE POLICY "scoring_update" ON public.match_scoring_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE m.id = match_scoring_events.match_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = m.division_id
        ))
    )
  );

CREATE POLICY "scoring_delete" ON public.match_scoring_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE m.id = match_scoring_events.match_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = m.division_id
        ))
    )
  );
