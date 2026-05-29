-- Add apto_medico field to players table
-- Tracks whether the player has submitted their medical certificate (required for URBA matches)
ALTER TABLE players ADD COLUMN IF NOT EXISTS apto_medico boolean NOT NULL DEFAULT false;
