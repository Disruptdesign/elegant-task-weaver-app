import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Event, InboxItem, Project, TaskType, ProjectTemplate } from '../types/task';
import { TaskAssignment, EventAssignment } from '../types/user';

export function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert database rows to app types
  const convertDbTaskToTask = (dbTask: any): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    deadline: new Date(dbTask.deadline),
    priority: dbTask.priority || 'medium',
    estimatedDuration: dbTask.estimated_duration,
    completed: dbTask.completed || false,
    scheduledStart: dbTask.scheduled_start ? new Date(dbTask.scheduled_start) : undefined,
    scheduledEnd: dbTask.scheduled_end ? new Date(dbTask.scheduled_end) : undefined,
    category: dbTask.category,
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
    canStartFrom: dbTask.can_start_from ? new Date(dbTask.can_start_from) : undefined,
    bufferBefore: dbTask.buffer_before || 0,
    bufferAfter: dbTask.buffer_after || 0,
    allowSplitting: dbTask.allow_splitting || false,
    splitDuration: dbTask.split_duration,
    projectId: dbTask.project_id,
    dependencies: dbTask.dependencies || [],
    taskTypeId: dbTask.task_type_id,
    assignments: dbTask.task_assignments?.map((assignment: any) => ({
      id: assignment.id,
      taskId: assignment.task_id,
      userId: assignment.user_id,
      role: assignment.role,
      assignedAt: new Date(assignment.assigned_at),
      assignedBy: assignment.assigned_by,
      user: assignment.app_users ? {
        id: assignment.app_users.id,
        authUserId: assignment.app_users.auth_user_id,
        email: assignment.app_users.email,
        firstName: assignment.app_users.first_name,
        lastName: assignment.app_users.last_name,
        avatarUrl: assignment.app_users.avatar_url,
        role: assignment.app_users.role,
        isActive: assignment.app_users.is_active,
        createdAt: new Date(assignment.app_users.created_at),
        updatedAt: new Date(assignment.app_users.updated_at),
      } : undefined,
    })) || [],
  });

  const convertDbEventToEvent = (dbEvent: any): Event => ({
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description || '',
    startDate: new Date(dbEvent.start_date),
    endDate: new Date(dbEvent.end_date),
    allDay: dbEvent.all_day || false,
    markAsBusy: dbEvent.mark_as_busy || true,
    googleMeetLink: dbEvent.google_meet_link,
    location: dbEvent.location,
    bufferBefore: dbEvent.buffer_before || 0,
    bufferAfter: dbEvent.buffer_after || 0,
    repeat: dbEvent.repeat_type === 'none' ? null : dbEvent.repeat_type,
    createdAt: new Date(dbEvent.created_at),
    updatedAt: new Date(dbEvent.updated_at),
    assignments: dbEvent.event_assignments?.map((assignment: any) => ({
      id: assignment.id,
      eventId: assignment.event_id,
      userId: assignment.user_id,
      role: assignment.role,
      assignedAt: new Date(assignment.assigned_at),
      assignedBy: assignment.assigned_by,
      responseStatus: assignment.response_status,
      user: assignment.app_users ? {
        id: assignment.app_users.id,
        authUserId: assignment.app_users.auth_user_id,
        email: assignment.app_users.email,
        firstName: assignment.app_users.first_name,
        lastName: assignment.app_users.last_name,
        avatarUrl: assignment.app_users.avatar_url,
        role: assignment.app_users.role,
        isActive: assignment.app_users.is_active,
        createdAt: new Date(assignment.app_users.created_at),
        updatedAt: new Date(assignment.app_users.updated_at),
      } : undefined,
    })) || [],
  });

  const convertDbProjectToProject = (dbProject: any): Project => ({
    id: dbProject.id,
    title: dbProject.title,
    description: dbProject.description,
    startDate: new Date(dbProject.start_date),
    deadline: new Date(dbProject.deadline),
    color: dbProject.color,
    completed: dbProject.completed,
    createdAt: new Date(dbProject.created_at),
    updatedAt: new Date(dbProject.updated_at),
  });

  const convertDbInboxItemToInboxItem = (dbItem: any): InboxItem => ({
    id: dbItem.id,
    title: dbItem.title,
    description: dbItem.description,
    createdAt: new Date(dbItem.created_at),
  });

  const convertDbTaskTypeToTaskType = (dbTaskType: any): TaskType => ({
    id: dbTaskType.id,
    name: dbTaskType.name,
    color: dbTaskType.color,
    timeSlots: [], // Will be populated separately if needed
    autoSchedule: dbTaskType.auto_schedule,
    allowWeekends: dbTaskType.allow_weekends,
    bufferBetweenTasks: dbTaskType.buffer_between_tasks,
    createdAt: new Date(dbTaskType.created_at),
    updatedAt: new Date(dbTaskType.updated_at),
  });

  const convertDbProjectTemplateToProjectTemplate = (dbTemplate: any): ProjectTemplate => ({
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description,
    color: dbTemplate.color,
    defaultDuration: dbTemplate.default_duration,
    tasks: [], // Will be populated separately if needed
    createdAt: new Date(dbTemplate.created_at),
    updatedAt: new Date(dbTemplate.updated_at),
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('🔐 No authenticated user found');
        setTasks([]);
        setEvents([]);
        setInboxItems([]);
        setProjects([]);
        setTaskTypes([]);
        setProjectTemplates([]);
        return;
      }

      console.log('🔄 Fetching data from Supabase for user:', session.user.id);

      // Fetch tasks with assignments - using explicit foreign key relationships
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments (
            id,
            task_id,
            user_id,
            role,
            assigned_at,
            assigned_by,
            app_users!task_assignments_user_id_fkey (
              id,
              auth_user_id,
              email,
              first_name,
              last_name,
              avatar_url,
              role,
              is_active,
              created_at,
              updated_at
            )
          )
        `)
        .eq('user_id', session.user.id);

      if (tasksError) throw tasksError;

      // Fetch events with assignments - using explicit foreign key relationships
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_assignments (
            id,
            event_id,
            user_id,
            role,
            assigned_at,
            assigned_by,
            response_status,
            app_users!event_assignments_user_id_fkey (
              id,
              auth_user_id,
              email,
              first_name,
              last_name,
              avatar_url,
              role,
              is_active,
              created_at,
              updated_at
            )
          )
        `)
        .eq('user_id', session.user.id);

      if (eventsError) throw eventsError;

      // Fetch inbox items
      const { data: inboxData, error: inboxError } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', session.user.id);

      if (inboxError) throw inboxError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id);

      if (projectsError) throw projectsError;

      // Fetch task types
      const { data: taskTypesData, error: taskTypesError } = await supabase
        .from('task_types')
        .select('*')
        .eq('user_id', session.user.id);

      if (taskTypesError) throw taskTypesError;

      // Fetch project templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('project_templates')
        .select('*')
        .eq('user_id', session.user.id);

      if (templatesError) throw templatesError;

      // Convert and set data
      setTasks((tasksData || []).map(convertDbTaskToTask));
      setEvents((eventsData || []).map(convertDbEventToEvent));
      setInboxItems((inboxData || []).map(convertDbInboxItemToInboxItem));
      setProjects((projectsData || []).map(convertDbProjectToProject));
      setTaskTypes((taskTypesData || []).map(convertDbTaskTypeToTaskType));
      setProjectTemplates((templatesData || []).map(convertDbProjectTemplateToProjectTemplate));

      console.log('✅ Data fetched successfully:', {
        tasks: tasksData?.length || 0,
        events: eventsData?.length || 0,
        projects: projectsData?.length || 0,
        taskTypes: taskTypesData?.length || 0
      });

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, !!session?.user);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setTasks([]);
        setEvents([]);
        setInboxItems([]);
        setProjects([]);
        setTaskTypes([]);
        setProjectTemplates([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchData]);

  const getCurrentUserId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          deadline: taskData.deadline.toISOString(),
          priority: taskData.priority,
          estimated_duration: taskData.estimatedDuration,
          category: taskData.category,
          can_start_from: taskData.canStartFrom?.toISOString(),
          buffer_before: taskData.bufferBefore,
          buffer_after: taskData.bufferAfter,
          allow_splitting: taskData.allowSplitting,
          split_duration: taskData.splitDuration,
          project_id: taskData.projectId,
          task_type_id: taskData.taskTypeId,
          dependencies: taskData.dependencies,
          scheduled_start: taskData.scheduledStart?.toISOString(),
          scheduled_end: taskData.scheduledEnd?.toISOString(),
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newTask = convertDbTaskToTask(data);
      setTasks(prev => [...prev, newTask]);
      console.log('✅ Task added successfully:', newTask.title);
    } catch (err) {
      console.error('❌ Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task');
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString();
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.estimatedDuration !== undefined) updateData.estimated_duration = updates.estimatedDuration;
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      if (updates.scheduledStart !== undefined) updateData.scheduled_start = updates.scheduledStart?.toISOString();
      if (updates.scheduledEnd !== undefined) updateData.scheduled_end = updates.scheduledEnd?.toISOString();
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.canStartFrom !== undefined) updateData.can_start_from = updates.canStartFrom?.toISOString();
      if (updates.bufferBefore !== undefined) updateData.buffer_before = updates.bufferBefore;
      if (updates.bufferAfter !== undefined) updateData.buffer_after = updates.bufferAfter;
      if (updates.allowSplitting !== undefined) updateData.allow_splitting = updates.allowSplitting;
      if (updates.splitDuration !== undefined) updateData.split_duration = updates.splitDuration;
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
      if (updates.taskTypeId !== undefined) updateData.task_type_id = updates.taskTypeId;
      if (updates.dependencies !== undefined) updateData.dependencies = updates.dependencies;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask = convertDbTaskToTask(data);
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      console.log('✅ Task updated successfully:', id);
    } catch (err) {
      console.error('❌ Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      console.log('✅ Task deleted successfully:', id);
    } catch (err) {
      console.error('❌ Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.startDate.toISOString(),
          end_date: eventData.endDate.toISOString(),
          all_day: eventData.allDay,
          mark_as_busy: eventData.markAsBusy,
          google_meet_link: eventData.googleMeetLink,
          location: eventData.location,
          buffer_before: eventData.bufferBefore,
          buffer_after: eventData.bufferAfter,
          repeat_type: eventData.repeat,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newEvent = convertDbEventToEvent(data);
      setEvents(prev => [...prev, newEvent]);
      console.log('✅ Event added successfully:', newEvent.title);
    } catch (err) {
      console.error('❌ Error adding event:', err);
      setError(err instanceof Error ? err.message : 'Failed to add event');
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString();
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString();
      if (updates.allDay !== undefined) updateData.all_day = updates.allDay;
      if (updates.markAsBusy !== undefined) updateData.mark_as_busy = updates.markAsBusy;
      if (updates.googleMeetLink !== undefined) updateData.google_meet_link = updates.googleMeetLink;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.bufferBefore !== undefined) updateData.buffer_before = updates.bufferBefore;
      if (updates.bufferAfter !== undefined) updateData.buffer_after = updates.bufferAfter;
      if (updates.repeat !== undefined) updateData.repeat_type = updates.repeat;

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedEvent = convertDbEventToEvent(data);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      console.log('✅ Event updated successfully:', id);
    } catch (err) {
      console.error('❌ Error updating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to update event');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      console.log('✅ Event deleted successfully:', id);
    } catch (err) {
      console.error('❌ Error deleting event:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const addInboxItem = async (itemData: Omit<InboxItem, 'id' | 'createdAt'>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('inbox_items')
        .insert({
          title: itemData.title,
          description: itemData.description,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newInboxItem = convertDbInboxItemToInboxItem(data);
      setInboxItems(prev => [...prev, newInboxItem]);
      console.log('✅ Inbox item added successfully:', data.title);
    } catch (err) {
      console.error('❌ Error adding inbox item:', err);
      setError(err instanceof Error ? err.message : 'Failed to add inbox item');
    }
  };

  const deleteInboxItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inbox_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInboxItems(prev => prev.filter(item => item.id !== id));
      console.log('✅ Inbox item deleted successfully:', id);
    } catch (err) {
      console.error('❌ Error deleting inbox item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete inbox item');
    }
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectData.title,
          description: projectData.description,
          start_date: projectData.startDate.toISOString(),
          deadline: projectData.deadline.toISOString(),
          color: projectData.color,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newProject = convertDbProjectToProject(data);
      setProjects(prev => [...prev, newProject]);
      console.log('✅ Project added successfully:', newProject.title);
    } catch (err) {
      console.error('❌ Error adding project:', err);
      setError(err instanceof Error ? err.message : 'Failed to add project');
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString();
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString();
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.completed !== undefined) updateData.completed = updates.completed;

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProject = convertDbProjectToProject(data);
      setProjects(prev => prev.map(project => project.id === id ? updatedProject : project));
      console.log('✅ Project updated successfully:', id);
    } catch (err) {
      console.error('❌ Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== id));
      console.log('✅ Project deleted successfully:', id);
    } catch (err) {
      console.error('❌ Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const addTaskType = async (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('task_types')
        .insert({
          name: taskTypeData.name,
          color: taskTypeData.color,
          auto_schedule: taskTypeData.autoSchedule,
          allow_weekends: taskTypeData.allowWeekends,
          buffer_between_tasks: taskTypeData.bufferBetweenTasks,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newTaskType = convertDbTaskTypeToTaskType(data);
      setTaskTypes(prev => [...prev, newTaskType]);
      console.log('✅ Task type added successfully:', data.name);
    } catch (err) {
      console.error('❌ Error adding task type:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task type');
    }
  };

  const updateTaskType = async (id: string, updates: Partial<TaskType>) => {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.autoSchedule !== undefined) updateData.auto_schedule = updates.autoSchedule;
      if (updates.allowWeekends !== undefined) updateData.allow_weekends = updates.allowWeekends;
      if (updates.bufferBetweenTasks !== undefined) updateData.buffer_between_tasks = updates.bufferBetweenTasks;

      const { data, error } = await supabase
        .from('task_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTaskType = convertDbTaskTypeToTaskType(data);
      setTaskTypes(prev => prev.map(taskType => taskType.id === id ? updatedTaskType : taskType));
      console.log('✅ Task type updated successfully:', id);
    } catch (err) {
      console.error('❌ Error updating task type:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task type');
    }
  };

  const deleteTaskType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('task_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTaskTypes(prev => prev.filter(taskType => taskType.id !== id));
      console.log('✅ Task type deleted successfully:', id);
    } catch (err) {
      console.error('❌ Error deleting task type:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task type');
    }
  };

  const addProjectTemplate = async (templateData: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          color: templateData.color,
          default_duration: templateData.defaultDuration,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newProjectTemplate = convertDbProjectTemplateToProjectTemplate(data);
      setProjectTemplates(prev => [...prev, newProjectTemplate]);
      console.log('✅ Project template added successfully:', data.name);
    } catch (err) {
      console.error('❌ Error adding project template:', err);
      setError(err instanceof Error ? err.message : 'Failed to add project template');
    }
  };

  const updateProjectTemplate = async (id: string, updates: Partial<ProjectTemplate>) => {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.defaultDuration !== undefined) updateData.default_duration = updates.defaultDuration;

      const { data, error } = await supabase
        .from('project_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProjectTemplate = convertDbProjectTemplateToProjectTemplate(data);
      setProjectTemplates(prev => prev.map(template => 
        template.id === id ? updatedProjectTemplate : template
      ));
      console.log('✅ Project template updated successfully:', id);
    } catch (err) {
      console.error('❌ Error updating project template:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project template');
    }
  };

  const deleteProjectTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjectTemplates(prev => prev.filter(template => template.id !== id));
      console.log('✅ Project template deleted successfully:', id);
    } catch (err) {
      console.error('❌ Error deleting project template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project template');
    }
  };

  const createProjectFromTemplate = async (
    templateId: string, 
    projectData: { title: string; description?: string; startDate: Date; deadline: Date }
  ) => {
    try {
      const template = projectTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create the project first
      await addProject({
        title: projectData.title,
        description: projectData.description,
        startDate: projectData.startDate,
        deadline: projectData.deadline,
        color: template.color,
      });

      console.log('✅ Project created from template successfully:', projectData.title);
    } catch (err) {
      console.error('❌ Error creating project from template:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project from template');
    }
  };

  return {
    tasks,
    events,
    inboxItems,
    projects,
    taskTypes,
    projectTemplates,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addInboxItem,
    deleteInboxItem,
    addProject,
    updateProject,
    deleteProject,
    addTaskType,
    updateTaskType,
    deleteTaskType,
    addProjectTemplate,
    updateProjectTemplate,
    deleteProjectTemplate,
    createProjectFromTemplate,
    refreshData: fetchData,
  };
}
