  -- ============================================================
  -- PadelFinder — Schema SQL Supabase
  -- À exécuter dans l'éditeur SQL de Supabase
  -- ============================================================

  -- TABLE : players (profil joueur, lié à auth.users)
  CREATE TABLE IF NOT EXISTS players (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name   TEXT NOT NULL,
    last_name    TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    city         TEXT,
    level        TEXT CHECK (level IN ('debutant','intermediaire','avance','expert')),
    avatar       TEXT DEFAULT '🧑',
    bio          TEXT,
    rating       NUMERIC(3,2) DEFAULT 0,
    matches_played INT DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  );

  -- RLS : chaque joueur voit/édite son propre profil
  ALTER TABLE players ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Players: lecture publique"
    ON players FOR SELECT USING (true);

  CREATE POLICY "Players: modification propriétaire"
    ON players FOR UPDATE USING (auth.uid() = id);

  CREATE POLICY "Players: création propriétaire"
    ON players FOR INSERT WITH CHECK (auth.uid() = id);

  -- Trigger pour mettre à jour updated_at automatiquement
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

  -- ⚠️  N'oubliez pas de récupérer votre ANON KEY dans :
  --     Supabase Dashboard → Settings → API → anon public
