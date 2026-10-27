-- ============================================================
-- SPAR SaveMor POSM Tracker - Supabase PostgreSQL Schema
-- ============================================================

-- 1. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 2. Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    town TEXT NOT NULL,
    address TEXT NOT NULL,
    contact TEXT NOT NULL,
    phone TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Hoarding Slots Table
CREATE TABLE IF NOT EXISTS public.hoarding_slots (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    width NUMERIC NOT NULL,
    height NUMERIC NOT NULL,
    unit TEXT NOT NULL DEFAULT 'ft',
    orientation TEXT NOT NULL DEFAULT 'Horizontal',
    sides INTEGER NOT NULL DEFAULT 1,
    qty INTEGER NOT NULL DEFAULT 1,
    notes TEXT
);

-- 4. Item Types Table
CREATE TABLE IF NOT EXISTS public.item_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active INTEGER DEFAULT 1
);

-- 5. Hoarding Sizes Table (Standard Master)
CREATE TABLE IF NOT EXISTS public.hoarding_sizes (
    id SERIAL PRIMARY KEY,
    width NUMERIC NOT NULL,
    height NUMERIC NOT NULL,
    unit TEXT NOT NULL DEFAULT 'ft',
    orientation TEXT NOT NULL DEFAULT 'Horizontal',
    sides INTEGER NOT NULL DEFAULT 1,
    active INTEGER DEFAULT 1
);

-- 6. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'branch')),
    branch_id INTEGER REFERENCES public.branches(id) ON DELETE SET NULL,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Issues Table
CREATE TABLE IF NOT EXISTS public.issues (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    item_type_id INTEGER NOT NULL REFERENCES public.item_types(id) ON DELETE RESTRICT,
    slot_id INTEGER REFERENCES public.hoarding_slots(id) ON DELETE SET NULL,
    campaign TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    issue_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Issued', 'Received', 'Problem', 'Cancelled')),
    note TEXT,
    attachment_url TEXT,
    created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMPTZ,
    problem_at TIMESTAMPTZ
);

