-- ============================================================
-- SPAR POSM Tracker - Migration 002: Leaflets library
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to run more than once.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leaflets (
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

CREATE INDEX IF NOT EXISTS idx_leaflets_category ON public.leaflets(category);

-- The API server uses the service_role key (bypasses RLS); no anon write access.
ALTER TABLE public.leaflets ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
