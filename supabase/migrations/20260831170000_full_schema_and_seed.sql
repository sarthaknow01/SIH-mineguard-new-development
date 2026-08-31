-- MineGuard Full Schema and Seed Migration
-- Target Project: pojjhykcgoyjdqhvjsst

-- 1. MINES TABLE
CREATE TABLE IF NOT EXISTS public.mines (
    mine_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    mine_name TEXT NOT NULL,
    location TEXT,
    type TEXT,
    status TEXT DEFAULT 'ACTIVE',
    compliance_score INT DEFAULT 80,
    risk_level TEXT DEFAULT 'LOW',
    officer TEXT,
    officer_id TEXT,
    workers_count INT DEFAULT 20,
    active_violations INT DEFAULT 0,
    pending_actions INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ZONES TABLE
CREATE TABLE IF NOT EXISTS public.zones (
    zone_id TEXT PRIMARY KEY,
    mine_id TEXT NOT NULL REFERENCES public.mines(mine_id) ON DELETE CASCADE,
    zone_code TEXT NOT NULL,
    zone_name TEXT NOT NULL,
    area TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKERS TABLE
CREATE TABLE IF NOT EXISTS public.workers (
    worker_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mine_id TEXT NOT NULL REFERENCES public.mines(mine_id) ON DELETE CASCADE,
    mine_name TEXT,
    zone_id TEXT NOT NULL REFERENCES public.zones(zone_id) ON DELETE CASCADE,
    zone_name TEXT,
    area TEXT,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    joining_date TEXT,
    blood_group TEXT,
    contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STAFF PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    profile_id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    designation TEXT,
    mine_id TEXT REFERENCES public.mines(mine_id) ON DELETE SET NULL,
    mine_name TEXT,
    badge TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    certificate_id TEXT PRIMARY KEY,
    worker_id TEXT NOT NULL REFERENCES public.workers(worker_id) ON DELETE CASCADE,
    worker_name TEXT,
    certificate_type TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    status TEXT NOT NULL,
    assessment_status TEXT DEFAULT 'PASSED',
    file_reference_id TEXT,
    issuing_authority TEXT,
    document_url TEXT,
    verification_status TEXT,
    mine_id TEXT REFERENCES public.mines(mine_id),
    zone_id TEXT REFERENCES public.zones(zone_id),
    area TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inspections (
    inspection_id TEXT PRIMARY KEY,
    mine_id TEXT NOT NULL REFERENCES public.mines(mine_id),
    mine_name TEXT,
    area TEXT,
    zone_id TEXT REFERENCES public.zones(zone_id),
    date TEXT,
    inspection_type TEXT,
    overall_result TEXT DEFAULT 'COMPLETED',
    inspector_id TEXT REFERENCES public.staff_profiles(profile_id),
    inspector_name TEXT,
    checklist_results JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VIOLATIONS TABLE
CREATE TABLE IF NOT EXISTS public.violations (
    violation_id TEXT PRIMARY KEY,
    mine_id TEXT NOT NULL REFERENCES public.mines(mine_id),
    mine_name TEXT,
    area TEXT,
    zone_id TEXT REFERENCES public.zones(zone_id),
    category TEXT,
    severity TEXT,
    worker_id TEXT REFERENCES public.workers(worker_id),
    worker_name TEXT,
    certificate_id TEXT REFERENCES public.certificates(certificate_id),
    description TEXT,
    reported_by TEXT,
    reported_date TEXT,
    status TEXT DEFAULT 'OPEN',
    evidence TEXT,
    risk_score INT,
    risk_level TEXT,
    ai_explanation TEXT,
    inspection_id TEXT REFERENCES public.inspections(inspection_id),
    resolved_date TEXT,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CORRECTIVE ACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.corrective_actions (
    action_id TEXT PRIMARY KEY,
    violation_id TEXT REFERENCES public.violations(violation_id),
    mine_id TEXT REFERENCES public.mines(mine_id),
    title TEXT,
    description TEXT,
    assigned_to TEXT,
    due_date TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'IN PROGRESS',
    created_date TEXT,
    completion_notes TEXT,
    evidence TEXT,
    resolved_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    alert_id TEXT PRIMARY KEY,
    mine_id TEXT REFERENCES public.mines(mine_id),
    violation_id TEXT REFERENCES public.violations(violation_id),
    related_entity TEXT,
    title TEXT,
    message TEXT,
    description TEXT,
    type TEXT DEFAULT 'VIOLATION_REPORTED',
    severity TEXT DEFAULT 'MEDIUM',
    timestamp TEXT,
    created_date TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'UNREAD',
    target_roles JSONB DEFAULT '["officer", "management", "authority", "inspector"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SOS ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.sos_alerts (
    alert_id TEXT PRIMARY KEY,
    inspector_name TEXT,
    inspector_id TEXT,
    mine_name TEXT,
    mine_id TEXT REFERENCES public.mines(mine_id),
    timestamp TEXT,
    status TEXT DEFAULT 'ACTIVE',
    acknowledged_by TEXT,
    acknowledged_at TEXT,
    acknowledged_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FILE REFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.file_references (
    file_id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    r2_object_key TEXT NOT NULL,
    file_url TEXT,
    uploaded_by TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    related_record_type TEXT NOT NULL,
    related_record_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS public.audit_trail (
    audit_id TEXT PRIMARY KEY,
    timestamp TEXT,
    actor TEXT,
    role TEXT,
    action TEXT,
    details TEXT,
    mine_id TEXT REFERENCES public.mines(mine_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.mines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES FOR DEMO PROTOTYPE COMPATIBILITY
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow public read %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow public read %I" ON public.%I FOR SELECT USING (true)', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Allow public insert %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow public insert %I" ON public.%I FOR INSERT WITH CHECK (true)', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Allow public update %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow public update %I" ON public.%I FOR UPDATE USING (true)', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Allow public delete %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow public delete %I" ON public.%I FOR DELETE USING (true)', tbl, tbl);
    END LOOP;
END $$;

-- ENABLE SUPABASE REALTIME FOR SOS ALERTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'sos_alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
    END IF;
END $$;

-- SEED DATA INSERTIONS (IDEMPOTENT VIA ON CONFLICT DO UPDATE)

-- 1. SEED MINES
INSERT INTO public.mines (mine_id, code, mine_name, location, type, status, compliance_score, risk_level, officer, officer_id, workers_count, active_violations, pending_actions)
VALUES ('MINE-01', 'M01', 'Demo Mine Alpha', 'Dhanbad Coalfield, Jharkhand', 'Underground & Opencast', NULL, 88, 'LOW', 'Rajesh Deshmukh', 'MO-001', 20, 1, 1)
ON CONFLICT (mine_id) DO UPDATE SET mine_name = EXCLUDED.mine_name, compliance_score = EXCLUDED.compliance_score;
INSERT INTO public.mines (mine_id, code, mine_name, location, type, status, compliance_score, risk_level, officer, officer_id, workers_count, active_violations, pending_actions)
VALUES ('MINE-02', 'M02', 'Demo Mine Beta', 'Raniganj Basin, West Bengal', 'Opencast Mining', NULL, 82, 'LOW', 'Anil Sengupta', 'MO-002', 20, 1, 1)
ON CONFLICT (mine_id) DO UPDATE SET mine_name = EXCLUDED.mine_name, compliance_score = EXCLUDED.compliance_score;
INSERT INTO public.mines (mine_id, code, mine_name, location, type, status, compliance_score, risk_level, officer, officer_id, workers_count, active_violations, pending_actions)
VALUES ('MINE-03', 'M03', 'Demo Mine Gamma', 'Singrauli Coal Belt, Madhya Pradesh', 'Deep Underground Shaft', NULL, 61, 'HIGH', 'Rajesh Trivedi', 'MO-003', 20, 2, 1)
ON CONFLICT (mine_id) DO UPDATE SET mine_name = EXCLUDED.mine_name, compliance_score = EXCLUDED.compliance_score;
INSERT INTO public.mines (mine_id, code, mine_name, location, type, status, compliance_score, risk_level, officer, officer_id, workers_count, active_violations, pending_actions)
VALUES ('MINE-04', 'M04', 'Demo Mine Delta', 'Korba Industrial Belt, Chhattisgarh', 'Opencast Mechanized', NULL, 91, 'LOW', 'Kavita Raman', 'MO-004', 20, 0, 0)
ON CONFLICT (mine_id) DO UPDATE SET mine_name = EXCLUDED.mine_name, compliance_score = EXCLUDED.compliance_score;
INSERT INTO public.mines (mine_id, code, mine_name, location, type, status, compliance_score, risk_level, officer, officer_id, workers_count, active_violations, pending_actions)
VALUES ('MINE-05', 'M05', 'Demo Mine Epsilon', 'Talcher Coalfields, Odisha', 'Underground Continuous Miner', NULL, 73, 'MEDIUM', 'Bikram Mohanty', 'MO-005', 20, 1, 1)
ON CONFLICT (mine_id) DO UPDATE SET mine_name = EXCLUDED.mine_name, compliance_score = EXCLUDED.compliance_score;

-- 2. SEED ZONES
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M01-Z1', 'MINE-01', 'Z1', 'North Shaft', 'North Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M01-Z2', 'MINE-01', 'Z2', 'South Shaft', 'South Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M01-Z3', 'MINE-01', 'Z3', 'Processing Plant', 'Processing Plant')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M01-Z4', 'MINE-01', 'Z4', 'Substation', 'Substation')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M02-Z1', 'MINE-02', 'Z1', 'North Shaft', 'North Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M02-Z2', 'MINE-02', 'Z2', 'South Shaft', 'South Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M02-Z3', 'MINE-02', 'Z3', 'Processing Plant', 'Processing Plant')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M02-Z4', 'MINE-02', 'Z4', 'Workshop', 'Workshop')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M03-Z1', 'MINE-03', 'Z1', 'North Shaft', 'North Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M03-Z2', 'MINE-03', 'Z2', 'South Shaft', 'South Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M03-Z3', 'MINE-03', 'Z3', 'Processing Plant', 'Processing Plant')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M03-Z4', 'MINE-03', 'Z4', 'Substation', 'Substation')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M04-Z1', 'MINE-04', 'Z1', 'North Shaft', 'North Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M04-Z2', 'MINE-04', 'Z2', 'South Shaft', 'South Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M04-Z3', 'MINE-04', 'Z3', 'Processing Plant', 'Processing Plant')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M04-Z4', 'MINE-04', 'Z4', 'Workshop', 'Workshop')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M05-Z1', 'MINE-05', 'Z1', 'North Shaft', 'North Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M05-Z2', 'MINE-05', 'Z2', 'South Shaft', 'South Shaft')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M05-Z3', 'MINE-05', 'Z3', 'Processing Plant', 'Processing Plant')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;
INSERT INTO public.zones (zone_id, mine_id, zone_code, zone_name, area)
VALUES ('M05-Z4', 'MINE-05', 'Z4', 'Substation', 'Substation')
ON CONFLICT (zone_id) DO UPDATE SET zone_name = EXCLUDED.zone_name;

-- 3. SEED WORKERS
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20001', 'Rahul Patil', 'MINE-01', 'Demo Mine Alpha', 'M01-Z1', 'North Shaft', 'North Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0001')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20002', 'Amit Patil', 'MINE-01', 'Demo Mine Alpha', 'M01-Z1', 'North Shaft', 'North Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0002')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20003', 'Suresh Patil', 'MINE-01', 'Demo Mine Alpha', 'M01-Z1', 'North Shaft', 'North Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0003')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20004', 'Vikas Patil', 'MINE-01', 'Demo Mine Alpha', 'M01-Z1', 'North Shaft', 'North Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0004')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20005', 'Arjun Patil', 'MINE-01', 'Demo Mine Alpha', 'M01-Z1', 'North Shaft', 'North Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0005')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20006', 'Rohan Shinde', 'MINE-01', 'Demo Mine Alpha', 'M01-Z2', 'South Shaft', 'South Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0006')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20007', 'Manoj Shinde', 'MINE-01', 'Demo Mine Alpha', 'M01-Z2', 'South Shaft', 'South Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0007')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20008', 'Kiran Shinde', 'MINE-01', 'Demo Mine Alpha', 'M01-Z2', 'South Shaft', 'South Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0008')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20009', 'Deepak Shinde', 'MINE-01', 'Demo Mine Alpha', 'M01-Z2', 'South Shaft', 'South Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0009')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20010', 'Nitin Shinde', 'MINE-01', 'Demo Mine Alpha', 'M01-Z2', 'South Shaft', 'South Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0010')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20011', 'Sanjay Jadhav', 'MINE-01', 'Demo Mine Alpha', 'M01-Z3', 'Processing Plant', 'Processing Plant', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0011')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20012', 'Vijay Jadhav', 'MINE-01', 'Demo Mine Alpha', 'M01-Z3', 'Processing Plant', 'Processing Plant', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0012')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20013', 'Prakash Jadhav', 'MINE-01', 'Demo Mine Alpha', 'M01-Z3', 'Processing Plant', 'Processing Plant', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0013')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20014', 'Sunil Jadhav', 'MINE-01', 'Demo Mine Alpha', 'M01-Z3', 'Processing Plant', 'Processing Plant', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0014')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20015', 'Anil Jadhav', 'MINE-01', 'Demo Mine Alpha', 'M01-Z3', 'Processing Plant', 'Processing Plant', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0015')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20016', 'Rajesh Pawar', 'MINE-01', 'Demo Mine Alpha', 'M01-Z4', 'Substation', 'Substation', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0016')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20017', 'Dinesh Pawar', 'MINE-01', 'Demo Mine Alpha', 'M01-Z4', 'Substation', 'Substation', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0017')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20018', 'Ramesh Pawar', 'MINE-01', 'Demo Mine Alpha', 'M01-Z4', 'Substation', 'Substation', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0018')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20019', 'Mahesh Pawar', 'MINE-01', 'Demo Mine Alpha', 'M01-Z4', 'Substation', 'Substation', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0019')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20020', 'Ganesh Pawar', 'MINE-01', 'Demo Mine Alpha', 'M01-Z4', 'Substation', 'Substation', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0020')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20021', 'Rahul Kulkarni', 'MINE-02', 'Demo Mine Beta', 'M02-Z1', 'North Shaft', 'North Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0021')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20022', 'Amit Kulkarni', 'MINE-02', 'Demo Mine Beta', 'M02-Z1', 'North Shaft', 'North Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0022')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20023', 'Suresh Kulkarni', 'MINE-02', 'Demo Mine Beta', 'M02-Z1', 'North Shaft', 'North Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0023')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20024', 'Vikas Kulkarni', 'MINE-02', 'Demo Mine Beta', 'M02-Z1', 'North Shaft', 'North Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0024')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20025', 'Arjun Kulkarni', 'MINE-02', 'Demo Mine Beta', 'M02-Z1', 'North Shaft', 'North Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0025')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20026', 'Rohan Deshmukh', 'MINE-02', 'Demo Mine Beta', 'M02-Z2', 'South Shaft', 'South Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0026')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20027', 'Manoj Deshmukh', 'MINE-02', 'Demo Mine Beta', 'M02-Z2', 'South Shaft', 'South Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0027')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20028', 'Kiran Deshmukh', 'MINE-02', 'Demo Mine Beta', 'M02-Z2', 'South Shaft', 'South Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0028')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20029', 'Deepak Deshmukh', 'MINE-02', 'Demo Mine Beta', 'M02-Z2', 'South Shaft', 'South Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0029')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20030', 'Nitin Deshmukh', 'MINE-02', 'Demo Mine Beta', 'M02-Z2', 'South Shaft', 'South Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0030')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20031', 'Sanjay Deshpande', 'MINE-02', 'Demo Mine Beta', 'M02-Z3', 'Processing Plant', 'Processing Plant', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0031')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20032', 'Vijay Deshpande', 'MINE-02', 'Demo Mine Beta', 'M02-Z3', 'Processing Plant', 'Processing Plant', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0032')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20033', 'Prakash Deshpande', 'MINE-02', 'Demo Mine Beta', 'M02-Z3', 'Processing Plant', 'Processing Plant', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0033')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20034', 'Sunil Deshpande', 'MINE-02', 'Demo Mine Beta', 'M02-Z3', 'Processing Plant', 'Processing Plant', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0034')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20035', 'Anil Deshpande', 'MINE-02', 'Demo Mine Beta', 'M02-Z3', 'Processing Plant', 'Processing Plant', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0035')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20036', 'Rajesh Joshi', 'MINE-02', 'Demo Mine Beta', 'M02-Z4', 'Workshop', 'Workshop', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0036')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20037', 'Dinesh Joshi', 'MINE-02', 'Demo Mine Beta', 'M02-Z4', 'Workshop', 'Workshop', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0037')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20038', 'Ramesh Joshi', 'MINE-02', 'Demo Mine Beta', 'M02-Z4', 'Workshop', 'Workshop', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0038')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20039', 'Mahesh Joshi', 'MINE-02', 'Demo Mine Beta', 'M02-Z4', 'Workshop', 'Workshop', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0039')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20040', 'Ganesh Joshi', 'MINE-02', 'Demo Mine Beta', 'M02-Z4', 'Workshop', 'Workshop', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0040')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20041', 'Rahul Chavan', 'MINE-03', 'Demo Mine Gamma', 'M03-Z1', 'North Shaft', 'North Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0041')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20042', 'Amit Chavan', 'MINE-03', 'Demo Mine Gamma', 'M03-Z1', 'North Shaft', 'North Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0042')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20043', 'Suresh Chavan', 'MINE-03', 'Demo Mine Gamma', 'M03-Z1', 'North Shaft', 'North Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0043')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20044', 'Vikas Chavan', 'MINE-03', 'Demo Mine Gamma', 'M03-Z1', 'North Shaft', 'North Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0044')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20045', 'Arjun Chavan', 'MINE-03', 'Demo Mine Gamma', 'M03-Z1', 'North Shaft', 'North Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0045')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20046', 'Rohan Gaikwad', 'MINE-03', 'Demo Mine Gamma', 'M03-Z2', 'South Shaft', 'South Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0046')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20047', 'Manoj Gaikwad', 'MINE-03', 'Demo Mine Gamma', 'M03-Z2', 'South Shaft', 'South Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0047')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20048', 'Kiran Gaikwad', 'MINE-03', 'Demo Mine Gamma', 'M03-Z2', 'South Shaft', 'South Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0048')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20049', 'Deepak Gaikwad', 'MINE-03', 'Demo Mine Gamma', 'M03-Z2', 'South Shaft', 'South Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0049')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20050', 'Nitin Gaikwad', 'MINE-03', 'Demo Mine Gamma', 'M03-Z2', 'South Shaft', 'South Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0050')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20051', 'Sanjay More', 'MINE-03', 'Demo Mine Gamma', 'M03-Z3', 'Processing Plant', 'Processing Plant', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0051')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20052', 'Vijay More', 'MINE-03', 'Demo Mine Gamma', 'M03-Z3', 'Processing Plant', 'Processing Plant', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0052')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20053', 'Prakash More', 'MINE-03', 'Demo Mine Gamma', 'M03-Z3', 'Processing Plant', 'Processing Plant', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0053')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20054', 'Sunil More', 'MINE-03', 'Demo Mine Gamma', 'M03-Z3', 'Processing Plant', 'Processing Plant', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0054')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20055', 'Anil More', 'MINE-03', 'Demo Mine Gamma', 'M03-Z3', 'Processing Plant', 'Processing Plant', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0055')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20056', 'Rajesh Kadam', 'MINE-03', 'Demo Mine Gamma', 'M03-Z4', 'Substation', 'Substation', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0056')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20057', 'Dinesh Kadam', 'MINE-03', 'Demo Mine Gamma', 'M03-Z4', 'Substation', 'Substation', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0057')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20058', 'Ramesh Kadam', 'MINE-03', 'Demo Mine Gamma', 'M03-Z4', 'Substation', 'Substation', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0058')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20059', 'Mahesh Kadam', 'MINE-03', 'Demo Mine Gamma', 'M03-Z4', 'Substation', 'Substation', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0059')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20060', 'Ganesh Kadam', 'MINE-03', 'Demo Mine Gamma', 'M03-Z4', 'Substation', 'Substation', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0060')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20061', 'Rahul Raut', 'MINE-04', 'Demo Mine Delta', 'M04-Z1', 'North Shaft', 'North Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0061')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20062', 'Amit Raut', 'MINE-04', 'Demo Mine Delta', 'M04-Z1', 'North Shaft', 'North Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0062')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20063', 'Suresh Raut', 'MINE-04', 'Demo Mine Delta', 'M04-Z1', 'North Shaft', 'North Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0063')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20064', 'Vikas Raut', 'MINE-04', 'Demo Mine Delta', 'M04-Z1', 'North Shaft', 'North Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0064')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20065', 'Arjun Raut', 'MINE-04', 'Demo Mine Delta', 'M04-Z1', 'North Shaft', 'North Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0065')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20066', 'Rohan Bhosale', 'MINE-04', 'Demo Mine Delta', 'M04-Z2', 'South Shaft', 'South Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0066')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20067', 'Manoj Bhosale', 'MINE-04', 'Demo Mine Delta', 'M04-Z2', 'South Shaft', 'South Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0067')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20068', 'Kiran Bhosale', 'MINE-04', 'Demo Mine Delta', 'M04-Z2', 'South Shaft', 'South Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0068')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20069', 'Deepak Bhosale', 'MINE-04', 'Demo Mine Delta', 'M04-Z2', 'South Shaft', 'South Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0069')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20070', 'Nitin Bhosale', 'MINE-04', 'Demo Mine Delta', 'M04-Z2', 'South Shaft', 'South Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0070')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20071', 'Sanjay Sawant', 'MINE-04', 'Demo Mine Delta', 'M04-Z3', 'Processing Plant', 'Processing Plant', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0071')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20072', 'Vijay Sawant', 'MINE-04', 'Demo Mine Delta', 'M04-Z3', 'Processing Plant', 'Processing Plant', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0072')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20073', 'Prakash Sawant', 'MINE-04', 'Demo Mine Delta', 'M04-Z3', 'Processing Plant', 'Processing Plant', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0073')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20074', 'Sunil Sawant', 'MINE-04', 'Demo Mine Delta', 'M04-Z3', 'Processing Plant', 'Processing Plant', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0074')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20075', 'Anil Sawant', 'MINE-04', 'Demo Mine Delta', 'M04-Z3', 'Processing Plant', 'Processing Plant', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0075')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20076', 'Rajesh Suryavanshi', 'MINE-04', 'Demo Mine Delta', 'M04-Z4', 'Workshop', 'Workshop', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0076')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20077', 'Dinesh Suryavanshi', 'MINE-04', 'Demo Mine Delta', 'M04-Z4', 'Workshop', 'Workshop', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0077')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20078', 'Ramesh Suryavanshi', 'MINE-04', 'Demo Mine Delta', 'M04-Z4', 'Workshop', 'Workshop', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0078')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20079', 'Mahesh Suryavanshi', 'MINE-04', 'Demo Mine Delta', 'M04-Z4', 'Workshop', 'Workshop', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0079')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20080', 'Ganesh Suryavanshi', 'MINE-04', 'Demo Mine Delta', 'M04-Z4', 'Workshop', 'Workshop', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0080')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20081', 'Rahul Mohite', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z1', 'North Shaft', 'North Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0081')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20082', 'Amit Mohite', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z1', 'North Shaft', 'North Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0082')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20083', 'Suresh Mohite', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z1', 'North Shaft', 'North Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0083')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20084', 'Vikas Mohite', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z1', 'North Shaft', 'North Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0084')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20085', 'Arjun Mohite', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z1', 'North Shaft', 'North Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0085')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20086', 'Rohan Jagtap', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z2', 'South Shaft', 'South Shaft', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0086')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20087', 'Manoj Jagtap', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z2', 'South Shaft', 'South Shaft', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0087')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20088', 'Kiran Jagtap', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z2', 'South Shaft', 'South Shaft', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0088')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20089', 'Deepak Jagtap', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z2', 'South Shaft', 'South Shaft', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0089')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20090', 'Nitin Jagtap', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z2', 'South Shaft', 'South Shaft', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0090')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20091', 'Sanjay Naik', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z3', 'Processing Plant', 'Processing Plant', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0091')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20092', 'Vijay Naik', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z3', 'Processing Plant', 'Processing Plant', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0092')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20093', 'Prakash Naik', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z3', 'Processing Plant', 'Processing Plant', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0093')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20094', 'Sunil Naik', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z3', 'Processing Plant', 'Processing Plant', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0094')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20095', 'Anil Naik', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z3', 'Processing Plant', 'Processing Plant', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0095')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20096', 'Rajesh Shetty', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z4', 'Substation', 'Substation', 'Electrician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0096')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20097', 'Dinesh Shetty', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z4', 'Substation', 'Substation', 'Fitter', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0097')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20098', 'Ramesh Shetty', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z4', 'Substation', 'Substation', 'Operator', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0098')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20099', 'Mahesh Shetty', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z4', 'Substation', 'Substation', 'Blaster', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0099')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.workers (worker_id, name, mine_id, mine_name, zone_id, zone_name, area, role, status, joining_date, blood_group, contact)
VALUES ('W-20100', 'Ganesh Shetty', 'MINE-05', 'Demo Mine Epsilon', 'M05-Z4', 'Substation', 'Substation', 'Technician', 'ACTIVE', '2023-01-15', 'O+', '+91 98765 0100')
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 4. SEED STAFF PROFILES
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('INS-001', 'INS-001', 'inspector.alpha@mineguard.demo', 'Anita Kulkarni', 'INSPECTOR', 'Govt. Statutory Mine Inspector - Alpha', 'MINE-01', 'Demo Mine Alpha', 'INS-001', '👷‍♂️')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('INS-002', 'INS-002', 'inspector.beta@mineguard.demo', 'Sunil Verma', 'INSPECTOR', 'Govt. Statutory Mine Inspector - Beta', 'MINE-02', 'Demo Mine Beta', 'INS-002', '👷‍♂️')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('INS-003', 'INS-003', 'inspector.gamma@mineguard.demo', 'Pooja Bannerjee', 'INSPECTOR', 'Govt. Statutory Mine Inspector - Gamma', 'MINE-03', 'Demo Mine Gamma', 'INS-003', '👷‍♂️')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('INS-004', 'INS-004', 'inspector.delta@mineguard.demo', 'Ramesh Patnaik', 'INSPECTOR', 'Govt. Statutory Mine Inspector - Delta', 'MINE-04', 'Demo Mine Delta', 'INS-004', '👷‍♂️')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('INS-005', 'INS-005', 'inspector.epsilon@mineguard.demo', 'Sanjay Roy', 'INSPECTOR', 'Govt. Statutory Mine Inspector - Epsilon', 'MINE-05', 'Demo Mine Epsilon', 'INS-005', '👷‍♂️')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('MO-001', 'MO-001', 'officer.alpha@mineguard.demo', 'Rajesh Deshmukh', 'OFFICER', 'Mine Safety Officer - Alpha', 'MINE-01', 'Demo Mine Alpha', 'MO-001', '🧑‍💼')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('MO-002', 'MO-002', 'officer.beta@mineguard.demo', 'Anil Sengupta', 'OFFICER', 'Mine Safety Officer - Beta', 'MINE-02', 'Demo Mine Beta', 'MO-002', '🧑‍💼')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('MO-003', 'MO-003', 'officer.gamma@mineguard.demo', 'Rajesh Trivedi', 'OFFICER', 'Mine Safety Officer - Gamma', 'MINE-03', 'Demo Mine Gamma', 'MO-003', '🧑‍💼')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('MO-004', 'MO-004', 'officer.delta@mineguard.demo', 'Kavita Raman', 'OFFICER', 'Mine Safety Officer - Delta', 'MINE-04', 'Demo Mine Delta', 'MO-004', '🧑‍💼')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('MO-005', 'MO-005', 'officer.epsilon@mineguard.demo', 'Bikram Mohanty', 'OFFICER', 'Mine Safety Officer - Epsilon', 'MINE-05', 'Demo Mine Epsilon', 'MO-005', '🧑‍💼')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('MGMT-001', 'MGMT-001', 'management@mineguard.demo', 'Neha Sharma', 'MANAGEMENT', 'Executive Management Director', NULL, NULL, 'MGMT-001', '🏢')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
INSERT INTO public.staff_profiles (profile_id, user_id, email, name, role, designation, mine_id, mine_name, badge, avatar)
VALUES ('AUTH-001', 'AUTH-001', 'authority@mineguard.demo', 'Vivek Mehta', 'AUTHORITY', 'Regulatory Regional Director', NULL, NULL, 'AUTH-001', '🏛️')
ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 5. SEED CERTIFICATES
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20001', 'W-20001', 'Rahul Patil', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20001.pdf', 'VALID', 'MINE-01', 'M01-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20002', 'W-20002', 'Amit Patil', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20002.pdf', 'VALID', 'MINE-01', 'M01-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20003', 'W-20003', 'Suresh Patil', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20003.pdf', 'VALID', 'MINE-01', 'M01-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20004', 'W-20004', 'Vikas Patil', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20004.pdf', 'VALID', 'MINE-01', 'M01-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20005', 'W-20005', 'Arjun Patil', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20005.pdf', 'VALID', 'MINE-01', 'M01-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20006', 'W-20006', 'Rohan Shinde', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20006.pdf', 'VALID', 'MINE-01', 'M01-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20007', 'W-20007', 'Manoj Shinde', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20007.pdf', 'VALID', 'MINE-01', 'M01-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20008', 'W-20008', 'Kiran Shinde', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20008.pdf', 'VALID', 'MINE-01', 'M01-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20009', 'W-20009', 'Deepak Shinde', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20009.pdf', 'VALID', 'MINE-01', 'M01-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20010', 'W-20010', 'Nitin Shinde', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20010.pdf', 'VALID', 'MINE-01', 'M01-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20011', 'W-20011', 'Sanjay Jadhav', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20011.pdf', 'VALID', 'MINE-01', 'M01-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20012', 'W-20012', 'Vijay Jadhav', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20012.pdf', 'VALID', 'MINE-01', 'M01-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20013', 'W-20013', 'Prakash Jadhav', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20013.pdf', 'VALID', 'MINE-01', 'M01-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20014', 'W-20014', 'Sunil Jadhav', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20014.pdf', 'VALID', 'MINE-01', 'M01-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20015', 'W-20015', 'Anil Jadhav', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20015.pdf', 'VALID', 'MINE-01', 'M01-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20016', 'W-20016', 'Rajesh Pawar', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20016.pdf', 'VALID', 'MINE-01', 'M01-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20017', 'W-20017', 'Dinesh Pawar', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20017.pdf', 'VALID', 'MINE-01', 'M01-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20018', 'W-20018', 'Ramesh Pawar', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20018.pdf', 'VALID', 'MINE-01', 'M01-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20019', 'W-20019', 'Mahesh Pawar', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20019.pdf', 'VALID', 'MINE-01', 'M01-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20020', 'W-20020', 'Ganesh Pawar', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20020.pdf', 'VALID', 'MINE-01', 'M01-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20021', 'W-20021', 'Rahul Kulkarni', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20021.pdf', 'VALID', 'MINE-02', 'M02-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20022', 'W-20022', 'Amit Kulkarni', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20022.pdf', 'VALID', 'MINE-02', 'M02-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20023', 'W-20023', 'Suresh Kulkarni', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20023.pdf', 'VALID', 'MINE-02', 'M02-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20024', 'W-20024', 'Vikas Kulkarni', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20024.pdf', 'VALID', 'MINE-02', 'M02-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20025', 'W-20025', 'Arjun Kulkarni', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20025.pdf', 'VALID', 'MINE-02', 'M02-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20026', 'W-20026', 'Rohan Deshmukh', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20026.pdf', 'VALID', 'MINE-02', 'M02-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20027', 'W-20027', 'Manoj Deshmukh', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20027.pdf', 'VALID', 'MINE-02', 'M02-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20028', 'W-20028', 'Kiran Deshmukh', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20028.pdf', 'VALID', 'MINE-02', 'M02-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20029', 'W-20029', 'Deepak Deshmukh', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20029.pdf', 'VALID', 'MINE-02', 'M02-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20030', 'W-20030', 'Nitin Deshmukh', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20030.pdf', 'VALID', 'MINE-02', 'M02-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20031', 'W-20031', 'Sanjay Deshpande', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20031.pdf', 'VALID', 'MINE-02', 'M02-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20032', 'W-20032', 'Vijay Deshpande', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20032.pdf', 'VALID', 'MINE-02', 'M02-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20033', 'W-20033', 'Prakash Deshpande', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20033.pdf', 'VALID', 'MINE-02', 'M02-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20034', 'W-20034', 'Sunil Deshpande', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20034.pdf', 'VALID', 'MINE-02', 'M02-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20035', 'W-20035', 'Anil Deshpande', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20035.pdf', 'VALID', 'MINE-02', 'M02-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20036', 'W-20036', 'Rajesh Joshi', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20036.pdf', 'VALID', 'MINE-02', 'M02-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20037', 'W-20037', 'Dinesh Joshi', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20037.pdf', 'VALID', 'MINE-02', 'M02-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20038', 'W-20038', 'Ramesh Joshi', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20038.pdf', 'VALID', 'MINE-02', 'M02-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20039', 'W-20039', 'Mahesh Joshi', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20039.pdf', 'VALID', 'MINE-02', 'M02-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20040', 'W-20040', 'Ganesh Joshi', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20040.pdf', 'VALID', 'MINE-02', 'M02-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20041', 'W-20041', 'Rahul Chavan', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20041.pdf', 'VALID', 'MINE-03', 'M03-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20042', 'W-20042', 'Amit Chavan', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20042.pdf', 'VALID', 'MINE-03', 'M03-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20043', 'W-20043', 'Suresh Chavan', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20043.pdf', 'VALID', 'MINE-03', 'M03-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20044', 'W-20044', 'Vikas Chavan', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20044.pdf', 'VALID', 'MINE-03', 'M03-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20045', 'W-20045', 'Arjun Chavan', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20045.pdf', 'VALID', 'MINE-03', 'M03-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20046', 'W-20046', 'Rohan Gaikwad', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20046.pdf', 'VALID', 'MINE-03', 'M03-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20047', 'W-20047', 'Manoj Gaikwad', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20047.pdf', 'VALID', 'MINE-03', 'M03-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20048', 'W-20048', 'Kiran Gaikwad', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20048.pdf', 'VALID', 'MINE-03', 'M03-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20049', 'W-20049', 'Deepak Gaikwad', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20049.pdf', 'VALID', 'MINE-03', 'M03-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20050', 'W-20050', 'Nitin Gaikwad', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20050.pdf', 'VALID', 'MINE-03', 'M03-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20051', 'W-20051', 'Sanjay More', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20051.pdf', 'VALID', 'MINE-03', 'M03-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20052', 'W-20052', 'Vijay More', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20052.pdf', 'VALID', 'MINE-03', 'M03-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20053', 'W-20053', 'Prakash More', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20053.pdf', 'VALID', 'MINE-03', 'M03-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20054', 'W-20054', 'Sunil More', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20054.pdf', 'VALID', 'MINE-03', 'M03-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20055', 'W-20055', 'Anil More', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20055.pdf', 'VALID', 'MINE-03', 'M03-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20056', 'W-20056', 'Rajesh Kadam', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20056.pdf', 'VALID', 'MINE-03', 'M03-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20057', 'W-20057', 'Dinesh Kadam', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20057.pdf', 'VALID', 'MINE-03', 'M03-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20058', 'W-20058', 'Ramesh Kadam', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20058.pdf', 'VALID', 'MINE-03', 'M03-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20059', 'W-20059', 'Mahesh Kadam', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20059.pdf', 'VALID', 'MINE-03', 'M03-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20060', 'W-20060', 'Ganesh Kadam', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20060.pdf', 'VALID', 'MINE-03', 'M03-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20061', 'W-20061', 'Rahul Raut', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20061.pdf', 'VALID', 'MINE-04', 'M04-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20062', 'W-20062', 'Amit Raut', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20062.pdf', 'VALID', 'MINE-04', 'M04-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20063', 'W-20063', 'Suresh Raut', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20063.pdf', 'VALID', 'MINE-04', 'M04-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20064', 'W-20064', 'Vikas Raut', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20064.pdf', 'VALID', 'MINE-04', 'M04-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20065', 'W-20065', 'Arjun Raut', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20065.pdf', 'VALID', 'MINE-04', 'M04-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20066', 'W-20066', 'Rohan Bhosale', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20066.pdf', 'VALID', 'MINE-04', 'M04-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20067', 'W-20067', 'Manoj Bhosale', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20067.pdf', 'VALID', 'MINE-04', 'M04-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20068', 'W-20068', 'Kiran Bhosale', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20068.pdf', 'VALID', 'MINE-04', 'M04-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20069', 'W-20069', 'Deepak Bhosale', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20069.pdf', 'VALID', 'MINE-04', 'M04-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20070', 'W-20070', 'Nitin Bhosale', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20070.pdf', 'VALID', 'MINE-04', 'M04-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20071', 'W-20071', 'Sanjay Sawant', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20071.pdf', 'VALID', 'MINE-04', 'M04-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20072', 'W-20072', 'Vijay Sawant', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20072.pdf', 'VALID', 'MINE-04', 'M04-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20073', 'W-20073', 'Prakash Sawant', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20073.pdf', 'VALID', 'MINE-04', 'M04-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20074', 'W-20074', 'Sunil Sawant', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20074.pdf', 'VALID', 'MINE-04', 'M04-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20075', 'W-20075', 'Anil Sawant', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20075.pdf', 'VALID', 'MINE-04', 'M04-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20076', 'W-20076', 'Rajesh Suryavanshi', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20076.pdf', 'VALID', 'MINE-04', 'M04-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20077', 'W-20077', 'Dinesh Suryavanshi', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20077.pdf', 'VALID', 'MINE-04', 'M04-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20078', 'W-20078', 'Ramesh Suryavanshi', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20078.pdf', 'VALID', 'MINE-04', 'M04-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20079', 'W-20079', 'Mahesh Suryavanshi', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20079.pdf', 'VALID', 'MINE-04', 'M04-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20080', 'W-20080', 'Ganesh Suryavanshi', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20080.pdf', 'VALID', 'MINE-04', 'M04-Z4', 'Workshop')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20081', 'W-20081', 'Rahul Mohite', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20081.pdf', 'VALID', 'MINE-05', 'M05-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20082', 'W-20082', 'Amit Mohite', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20082.pdf', 'VALID', 'MINE-05', 'M05-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20083', 'W-20083', 'Suresh Mohite', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20083.pdf', 'VALID', 'MINE-05', 'M05-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20084', 'W-20084', 'Vikas Mohite', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20084.pdf', 'VALID', 'MINE-05', 'M05-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20085', 'W-20085', 'Arjun Mohite', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20085.pdf', 'VALID', 'MINE-05', 'M05-Z1', 'North Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20086', 'W-20086', 'Rohan Jagtap', 'Electrical Competency Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20086.pdf', 'VALID', 'MINE-05', 'M05-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20087', 'W-20087', 'Manoj Jagtap', 'Equipment Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20087.pdf', 'VALID', 'MINE-05', 'M05-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20088', 'W-20088', 'Kiran Jagtap', 'Heavy Machinery Operation Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20088.pdf', 'VALID', 'MINE-05', 'M05-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20089', 'W-20089', 'Deepak Jagtap', 'Mining Safety & Blasting Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20089.pdf', 'VALID', 'MINE-05', 'M05-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20090', 'W-20090', 'Nitin Jagtap', 'First Aid & Emergency Response Certificate', '2024-01-15', '2027-12-31', 'VALID', 'PASSED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20090.pdf', 'VALID', 'MINE-05', 'M05-Z2', 'South Shaft')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20091', 'W-20091', 'Sanjay Naik', 'Electrical Competency Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20091.pdf', 'EXPIRED', 'MINE-05', 'M05-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20092', 'W-20092', 'Vijay Naik', 'Equipment Operation Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20092.pdf', 'EXPIRED', 'MINE-05', 'M05-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20093', 'W-20093', 'Prakash Naik', 'Heavy Machinery Operation Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20093.pdf', 'EXPIRED', 'MINE-05', 'M05-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20094', 'W-20094', 'Sunil Naik', 'Mining Safety & Blasting Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20094.pdf', 'EXPIRED', 'MINE-05', 'M05-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20095', 'W-20095', 'Anil Naik', 'First Aid & Emergency Response Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20095.pdf', 'EXPIRED', 'MINE-05', 'M05-Z3', 'Processing Plant')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20096', 'W-20096', 'Rajesh Shetty', 'Electrical Competency Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'electrical_competency_certificate_w-20096.pdf', 'EXPIRED', 'MINE-05', 'M05-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20097', 'W-20097', 'Dinesh Shetty', 'Equipment Operation Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'equipment_operation_certificate_w-20097.pdf', 'EXPIRED', 'MINE-05', 'M05-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20098', 'W-20098', 'Ramesh Shetty', 'Heavy Machinery Operation Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'heavy_machinery_operation_certificate_w-20098.pdf', 'EXPIRED', 'MINE-05', 'M05-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20099', 'W-20099', 'Mahesh Shetty', 'Mining Safety & Blasting Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'mining_safety___blasting_certificate_w-20099.pdf', 'EXPIRED', 'MINE-05', 'M05-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
INSERT INTO public.certificates (certificate_id, worker_id, worker_name, certificate_type, issue_date, expiry_date, status, assessment_status, issuing_authority, document_url, verification_status, mine_id, zone_id, area)
VALUES ('MG-TRN-2026-W-20100', 'W-20100', 'Ganesh Shetty', 'First Aid & Emergency Response Certificate', '2022-01-15', '2025-12-31', 'EXPIRED', 'EXPIRED', 'Directorate General of Mines Safety (DGMS)', 'first_aid___emergency_response_certificate_w-20100.pdf', 'EXPIRED', 'MINE-05', 'M05-Z4', 'Substation')
ON CONFLICT (certificate_id) DO UPDATE SET status = EXCLUDED.status, expiry_date = EXCLUDED.expiry_date;
