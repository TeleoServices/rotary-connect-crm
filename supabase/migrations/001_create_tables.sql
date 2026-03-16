-- 001_create_tables.sql — Core tables for RotaryConnect CRM
-- All statements are idempotent (IF NOT EXISTS)

-- Businesses directory
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  address text,
  city text,
  state text DEFAULT 'XX',
  zip text,
  phone text,
  email text,
  website text,
  contact_name text,
  contact_title text,
  source text,
  status text DEFAULT 'new' CHECK (status IN ('new','contacted','in_progress','partner','inactive')),
  assigned_to uuid,
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interactions / activity log
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid,
  type text NOT NULL CHECK (type IN ('call','email','visit','meeting','note')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  subject text,
  notes text,
  outcome text,
  follow_up_date date,
  created_at timestamptz DEFAULT now()
);

-- Business needs
CREATE TABLE IF NOT EXISTS business_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('advertising','networking','training','technology','community','financial','mentorship','other')),
  description text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text DEFAULT 'identified' CHECK (status IN ('identified','researching','solution_proposed','resolved','deferred')),
  identified_by uuid,
  identified_date date DEFAULT CURRENT_DATE,
  resolution text,
  resolved_date date,
  created_at timestamptz DEFAULT now()
);

-- Email/script templates
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('intro_email','follow_up_email','needs_email','cold_call','follow_up_call','visit_script')),
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  merge_fields text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team members / user profiles
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY,  -- matches auth.users.id
  full_name text NOT NULL,
  email text,
  phone text,
  role text DEFAULT 'member' CHECK (role IN ('admin','lead','member')),
  team text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
