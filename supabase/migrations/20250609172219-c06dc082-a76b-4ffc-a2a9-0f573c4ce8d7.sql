
-- First, drop the foreign key constraints that are preventing the type change
ALTER TABLE task_assignments DROP CONSTRAINT IF EXISTS task_assignments_task_id_fkey;
ALTER TABLE event_assignments DROP CONSTRAINT IF EXISTS event_assignments_event_id_fkey;

-- Drop all existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on task_assignments
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'task_assignments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_assignments', pol.policyname);
    END LOOP;
    
    -- Drop all policies on event_assignments
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'event_assignments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.event_assignments', pol.policyname);
    END LOOP;
END $$;

-- Now alter the column types to text
ALTER TABLE task_assignments 
ALTER COLUMN task_id TYPE text;

ALTER TABLE event_assignments 
ALTER COLUMN event_id TYPE text;

-- Recreate the RLS policies with proper permissions
CREATE POLICY "Users can view task assignments" 
ON public.task_assignments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create task assignments" 
ON public.task_assignments FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update their own task assignments" 
ON public.task_assignments FOR UPDATE 
TO authenticated 
USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their own task assignments" 
ON public.task_assignments FOR DELETE 
TO authenticated 
USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view event assignments" 
ON public.event_assignments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create event assignments" 
ON public.event_assignments FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update their own event assignments" 
ON public.event_assignments FOR UPDATE 
TO authenticated 
USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their own event assignments" 
ON public.event_assignments FOR DELETE 
TO authenticated 
USING (user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()));

-- Create indexes for performance on the new text columns
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_event_id ON event_assignments(event_id);
