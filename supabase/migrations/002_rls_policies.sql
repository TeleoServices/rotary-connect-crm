-- 002_rls_policies.sql — RLS + SECURITY DEFINER helper functions
-- All statements are idempotent (DROP IF EXISTS + CREATE)

-- ============================================================
-- SECURITY DEFINER functions (bypass RLS to check team_members)
-- These MUST be SECURITY DEFINER to avoid infinite recursion
-- when used in policies on team_members itself.
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION is_lead_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE id = auth.uid()
      AND role IN ('admin', 'lead')
      AND is_active = true
  );
$$;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- businesses policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read businesses" ON businesses;
CREATE POLICY "Authenticated users can read businesses" ON businesses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members can insert businesses" ON businesses;
CREATE POLICY "Members can insert businesses" ON businesses
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Members can update assigned businesses" ON businesses;
CREATE POLICY "Members can update assigned businesses" ON businesses
  FOR UPDATE TO authenticated USING (assigned_to = auth.uid());

DROP POLICY IF EXISTS "Leads can manage businesses" ON businesses;
CREATE POLICY "Leads can manage businesses" ON businesses
  FOR ALL TO authenticated
  USING (is_lead_or_admin())
  WITH CHECK (is_lead_or_admin());

-- ============================================================
-- interactions policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read interactions" ON interactions;
CREATE POLICY "Authenticated users can read interactions" ON interactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members can insert interactions" ON interactions;
CREATE POLICY "Members can insert interactions" ON interactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can update own interactions" ON interactions;
CREATE POLICY "Members can update own interactions" ON interactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- business_needs policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read needs" ON business_needs;
CREATE POLICY "Authenticated users can read needs" ON business_needs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members can insert needs" ON business_needs;
CREATE POLICY "Members can insert needs" ON business_needs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = identified_by);

DROP POLICY IF EXISTS "Members can update own needs" ON business_needs;
CREATE POLICY "Members can update own needs" ON business_needs
  FOR UPDATE TO authenticated USING (auth.uid() = identified_by);

-- ============================================================
-- templates policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read templates" ON templates;
CREATE POLICY "Authenticated users can read templates" ON templates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins full access templates" ON templates;
CREATE POLICY "Admins full access templates" ON templates
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- team_members policies
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read team" ON team_members;
CREATE POLICY "Authenticated users can read team" ON team_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON team_members;
CREATE POLICY "Users can insert own profile" ON team_members
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON team_members;
CREATE POLICY "Users can update own profile" ON team_members
  FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage team" ON team_members;
CREATE POLICY "Admins can manage team" ON team_members
  FOR UPDATE TO authenticated USING (is_admin() OR (id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete team" ON team_members;
CREATE POLICY "Admins can delete team" ON team_members
  FOR DELETE TO authenticated USING (is_admin());
