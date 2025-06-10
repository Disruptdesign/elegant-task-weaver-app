
import { useState, useCallback, useEffect } from 'react';
import { Task, Event, Project, InboxItem, TaskType, ProjectTemplate, TemplateTask } from '../types/task';
import { useSupabaseTasks } from './useSupabaseTasks';

export function useTasks() {
  // Initialisation avec des tableaux vides - plus de données de démonstration
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);

  const {
    tasks: supabaseTasks,
    events: supabaseEvents,
    projects: supabaseProjects,
    inboxItems: supabaseInboxItems,
    taskTypes: supabaseTaskTypes,
    projectTemplates: supabaseProjectTemplates,
    addTask: addSupabaseTask,
    updateTask: updateSupabaseTask,
    deleteTask: deleteSupabaseTask,
    addEvent: addSupabaseEvent,
    updateEvent: updateSupabaseEvent,
    deleteEvent: deleteSupabaseEvent,
    addProject: addSupabaseProject,
    updateProject: updateSupabaseProject,
    deleteProject: deleteSupabaseProject,
    addInboxItem: addSupabaseInboxItem,
    deleteInboxItem: deleteSupabaseInboxItem,
    addTaskType: addSupabaseTaskType,
    updateTaskType: updateSupabaseTaskType,
    deleteTaskType: deleteSupabaseTaskType,
    addProjectTemplate: addSupabaseProjectTemplate,
    updateProjectTemplate: updateSupabaseProjectTemplate,
    deleteProjectTemplate: deleteSupabaseProjectTemplate,
    loading: supabaseLoading,
    error
  } = useSupabaseTasks();

  // Use supabaseLoading with a fallback
  const loading = supabaseLoading || false;

  // Synchroniser les données Supabase avec l'état local
  useEffect(() => {
    if (supabaseTasks) {
      console.log('Syncing Supabase tasks:', supabaseTasks.length);
      setTasks(supabaseTasks);
    }
  }, [supabaseTasks]);

  useEffect(() => {
    if (supabaseEvents) {
      console.log('Syncing Supabase events:', supabaseEvents.length);
      setEvents(supabaseEvents);
    }
  }, [supabaseEvents]);

  useEffect(() => {
    if (supabaseProjects) {
      console.log('Syncing Supabase projects:', supabaseProjects.length);
      setProjects(supabaseProjects);
    }
  }, [supabaseProjects]);

  useEffect(() => {
    if (supabaseInboxItems) {
      console.log('Syncing Supabase inbox items:', supabaseInboxItems.length);
      setInboxItems(supabaseInboxItems);
    }
  }, [supabaseInboxItems]);

  useEffect(() => {
    if (supabaseTaskTypes) {
      console.log('Syncing Supabase task types:', supabaseTaskTypes.length);
      setTaskTypes(supabaseTaskTypes);
    }
  }, [supabaseTaskTypes]);

  useEffect(() => {
    if (supabaseProjectTemplates) {
      console.log('Syncing Supabase project templates:', supabaseProjectTemplates.length);
      setProjectTemplates(supabaseProjectTemplates);
    }
  }, [supabaseProjectTemplates]);

  // Task operations
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    console.log('Adding task:', taskData);
    try {
      await addSupabaseTask(taskData);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, [addSupabaseTask]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    console.log('Updating task:', id, updates);
    try {
      await updateSupabaseTask(id, updates);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [updateSupabaseTask]);

  const deleteTask = useCallback(async (id: string) => {
    console.log('Deleting task:', id);
    try {
      await deleteSupabaseTask(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [deleteSupabaseTask]);

  // Event operations
  const addEvent = useCallback(async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Adding event:', eventData);
    try {
      await addSupabaseEvent(eventData);
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }, [addSupabaseEvent]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    console.log('Updating event:', id, updates);
    try {
      await updateSupabaseEvent(id, updates);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }, [updateSupabaseEvent]);

  const deleteEvent = useCallback(async (id: string) => {
    console.log('Deleting event:', id);
    try {
      await deleteSupabaseEvent(id);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }, [deleteSupabaseEvent]);

  // Project operations
  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    console.log('Adding project:', projectData);
    try {
      await addSupabaseProject(projectData);
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }, [addSupabaseProject]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    console.log('Updating project:', id, updates);
    try {
      await updateSupabaseProject(id, updates);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, [updateSupabaseProject]);

  const deleteProject = useCallback(async (id: string) => {
    console.log('Deleting project:', id);
    try {
      await deleteSupabaseProject(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [deleteSupabaseProject]);

  // Inbox operations
  const addInboxItem = useCallback(async (itemData: Omit<InboxItem, 'id' | 'createdAt'>) => {
    console.log('Adding inbox item:', itemData);
    try {
      await addSupabaseInboxItem(itemData);
    } catch (error) {
      console.error('Error adding inbox item:', error);
      throw error;
    }
  }, [addSupabaseInboxItem]);

  const deleteInboxItem = useCallback(async (id: string) => {
    console.log('Deleting inbox item:', id);
    try {
      await deleteSupabaseInboxItem(id);
    } catch (error) {
      console.error('Error deleting inbox item:', error);
      throw error;
    }
  }, [deleteSupabaseInboxItem]);

  // TaskType operations - fix the type mismatch
  const addTaskType = useCallback(async (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Adding task type:', taskTypeData);
    try {
      await addSupabaseTaskType(taskTypeData);
    } catch (error) {
      console.error('Error adding task type:', error);
      throw error;
    }
  }, [addSupabaseTaskType]);

  const updateTaskType = useCallback(async (id: string, updates: Partial<TaskType>) => {
    console.log('Updating task type:', id, updates);
    try {
      await updateSupabaseTaskType(id, updates);
    } catch (error) {
      console.error('Error updating task type:', error);
      throw error;
    }
  }, [updateSupabaseTaskType]);

  const deleteTaskType = useCallback(async (id: string) => {
    console.log('Deleting task type:', id);
    try {
      await deleteSupabaseTaskType(id);
    } catch (error) {
      console.error('Error deleting task type:', error);
      throw error;
    }
  }, [deleteSupabaseTaskType]);

  // ProjectTemplate operations - fix the type mismatch
  const addProjectTemplate = useCallback(async (templateData: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Adding project template:', templateData);
    try {
      await addSupabaseProjectTemplate(templateData);
    } catch (error) {
      console.error('Error adding project template:', error);
      throw error;
    }
  }, [addSupabaseProjectTemplate]);

  const updateProjectTemplate = useCallback(async (id: string, updates: Partial<ProjectTemplate>) => {
    console.log('Updating project template:', id, updates);
    try {
      await updateSupabaseProjectTemplate(id, updates);
    } catch (error) {
      console.error('Error updating project template:', error);
      throw error;
    }
  }, [updateSupabaseProjectTemplate]);

  const deleteProjectTemplate = useCallback(async (id: string) => {
    console.log('Deleting project template:', id);
    try {
      await deleteSupabaseProjectTemplate(id);
    } catch (error) {
      console.error('Error deleting project template:', error);
      throw error;
    }
  }, [deleteSupabaseProjectTemplate]);

  // New function to create project from template
  const createProjectFromTemplate = useCallback(async (templateId: string, projectData: { title: string; description?: string; startDate: Date; deadline: Date }) => {
    console.log('Creating project from template:', templateId, projectData);
    try {
      const template = projectTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create the project first
      const project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'> = {
        title: projectData.title,
        description: projectData.description,
        startDate: projectData.startDate,
        deadline: projectData.deadline,
        color: template.color,
      };

      await addProject(project);

      // After project is created, we would create tasks from template
      // For now, we'll just create the project
      console.log('Project created from template successfully');
    } catch (error) {
      console.error('Error creating project from template:', error);
      throw error;
    }
  }, [projectTemplates, addProject]);

  return {
    // State
    tasks,
    events,
    projects,
    inboxItems,
    taskTypes,
    projectTemplates,
    loading,
    error,
    
    // Task operations
    addTask,
    updateTask,
    deleteTask,
    
    // Event operations
    addEvent,
    updateEvent,
    deleteEvent,
    
    // Project operations
    addProject,
    updateProject,
    deleteProject,
    
    // Inbox operations
    addInboxItem,
    deleteInboxItem,
    
    // TaskType operations
    addTaskType,
    updateTaskType,
    deleteTaskType,
    
    // ProjectTemplate operations
    addProjectTemplate,
    updateProjectTemplate,
    deleteProjectTemplate,
    createProjectFromTemplate
  };
}
