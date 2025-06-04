import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Event, InboxItem, Project, TaskType, ProjectTemplate, TemplateTask } from '../types/task';
import { useAlgorithmicScheduler } from './useAlgorithmicScheduler';

export interface UseSupabaseTasksReturn {
  tasks: Task[];
  events: Event[];
  inboxItems: InboxItem[];
  projects: Project[];
  taskTypes: TaskType[];
  projectTemplates: ProjectTemplate[];
  isLoading: boolean;
  error: string | null;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteInboxItem: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTaskType: (taskType: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTaskType: (id: string, updates: Partial<TaskType>) => Promise<void>;
  deleteTaskType: (id: string) => Promise<void>;
  addProjectTemplate: (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProjectTemplate: (id: string, updates: Partial<ProjectTemplate>) => Promise<void>;
  deleteProjectTemplate: (id: string) => Promise<void>;
  createProjectFromTemplate: (templateId: string, projectData: { title: string; description?: string; startDate: Date; deadline: Date }) => Promise<void>;
  refreshData: () => Promise<void>;
}

// Helper function to convert database rows to app types
const convertDbTaskToTask = (dbTask: any): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  deadline: new Date(dbTask.deadline),
  priority: dbTask.priority,
  estimatedDuration: dbTask.estimated_duration,
  completed: dbTask.completed,
  scheduledStart: dbTask.scheduled_start ? new Date(dbTask.scheduled_start) : undefined,
  scheduledEnd: dbTask.scheduled_end ? new Date(dbTask.scheduled_end) : undefined,
  category: dbTask.category,
  createdAt: new Date(dbTask.created_at),
  updatedAt: new Date(dbTask.updated_at),
  canStartFrom: dbTask.can_start_from ? new Date(dbTask.can_start_from) : undefined,
  bufferBefore: dbTask.buffer_before,
  bufferAfter: dbTask.buffer_after,
  allowSplitting: dbTask.allow_splitting,
  splitDuration: dbTask.split_duration,
  projectId: dbTask.project_id,
  dependencies: dbTask.dependencies || [],
  taskTypeId: dbTask.task_type_id,
});

const convertDbEventToEvent = (dbEvent: any): Event => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description,
  startDate: new Date(dbEvent.start_date),
  endDate: new Date(dbEvent.end_date),
  allDay: dbEvent.all_day,
  markAsBusy: dbEvent.mark_as_busy,
  googleMeetLink: dbEvent.google_meet_link,
  location: dbEvent.location,
  bufferBefore: dbEvent.buffer_before,
  bufferAfter: dbEvent.buffer_after,
  repeat: dbEvent.repeat_type,
  createdAt: new Date(dbEvent.created_at),
  updatedAt: new Date(dbEvent.updated_at),
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

export function useSupabaseTasks(): UseSupabaseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scheduleAllTasks } = useAlgorithmicScheduler();

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching data from Supabase...');

      const [
        tasksResult,
        eventsResult,
        inboxResult,
        projectsResult,
        taskTypesResult,
        templatesResult,
      ] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('start_date', { ascending: true }),
        supabase.from('inbox_items').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('task_types').select('*').order('name', { ascending: true }),
        supabase.from('project_templates').select('*').order('name', { ascending: true }),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (inboxResult.error) throw inboxResult.error;
      if (projectsResult.error) throw projectsResult.error;
      if (taskTypesResult.error) throw taskTypesResult.error;
      if (templatesResult.error) throw templatesResult.error;

      setTasks((tasksResult.data || []).map(convertDbTaskToTask));
      setEvents((eventsResult.data || []).map(convertDbEventToEvent));
      setInboxItems((inboxResult.data || []).map(convertDbInboxItemToInboxItem));
      setProjects((projectsResult.data || []).map(convertDbProjectToProject));
      setTaskTypes((taskTypesResult.data || []).map(convertDbTaskTypeToTaskType));
      setProjectTemplates((templatesResult.data || []).map(convertDbProjectTemplateToProjectTemplate));

      console.log('✅ Data fetched successfully:', {
        tasks: tasksResult.data?.length || 0,
        events: eventsResult.data?.length || 0,
        projects: projectsResult.data?.length || 0,
        taskTypes: taskTypesResult.data?.length || 0,
      });

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    try {
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
      const { data, error } = await supabase
        .from('inbox_items')
        .insert({
          title: itemData.title,
          description: itemData.description,
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
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectData.title,
          description: projectData.description,
          start_date: projectData.startDate.toISOString(),
          deadline: projectData.deadline.toISOString(),
          color: projectData.color,
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
      const { data, error } = await supabase
        .from('task_types')
        .insert({
          name: taskTypeData.name,
          color: taskTypeData.color,
          auto_schedule: taskTypeData.autoSchedule,
          allow_weekends: taskTypeData.allowWeekends,
          buffer_between_tasks: taskTypeData.bufferBetweenTasks,
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
      const { data, error } = await supabase
        .from('project_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          color: templateData.color,
          default_duration: templateData.defaultDuration,
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
    refreshData,
  };
}
