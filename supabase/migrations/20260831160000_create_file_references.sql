-- Supabase Table for File References & Metadata
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

ALTER TABLE public.file_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read file_references" ON public.file_references;
CREATE POLICY "Allow public read file_references" ON public.file_references FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert file_references" ON public.file_references;
CREATE POLICY "Allow public insert file_references" ON public.file_references FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update file_references" ON public.file_references;
CREATE POLICY "Allow public update file_references" ON public.file_references FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete file_references" ON public.file_references;
CREATE POLICY "Allow public delete file_references" ON public.file_references FOR DELETE USING (true);
