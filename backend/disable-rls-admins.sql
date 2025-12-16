-- Temporarily disable RLS on admins table to allow anon access
-- Run this in Supabase SQL Editor

ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled but allow anon access:
-- ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Allow anon access to admins" ON public.admins;
-- 
-- CREATE POLICY "Allow anon access to admins"
-- ON public.admins
-- FOR SELECT
-- TO anon
-- USING (true);
