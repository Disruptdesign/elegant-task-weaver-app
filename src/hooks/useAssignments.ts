
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskAssignment, EventAssignment } from '../types/user';

export function useAssignments(itemId: string, type: 'task' | 'event') {
  const [assignments, setAssignments] = useState<(TaskAssignment | EventAssignment)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!itemId) {
      setAssignments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔍 Fetching ${type} assignments for:`, itemId);

      if (type === 'task') {
        const { data, error } = await supabase
          .from('task_assignments')
          .select(`
            *,
            user:app_users!task_assignments_user_id_fkey (
              id,
              email,
              first_name,
              last_name,
              username
            )
          `)
          .eq('task_id', itemId);

        if (error) {
          console.error('❌ Error fetching task assignments:', error);
          throw error;
        }

        console.log('✅ Task assignments fetched:', data);

        const taskAssignments: TaskAssignment[] = (data || []).map(assignment => ({
          id: assignment.id,
          taskId: assignment.task_id,
          userId: assignment.user_id,
          role: assignment.role as 'assignee' | 'reviewer' | 'observer',
          assignedAt: new Date(assignment.assigned_at),
          assignedBy: assignment.assigned_by,
          user: assignment.user ? {
            id: assignment.user.id,
            authUserId: '', // Not needed for display
            email: assignment.user.email,
            firstName: assignment.user.first_name,
            lastName: assignment.user.last_name,
            username: assignment.user.username,
            role: 'member' as const,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } : undefined,
        }));

        setAssignments(taskAssignments);
      } else {
        const { data, error } = await supabase
          .from('event_assignments')
          .select(`
            *,
            user:app_users!event_assignments_user_id_fkey (
              id,
              email,
              first_name,
              last_name,
              username
            )
          `)
          .eq('event_id', itemId);

        if (error) {
          console.error('❌ Error fetching event assignments:', error);
          throw error;
        }

        console.log('✅ Event assignments fetched:', data);

        const eventAssignments: EventAssignment[] = (data || []).map(assignment => ({
          id: assignment.id,
          eventId: assignment.event_id,
          userId: assignment.user_id,
          role: assignment.role as 'organizer' | 'attendee' | 'optional',
          assignedAt: new Date(assignment.assigned_at),
          assignedBy: assignment.assigned_by,
          responseStatus: assignment.response_status as 'pending' | 'accepted' | 'declined' | 'maybe',
          user: assignment.user ? {
            id: assignment.user.id,
            authUserId: '', // Not needed for display
            email: assignment.user.email,
            firstName: assignment.user.first_name,
            lastName: assignment.user.last_name,
            username: assignment.user.username,
            role: 'member' as const,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } : undefined,
        }));

        setAssignments(eventAssignments);
      }
    } catch (err) {
      console.error(`❌ Error fetching ${type} assignments:`, err);
      setError(err instanceof Error ? err.message : `Failed to fetch ${type} assignments`);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemId, type]);

  const removeAssignment = useCallback(async (userId: string) => {
    try {
      console.log(`🗑️ Removing ${type} assignment:`, { itemId, userId });
      
      if (type === 'task') {
        const { error } = await supabase
          .from('task_assignments')
          .delete()
          .eq('task_id', itemId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_assignments')
          .delete()
          .eq('event_id', itemId)
          .eq('user_id', userId);

        if (error) throw error;
      }

      // Refresh assignments after removal
      await fetchAssignments();
      console.log(`✅ ${type} assignment removed successfully`);
    } catch (err) {
      console.error(`❌ Error removing ${type} assignment:`, err);
      throw err;
    }
  }, [itemId, type, fetchAssignments]);

  const checkIfUserAssigned = useCallback((userId: string) => {
    return assignments.some(assignment => assignment.userId === userId);
  }, [assignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    isLoading,
    error,
    refreshAssignments: fetchAssignments,
    removeAssignment,
    checkIfUserAssigned,
  };
}
