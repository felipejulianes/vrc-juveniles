-- Phase 1 migration: player_positions
-- ADDITIVE ONLY: no existing infantiles tables modified.
-- Tracks rugby position 1-15 (primary + 2 alternates) per player.

CREATE TABLE IF NOT EXISTS public.player_positions (
  player_id         UUID PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  position_primary  INTEGER CHECK (position_primary BETWEEN 1 AND 15),
  position_alt1     INTEGER CHECK (position_alt1 BETWEEN 1 AND 15),
  position_alt2     INTEGER CHECK (position_alt2 BETWEEN 1 AND 15),
  notes             TEXT,
  updated_by        UUID REFERENCES public.profiles(id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.player_positions ENABLE ROW LEVEL SECURITY;

-- SELECT: admin and tutora see all; coach sees only positions of players in their assigned divisions.
DROP POLICY IF EXISTS "positions_select" ON public.player_positions;
CREATE POLICY "positions_select" ON public.player_positions FOR SELECT USING (
  public.get_user_role() IN ('admin', 'tutora')
  OR EXISTS (
    SELECT 1 FROM public.players p
    JOIN public.coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);

-- INSERT: admin OR coach for that player's division.
DROP POLICY IF EXISTS "positions_insert" ON public.player_positions;
CREATE POLICY "positions_insert" ON public.player_positions FOR INSERT WITH CHECK (
  public.get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.players p
    JOIN public.coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);

-- UPDATE: same rule as INSERT.
DROP POLICY IF EXISTS "positions_update" ON public.player_positions;
CREATE POLICY "positions_update" ON public.player_positions FOR UPDATE USING (
  public.get_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.players p
    JOIN public.coach_divisions cd ON cd.division_id = p.division_id
    WHERE p.id = player_positions.player_id AND cd.coach_id = auth.uid()
  )
);

-- DELETE: admin-only (positions can be cleared via UPDATE setting columns to NULL).
DROP POLICY IF EXISTS "positions_delete" ON public.player_positions;
CREATE POLICY "positions_delete" ON public.player_positions FOR DELETE USING (
  public.get_user_role() = 'admin'
);

-- Trigger to keep updated_at fresh on UPDATE.
CREATE OR REPLACE FUNCTION public.set_player_positions_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_player_positions_updated_at ON public.player_positions;
CREATE TRIGGER trg_player_positions_updated_at
  BEFORE UPDATE ON public.player_positions
  FOR EACH ROW EXECUTE FUNCTION public.set_player_positions_updated_at();
