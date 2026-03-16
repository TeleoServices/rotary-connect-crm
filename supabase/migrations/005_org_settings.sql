-- 005: org_settings table for persistent organization configuration
-- Idempotent — safe to re-run

CREATE TABLE IF NOT EXISTS org_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL DEFAULT 'Rotary Club',
  default_city text NOT NULL DEFAULT '',
  default_state text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
DO $$ BEGIN
  CREATE POLICY "org_settings_select" ON org_settings FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- All authenticated users can update (admin check can be added later)
DO $$ BEGIN
  CREATE POLICY "org_settings_update" ON org_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed a single row if empty
INSERT INTO org_settings (org_name, default_city, default_state)
SELECT 'Rotary Club', '', ''
WHERE NOT EXISTS (SELECT 1 FROM org_settings);
