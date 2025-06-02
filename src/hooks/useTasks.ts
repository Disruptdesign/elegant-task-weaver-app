
import { useState, useEffect } from 'react';
import { Task, Event, InboxItem, Project, TaskType } from '../types/task';

export interface UseTasksReturn {
  tasks: Task[];
  events: Event[];
  inboxItems: InboxItem[];
  projects: Project[];
  taskTypes: TaskType[];
  filter: string;
  setFilter: (filter: string) => void;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => void;
  deleteInboxItem: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTaskType: (taskType: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskType: (id: string, updates: Partial<TaskType>) => void;
  deleteTaskType: (id: string) => void;
}

// Helper function to safely parse JSON from localStorage
const parseStoredData = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper function to safely parse dates
const parseDate = (date: any): Date => {
  if (date instanceof Date) return date;
  try {
    return new Date(date);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [filter, setFilter] = useState<string>('all');

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('Loading data from localStorage...');
    
    try {
      // Tasks
      const savedTasks = parseStoredData<any>('tasks', []);
      if (savedTasks.length > 0) {
        const parsedTasks = savedTasks.map((task: any) => ({
          ...task,
          deadline: parseDate(task.deadline),
          scheduledStart: task.scheduledStart ? parseDate(task.scheduledStart) : undefined,
          scheduledEnd: task.scheduledEnd ? parseDate(task.scheduledEnd) : undefined,
          canStartFrom: task.canStartFrom ? parseDate(task.canStartFrom) : undefined,
          createdAt: parseDate(task.createdAt),
          updatedAt: parseDate(task.updatedAt),
        }));
        setTasks(parsedTasks);
        console.log('Loaded tasks:', parsedTasks.length);
      }

      // Events
      const savedEvents = parseStoredData<any>('events', []);
      if (savedEvents.length > 0) {
        const parsedEvents = savedEvents.map((event: any) => ({
          ...event,
          startDate: parseDate(event.startDate),
          endDate: parseDate(event.endDate),
          createdAt: parseDate(event.createdAt),
          updatedAt: parseDate(event.updatedAt),
        }));
        setEvents(parsedEvents);
        console.log('Loaded events:', parsedEvents.length);
      }

      // Inbox Items
      const savedInboxItems = parseStoredData<any>('inboxItems', []);
      if (savedInboxItems.length > 0) {
        const parsedInboxItems = savedInboxItems.map((item: any) => ({
          ...item,
          createdAt: parseDate(item.createdAt),
        }));
        setInboxItems(parsedInboxItems);
        console.log('Loaded inbox items:', parsedInboxItems.length);
      }

      // Projects
      const savedProjects = parseStoredData<any>('projects', []);
      if (savedProjects.length > 0) {
        const parsedProjects = savedProjects.map((project: any) => ({
          ...project,
          startDate: parseDate(project.startDate),
          deadline: parseDate(project.deadline),
          createdAt: parseDate(project.createdAt),
          updatedAt: parseDate(project.updatedAt),
        }));
        setProjects(parsedProjects);
        console.log('Loaded projects:', parsedProjects.length);
      }

      // Task Types
      const savedTaskTypes = parseStoredData<any>('taskTypes', []);
      if (savedTaskTypes.length > 0) {
        setTaskTypes(savedTaskTypes);
        console.log('Loaded task types:', savedTaskTypes.length);
      }

      // Filter
      const savedFilter = localStorage.getItem('taskFilter') || 'all';
      setFilter(savedFilter);
      console.log('Data loading completed');
      
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('events', JSON.stringify(events));
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('inboxItems', JSON.stringify(inboxItems));
    } catch (error) {
      console.error('Error saving inbox items to localStorage:', error);
    }
  }, [inboxItems]);

  useEffect(() => {
    try {
      localStorage.setItem('projects', JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects to localStorage:', error);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
    } catch (error) {
      console.error('Error saving task types to localStorage:', error);
    }
  }, [taskTypes]);

  useEffect(() => {
    try {
      localStorage.setItem('taskFilter', filter);
    } catch (error) {
      console.error('Error saving filter to localStorage:', error);
    }
  }, [filter]);

  // Enhanced task creation with better ID generation
  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Adding new task:', newTask.title);
    setTasks(prev => {
      const updated = [...prev, newTask];
      console.log('Total tasks after adding:', updated.length);
      return updated;
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    console.log('Updating task:', id, updates);
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    ));
  };

  const deleteTask = (id: string) => {
    console.log('Deleting task:', id);
    setTasks(prev => {
      const updated = prev.filter(task => task.id !== id);
      console.log('Total tasks after deletion:', updated.length);
      return updated;
    });
  };

  const addEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Adding new event:', newEvent.title);
    setEvents(prev => {
      const updated = [...prev, newEvent];
      console.log('Total events after adding:', updated.length);
      return updated;
    });
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    console.log('Updating event:', id, updates);
    setEvents(prev => prev.map(event => 
      event.id === id 
        ? { ...event, ...updates, updatedAt: new Date() }
        : event
    ));
  };

  const deleteEvent = (id: string) => {
    console.log('Deleting event:', id);
    setEvents(prev => {
      const updated = prev.filter(event => event.id !== id);
      console.log('Total events after deletion:', updated.length);
      return updated;
    });
  };

  const addInboxItem = (itemData: Omit<InboxItem, 'id' | 'createdAt'>) => {
    const newItem: InboxItem = {
      ...itemData,
      id: `inbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    
    console.log('Adding new inbox item:', newItem.title);
    setInboxItems(prev => [...prev, newItem]);
  };

  const deleteInboxItem = (id: string) => {
    console.log('Deleting inbox item:', id);
    setInboxItems(prev => prev.filter(item => item.id !== id));
  };

  const addProject = (projectData: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Adding new project:', newProject.title);
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    console.log('Updating project:', id, updates);
    setProjects(prev => prev.map(project => 
      project.id === id 
        ? { ...project, ...updates, updatedAt: new Date() }
        : project
    ));
  };

  const deleteProject = (id: string) => {
    console.log('Deleting project:', id);
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const addTaskType = (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTaskType: TaskType = {
      ...taskTypeData,
      id: `tasktype-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Adding new task type:', newTaskType.name);
    setTaskTypes(prev => [...prev, newTaskType]);
  };

  const updateTaskType = (id: string, updates: Partial<TaskType>) => {
    console.log('Updating task type:', id, updates);
    setTaskTypes(prev => prev.map(taskType => 
      taskType.id === id 
        ? { ...taskType, ...updates, updatedAt: new Date() }
        : taskType
    ));
  };

  const deleteTaskType = (id: string) => {
    console.log('Deleting task type:', id);
    setTaskTypes(prev => prev.filter(taskType => taskType.id !== id));
  };

  return {
    tasks,
    events,
    inboxItems,
    projects,
    taskTypes,
    filter,
    setFilter,
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
  };
}