-- 8. Issue Updates / History Table
CREATE TABLE IF NOT EXISTS public.issue_updates (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    comment TEXT,
    photo TEXT,
    updated_by INTEGER,
    updated_by_name TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    target_role TEXT, -- 'admin', 'user', 'branch', or NULL
    user_id INTEGER,
    branch_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    issue_id INTEGER REFERENCES public.issues(id) ON DELETE CASCADE,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Row Level Security (RLS) & Policies
-- ============================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoarding_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoarding_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Service role full access
    CREATE POLICY "Service role full access settings" ON public.settings FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access branches" ON public.branches FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access hoarding_slots" ON public.hoarding_slots FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access item_types" ON public.item_types FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access hoarding_sizes" ON public.hoarding_sizes FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access issues" ON public.issues FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access issue_updates" ON public.issue_updates FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "Service role full access notifications" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

    -- Anon/Authenticated read access policies
    CREATE POLICY "Allow read settings" ON public.settings FOR SELECT USING (true);
    CREATE POLICY "Allow read branches" ON public.branches FOR SELECT USING (true);
    CREATE POLICY "Allow read hoarding_slots" ON public.hoarding_slots FOR SELECT USING (true);
    CREATE POLICY "Allow read item_types" ON public.item_types FOR SELECT USING (true);
    CREATE POLICY "Allow read hoarding_sizes" ON public.hoarding_sizes FOR SELECT USING (true);
    CREATE POLICY "Allow read issues" ON public.issues FOR SELECT USING (true);
    CREATE POLICY "Allow read issue_updates" ON public.issue_updates FOR SELECT USING (true);
    CREATE POLICY "Allow read notifications" ON public.notifications FOR SELECT USING (true);
EXCEPTION WHEN others THEN
    NULL;
END $$;

-- ============================================================
-- Seed Initial Data
-- ============================================================

-- Settings
INSERT INTO public.settings (key, value)
VALUES 
    ('overdue_day_of_month', '2'),
    ('company_name', 'SPAR SaveMor Sri Lanka')
ON CONFLICT (key) DO NOTHING;

-- Item Types
INSERT INTO public.item_types (name, description, active)
VALUES
    ('Tabloid', 'Printed monthly promotional tabloid/newspaper', 1),
    ('Poster', 'In-store & storefront promotional posters', 1),
    ('Hoarding', 'Outdoor and rooftop billboard hoarding displays', 1),
    ('Banner', 'Fabric or vinyl event & promotional banner', 1),
    ('Wobbler', 'Shelf-edge promotional wobbler displays', 1)
ON CONFLICT (name) DO NOTHING;

-- Hoarding Sizes Master
INSERT INTO public.hoarding_sizes (width, height, unit, orientation, sides, active)
VALUES
    (12, 8, 'ft', 'Horizontal', 1, 1),
    (8, 4, 'ft', 'Vertical', 1, 1),
    (10, 5, 'ft', 'Horizontal', 2, 1),
    (6, 4, 'ft', 'Vertical', 1, 1),
    (20, 10, 'ft', 'Horizontal', 1, 1),
    (18, 8, 'ft', 'Horizontal', 1, 1);

-- 22 Branches
INSERT INTO public.branches (id, name, town, address, contact, phone, active)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Chandra Super', 'Palmadulla', 'Main Street, Palmadulla', 'Nimal Perera', '077 123 4567', 1),
    (2, 'SaveMor City', 'Colombo', 'Union Place, Colombo 02', 'Kasun Fernando', '077 234 5678', 1),
    (3, 'Galle Branch', 'Galle', 'Wakwella Road, Galle', 'Saman Kumara', '077 345 6789', 1),
    (4, 'Kandy Branch', 'Kandy', 'Peradeniya Road, Kandy', 'Ruwan Silva', '077 456 7890', 1),
    (5, 'Matara Branch', 'Matara', 'Anagarika Dharmapala Mw, Matara', 'Isuru Perera', '077 567 8901', 1),
    (6, 'Kurunegala Branch', 'Kurunegala', 'Colombo Road, Kurunegala', 'Dinesh Jayasuriya', '077 678 9012', 1),
    (7, 'Negombo Branch', 'Negombo', 'Greens Road, Negombo', 'Chamara De Silva', '077 789 0123', 1),
    (8, 'Gampaha Super', 'Gampaha', 'Yakkala Road, Gampaha', 'Pradeep Alwis', '077 890 1234', 1),
    (9, 'Kalutara Branch', 'Kalutara', 'Galle Road, Kalutara North', 'Lalith Mendis', '077 901 2345', 1),
    (10, 'Ratnapura SaveMor', 'Ratnapura', 'Hospital Road, Ratnapura', 'Ajith Bandara', '071 123 4567', 1),
    (11, 'Anuradhapura Branch', 'Anuradhapura', 'Maithripala Senanayake Mw', 'Sunil Herath', '071 234 5678', 1),
    (12, 'Badulla IR', 'Badulla', 'Lower King Street, Badulla', 'Damith Wickrama', '071 345 6789', 1),
    (13, 'Kegalle Store', 'Kegalle', 'Kandy Road, Kegalle', 'Janaka Senanayake', '071 456 7890', 1),
    (14, 'Panadura Branch', 'Panadura', 'Arthur V Dias Mw, Panadura', 'Rohan Fonseka', '071 567 8901', 1),
    (15, 'Wattala Super', 'Wattala', 'Negombo Road, Wattala', 'Ashan Rodrigo', '071 678 9012', 1),
    (16, 'Moratuwa SaveMor', 'Moratuwa', 'Old Galle Road, Moratuwa', 'Priyantha Cooray', '071 789 0123', 1),
    (17, 'Battaramulla Store', 'Battaramulla', 'Main Street, Battaramulla', 'Malik Gunaratne', '071 890 1234', 1),
    (18, 'Maharagama IR', 'Maharagama', 'High Level Road, Maharagama', 'Kavinda Abeysekara', '071 901 2345', 1),
    (19, 'Kiribathgoda (Branch A)', 'Kiribathgoda', 'Kandy Road No 19/A, Kiribathgoda', 'Nuwan Gamage', '072 123 4567', 1),
    (20, 'Kiribathgoda (Branch B)', 'Kiribathgoda', 'Kandy Road No 19/B, Kiribathgoda', 'Suranga Wijesinghe', '072 234 5678', 1),
    (21, 'Nugegoda Super', 'Nugegoda', 'Stanley Thilakarathne Mw', 'Tharindu Rathnayake', '072 345 6789', 1),
    (22, 'Bandarawela IR', 'Bandarawela', 'Badulla Road, Bandarawela', 'Chathura Ranasinghe', '072 456 7890', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('branches', 'id'), coalesce(max(id), 1)) FROM public.branches;

-- Hoarding Slots
INSERT INTO public.hoarding_slots (branch_id, width, height, unit, orientation, sides, qty, notes)
VALUES
    (1, 12, 8, 'ft', 'Horizontal', 1, 1, 'Front entrance main hoarding'),
    (1, 8, 4, 'ft', 'Vertical', 1, 2, 'Roadside vertical pillars (2 nos)'),
    (2, 18, 8, 'ft', 'Horizontal', 1, 1, 'Facade banner slot'),
    (3, 20, 10, 'ft', 'Horizontal', 1, 1, 'Roof-top main billboard'),
    (3, 10, 5, 'ft', 'Horizontal', 2, 1, 'Double-sided parking entrance display');

-- Users (password: spar123)
-- Hash: $2b$08$C30jV9HHGsi.7FvWODRsoeokde.daUjixNn3XCv6I0hHweXRHQaMK
INSERT INTO public.users (name, username, email, password_hash, role, branch_id, active)
VALUES
    ('Sanith Perera', 'admin', 'sanith@spar.lk', '$2b$08$C30jV9HHGsi.7FvWODRsoeokde.daUjixNn3XCv6I0hHweXRHQaMK', 'admin', NULL, 1),
    ('Nimal Perera (Marketing)', 'user', 'nimal@spar.lk', '$2b$08$C30jV9HHGsi.7FvWODRsoeokde.daUjixNn3XCv6I0hHweXRHQaMK', 'user', NULL, 1),
    ('Chandra Super Rep', 'chandrasuper', 'chandrasuper@savemor.lk', '$2b$08$C30jV9HHGsi.7FvWODRsoeokde.daUjixNn3XCv6I0hHweXRHQaMK', 'branch', 1, 1),
    ('SaveMor City Rep', 'savemorcity', 'savemorcity@savemor.lk', '$2b$08$C30jV9HHGsi.7FvWODRsoeokde.daUjixNn3XCv6I0hHweXRHQaMK', 'branch', 2, 1),
    ('Galle Branch Rep', 'gallebranch', 'gallebranch@savemor.lk', '$2b$08$C30jV9HHGsi.7FvWODRsoeokde.daUjixNn3XCv6I0hHweXRHQaMK', 'branch', 3, 1),
    ('Kandy Branch Rep', 'kandybranch', 'kandybranch@savemor.lk', '$2b$08$C30jV9HHGsi.7FvWODRsoeokde.daUjixNn3XCv6I0hHweXRHQaMK', 'branch', 4, 1),
    ('Matara Branch Rep', 'matarabranch', 'matarabranch@savemor.lk', '$2b$08$C30jV9HHGsi.7FvWODRsoeokde.daUjixNn3XCv6I0hHweXRHQaMK', 'branch', 5, 1)
ON CONFLICT (username) DO NOTHING;

-- Seed Sample Issues for October 2026
INSERT INTO public.issues (id, branch_id, item_type_id, slot_id, campaign, qty, issue_date, status, note, created_by, received_at, problem_at)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 1, 1, NULL, 'Monthly Tabloid 500 pcs', 500, '2026-10-01', 'Received', 'October monthly promotional tabloid pack', 1, '2026-10-02 14:30:00+00', NULL),
    (2, 1, 3, 1, 'Autumn Promo Hoarding', 1, '2026-10-05', 'Problem', '12x8 ft hoarding print for Autumn campaign', 1, NULL, '2026-10-07 11:15:00+00'),
    (3, 1, 2, NULL, 'Festival Poster Campaign', 10, '2026-10-14', 'Pending', 'A3 Festival posters - scheduled for delivery', 1, NULL, NULL),
    (4, 1, 2, NULL, 'October Campaign Posters', 4, '2026-10-26', 'Issued', 'Seasonal offer store display posters', 1, NULL, NULL),
    (5, 2, 3, NULL, 'Mega Sale Hoarding', 1, '2026-10-08', 'Problem', 'Main front road hoarding print', 1, NULL, '2026-10-10 16:00:00+00'),
    (6, 3, 2, NULL, 'Bakery Month Posters', 6, '2026-09-24', 'Issued', 'Bakery special promotional boards', 1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('issues', 'id'), coalesce(max(id), 1)) FROM public.issues;

