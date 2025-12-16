-- First, disable RLS completely on admins table
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Then verify the table exists and has data
SELECT * FROM public.admins LIMIT 5;
