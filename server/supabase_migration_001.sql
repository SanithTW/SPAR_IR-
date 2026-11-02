-- ============================================================
-- SPAR POSM Tracker - Migration 001
-- Brings the Supabase schema in line with the app so Supabase can
-- be the only database. Safe to run more than once.
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- Columns the app uses that the original Supabase schema lacked
ALTER TABLE public.users    ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users    ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS opening_date TEXT;

-- Private label assets
CREATE TABLE IF NOT EXISTS public.private_labels (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_private_labels_category   ON public.private_labels(category);
CREATE INDEX IF NOT EXISTS idx_private_labels_created_at ON public.private_labels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_branch_id          ON public.issues(branch_id);
CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_id    ON public.issue_updates(issue_id);

-- The API server uses the service_role key, which bypasses RLS.
-- RLS stays on with no anon write policies so the public anon key cannot modify data.
ALTER TABLE public.private_labels ENABLE ROW LEVEL SECURITY;

-- Refresh the API schema cache so the new table/columns are visible immediately
NOTIFY pgrst, 'reload schema';