-- Seed Updates
INSERT INTO public.issue_updates (issue_id, status, comment, updated_by, updated_by_name, updated_at)
VALUES
    (1, 'Issued', 'Dispatched via Courier #SP-9921', 1, 'Sanith Perera', '2026-10-01 09:00:00+00'),
    (1, 'Received', 'All 500 pcs received in good condition at cashier desk.', NULL, 'Chandra Super Rep', '2026-10-02 14:30:00+00'),
    (2, 'Issued', 'Delivered by printing vendor direct to store', 1, 'Sanith Perera', '2026-10-05 10:00:00+00'),
    (2, 'Problem', 'Damaged vinyl in transit - cut mark on the bottom right corner.', NULL, 'Chandra Super Rep', '2026-10-07 11:15:00+00'),
    (4, 'Issued', 'Dispatched with logistics team morning dispatch', 1, 'Sanith Perera', '2026-10-26 08:30:00+00'),
    (5, 'Issued', 'Dispatched with installation team', 1, 'Sanith Perera', '2026-10-08 09:00:00+00'),
    (5, 'Problem', 'Wrong size delivered - received 16x8 instead of 20x10 ft.', NULL, 'SaveMor City Rep', '2026-10-10 16:00:00+00'),
    (6, 'Issued', 'Sent via postal dispatch parcel', 1, 'Sanith Perera', '2026-09-24 11:00:00+00');

-- Seed Notifications
INSERT INTO public.notifications (target_role, user_id, branch_id, title, message, issue_id, is_read, created_at)
VALUES
    ('admin', NULL, NULL, 'New Item Issued', 'Tabloid - 22 branches issued for October Campaign', 4, 0, '2026-10-26 09:30:00+00'),
    ('admin', NULL, NULL, 'Problem reported', 'SaveMor City reported Problem: Hoarding - Wrong size delivered', 5, 0, '2026-10-10 16:05:00+00'),
    ('admin', NULL, NULL, 'Overdue Items Flagged', '6 items from September not confirmed by 2nd Oct', 6, 0, '2026-10-02 08:00:00+00'),
    ('branch', NULL, 1, 'New POSM Issued', 'October Campaign Posters (4 pcs) dispatched to your branch.', 4, 0, '2026-10-26 09:35:00+00');
