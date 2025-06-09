
-- Ajouter une colonne username/pseudo à la table app_users si elle n'existe pas déjà
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Créer un index unique sur le username pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS app_users_username_unique 
ON public.app_users(username) 
WHERE username IS NOT NULL;

-- Activer RLS sur les tables d'assignation (les tables existent déjà)
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view task assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can create task assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can update their own task assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can delete their own task assignments" ON public.task_assignments;

DROP POLICY IF EXISTS "Users can view event assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "Users can create event assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "Users can update their own event assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "Users can delete their own event assignments" ON public.event_assignments;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.app_users;

-- Politiques RLS pour task_assignments
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

-- Politiques RLS pour event_assignments
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

-- Politique pour permettre aux utilisateurs de modifier leur propre profil
CREATE POLICY "Users can update their own profile" 
ON public.app_users FOR UPDATE 
TO authenticated 
USING (auth_user_id = auth.uid());
