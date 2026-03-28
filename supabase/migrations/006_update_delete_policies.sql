-- Allow any authenticated team member to update/delete interactions and needs
-- Small team: mistakes need to be correctable by anyone

-- Interactions: replace "own only" update with team-wide, add delete
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interactions' AND policyname = 'Members can update own interactions') THEN
    DROP POLICY "Members can update own interactions" ON interactions;
  END IF;
END $$;

CREATE POLICY IF NOT EXISTS "Members can update any interaction"
  ON interactions FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Members can delete any interaction"
  ON interactions FOR DELETE TO authenticated
  USING (true);

-- Business needs: replace "own only" update with team-wide, add delete
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_needs' AND policyname = 'Members can update own needs') THEN
    DROP POLICY "Members can update own needs" ON business_needs;
  END IF;
END $$;

CREATE POLICY IF NOT EXISTS "Members can update any need"
  ON business_needs FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Members can delete any need"
  ON business_needs FOR DELETE TO authenticated
  USING (true);
