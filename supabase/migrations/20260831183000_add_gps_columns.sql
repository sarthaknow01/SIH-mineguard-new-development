-- Add GPS columns to inspections table
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMPTZ;

-- Add GPS columns to violations table
ALTER TABLE public.violations
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMPTZ;
