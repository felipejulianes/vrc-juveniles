-- Training sessions table
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  session_type text NOT NULL DEFAULT 'entrenamiento',
  day_label text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- Coaches can read/write sessions for their divisions; admins see all
CREATE POLICY "coaches_read_sessions" ON public.training_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.coach_divisions
      WHERE coach_id = auth.uid() AND division_id = training_sessions.division_id
    )
  );

CREATE POLICY "coaches_insert_sessions" ON public.training_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.coach_divisions
      WHERE coach_id = auth.uid() AND division_id = training_sessions.division_id
    )
  );

CREATE POLICY "coaches_update_sessions" ON public.training_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.coach_divisions
      WHERE coach_id = auth.uid() AND division_id = training_sessions.division_id
    )
  );

-- Attendance records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  present boolean NOT NULL DEFAULT false,
  recorded_by uuid REFERENCES public.profiles(id),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, player_id)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_read_attendance" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE ts.id = attendance_records.session_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = ts.division_id
        ))
    )
  );

CREATE POLICY "coaches_upsert_attendance" ON public.attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE ts.id = attendance_records.session_id
        AND (p.role = 'admin' OR EXISTS (
          SELECT 1 FROM public.coach_divisions cd
          WHERE cd.coach_id = auth.uid() AND cd.division_id = ts.division_id
        ))
    )
  );
