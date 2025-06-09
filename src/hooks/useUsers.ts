
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

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;

      setUsers((data || []).map(convertDbUserToAppUser));
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assignUserToTask = async (taskId: string, userId: string, role: 'assignee' | 'reviewer' | 'observer' = 'assignee') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('User not authenticated');

      // Get the current user's app_users record to use as assigned_by
      const { data: currentUserData } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single();

      const { error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: userId,
          role,
          assigned_by: currentUserData?.id,
        });

      if (error) throw error;
      console.log('✅ User assigned to task successfully');
    } catch (err) {
      console.error('❌ Error assigning user to task:', err);
      throw err;
    }
  };

  const assignUserToEvent = async (eventId: string, userId: string, role: 'organizer' | 'attendee' | 'optional' = 'attendee') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('User not authenticated');

      // Get the current user's app_users record to use as assigned_by
      const { data: currentUserData } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single();

      const { error } = await supabase
        .from('event_assignments')
        .insert({
          event_id: eventId,
          user_id: userId,
          role,
          assigned_by: currentUserData?.id,
        });

      if (error) throw error;
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
