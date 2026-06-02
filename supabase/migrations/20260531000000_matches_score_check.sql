-- Phase 02 fix: add non-negative range CHECK constraints on score_home / score_away.
-- The original migration (20260530000000_matches.sql) omitted these constraints.
-- DB-level cap of 500 is deliberately looser than the UI's 200 to allow
-- extraordinary rugby scores without requiring another migration.

ALTER TABLE public.matches
  ADD CONSTRAINT matches_score_home_range CHECK (score_home >= 0 AND score_home <= 500),
  ADD CONSTRAINT matches_score_away_range CHECK (score_away >= 0 AND score_away <= 500);
