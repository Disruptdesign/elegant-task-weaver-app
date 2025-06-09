import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppUser, TaskAssignment, EventAssignment } from '../types/user';

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertDbUserToAppUser = (dbUser: any): AppUser => ({
    id: dbUser.id,
    authUserId: dbUser.auth_user_id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    avatarUrl: dbUser.avatar_url,
    username: dbUser.username,
    role: dbUser.role,
    isActive: dbUser.is_active,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
  });

  const ensureCurrentUserExists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      console.log('🔍 Checking if current user exists in app_users...', {
        authUserId: session.user.id,
        email: session.user.email
      });

      // Check if user exists in app_users
      const { data: existingUser, error: checkError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking for existing user:', checkError);
        return;
      }

      if (!existingUser) {
        console.log('⚠️ User not found in app_users, creating new record...');
        
        // Create new app_user record
        const { data: newUser, error: insertError } = await supabase
          .from('app_users')
          .insert({
            auth_user_id: session.user.id,
            email: session.user.email,
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            username: session.user.user_metadata?.username || null,
            role: 'member',
            is_active: true
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating app_user:', insertError);
          throw insertError;
        }

        console.log('✅ Created new app_user:', newUser);
        return newUser;
      } else {
        console.log('✅ User found in app_users:', existingUser);
        return existingUser;
      }
    } catch (err) {
      console.error('❌ Error in ensureCurrentUserExists:', err);
      throw err;
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUsers([]);
        return;
      }

      // Ensure current user exists in app_users
      await ensureCurrentUserExists();

      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;

      const convertedUsers = (data || []).map(convertDbUserToAppUser);
      console.log('👥 Fetched users:', {
        totalUsers: convertedUsers.length,
        currentUserInList: convertedUsers.some(u => u.authUserId === session.user.id),
        users: convertedUsers.map(u => ({ id: u.id, email: u.email, authUserId: u.authUserId }))
      });

      setUsers(convertedUsers);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const assignUserToTask = async (taskId: string, userId: string, role: 'assignee' | 'reviewer' | 'observer' = 'assignee') => {
    try {
      console.log('🔍 Validating task assignment:', { taskId, userId, role });
      
      // Validate UUIDs
      if (!isValidUUID(taskId)) {
        throw new Error(`ID de tâche invalide: "${taskId}". Cette tâche ne peut pas être assignée car elle n'a pas un ID valide.`);
      }
      
      if (!isValidUUID(userId)) {
        throw new Error(`ID d'utilisateur invalide: "${userId}". Veuillez vous reconnecter.`);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('User not authenticated');

      // Get the current user's app_users record to use as assigned_by
      const { data: currentUserData } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single();

      if (!currentUserData) {
        throw new Error('Votre profil utilisateur n\'est pas configuré. Veuillez synchroniser votre compte.');
      }

      console.log('📝 Inserting task assignment:', {
        task_id: taskId,
        user_id: userId,
        role,
        assigned_by: currentUserData.id,
      });

      const { error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: userId,
          role,
          assigned_by: currentUserData.id,
        });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ User assigned to task successfully');
    } catch (err) {
      console.error('❌ Error assigning user to task:', err);
      throw err;
    }
  };

  const assignUserToEvent = async (eventId: string, userId: string, role: 'organizer' | 'attendee' | 'optional' = 'attendee') => {
    try {
      console.log('🔍 Validating event assignment:', { eventId, userId, role });
      
      // Validate UUIDs
      if (!isValidUUID(eventId)) {
        throw new Error(`ID d'événement invalide: "${eventId}". Cet événement ne peut pas être assigné car il n'a pas un ID valide.`);
      }
      
      if (!isValidUUID(userId)) {
        throw new Error(`ID d'utilisateur invalide: "${userId}". Veuillez vous reconnecter.`);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('User not authenticated');

      // Get the current user's app_users record to use as assigned_by
      const { data: currentUserData } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single();

      if (!currentUserData) {
        throw new Error('Votre profil utilisateur n\'est pas configuré. Veuillez synchroniser votre compte.');
      }

      const { error } = await supabase
        .from('event_assignments')
        .insert({
          event_id: eventId,
          user_id: userId,
          role,
          assigned_by: currentUserData.id,
        });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ User assigned to event successfully');
    } catch (err) {
      console.error('❌ Error assigning user to event:', err);
      throw err;
    }
  };

  const removeTaskAssignment = async (taskId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      console.log('✅ Task assignment removed successfully');
    } catch (err) {
      console.error('❌ Error removing task assignment:', err);
      throw err;
    }
  };

  const removeEventAssignment = async (eventId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('event_assignments')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;
      console.log('✅ Event assignment removed successfully');
    } catch (err) {
      console.error('❌ Error removing event assignment:', err);
      throw err;
    }
  };

  const updateEventAssignmentResponse = async (eventId: string, userId: string, responseStatus: 'accepted' | 'declined' | 'maybe') => {
    try {
      const { error } = await supabase
        .from('event_assignments')
        .update({ response_status: responseStatus })
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;
      console.log('✅ Event assignment response updated successfully');
    } catch (err) {
      console.error('❌ Error updating event assignment response:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUsers();
      } else if (event === 'SIGNED_OUT') {
        setUsers([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    assignUserToTask,
    assignUserToEvent,
    removeTaskAssignment,
    removeEventAssignment,
    updateEventAssignmentResponse,
    refreshUsers: fetchUsers,
  };
}
