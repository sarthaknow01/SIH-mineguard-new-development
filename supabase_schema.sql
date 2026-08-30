-- Supabase Table and Realtime Schema for SOS Emergency Alerts
CREATE TABLE IF NOT EXISTS public.sos_alerts (
    alert_id TEXT PRIMARY KEY,
    inspector_name TEXT,
    inspector_id TEXT,
    mine_name TEXT,
    mine_id TEXT,
    timestamp TEXT,
    status TEXT DEFAULT 'ACTIVE',
    acknowledged_by TEXT,
    acknowledged_at TEXT,
    acknowledged_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) policies for public demo access
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read sos_alerts" ON public.sos_alerts
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert sos_alerts" ON public.sos_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update sos_alerts" ON public.sos_alerts
    FOR UPDATE USING (true);

-- Enable Supabase Realtime for sos_alerts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'sos_alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
    END IF;
END $$;
