-- 004_indexes_and_triggers.sql — Performance indexes and updated_at triggers
-- All statements are idempotent (IF NOT EXISTS, CREATE OR REPLACE)

-- GIN index for full-text search on business name
CREATE INDEX IF NOT EXISTS idx_businesses_name
  ON businesses USING gin (to_tsvector('english', name));

-- Btree indexes for common filters and joins
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses (status);
CREATE INDEX IF NOT EXISTS idx_businesses_assigned ON businesses (assigned_to);
CREATE INDEX IF NOT EXISTS idx_interactions_business ON interactions (business_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_followup ON interactions (follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_needs_business ON business_needs (business_id);
CREATE INDEX IF NOT EXISTS idx_needs_category ON business_needs (category);
CREATE INDEX IF NOT EXISTS idx_needs_status ON business_needs (status);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to tables that have the column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_businesses'
  ) THEN
    CREATE TRIGGER set_updated_at_businesses
      BEFORE UPDATE ON businesses
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_templates'
  ) THEN
    CREATE TRIGGER set_updated_at_templates
      BEFORE UPDATE ON templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
