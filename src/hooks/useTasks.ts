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

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [filter, setFilter] = useState<string>('all'); // Filtre par défaut sur "all"

  // Charger les données depuis localStorage au montage
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    const savedEvents = localStorage.getItem('events');
    const savedInboxItems = localStorage.getItem('inboxItems');
    const savedProjects = localStorage.getItem('projects');
    const savedTaskTypes = localStorage.getItem('taskTypes');
    const savedFilter = localStorage.getItem('taskFilter');

    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          deadline: new Date(task.deadline),
          scheduledStart: task.scheduledStart ? new Date(task.scheduledStart) : undefined,
          scheduledEnd: task.scheduledEnd ? new Date(task.scheduledEnd) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }));
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing saved tasks:', error);
      }
    }

    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        }));
        setEvents(parsedEvents);
      } catch (error) {
        console.error('Error parsing saved events:', error);
      }
    }

    if (savedInboxItems) {
      try {
        const parsedInboxItems = JSON.parse(savedInboxItems).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
        setInboxItems(parsedInboxItems);
      } catch (error) {
        console.error('Error parsing saved inbox items:', error);
      }
    }

    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects).map((project: any) => ({
          ...project,
          startDate: new Date(project.startDate),
          deadline: new Date(project.deadline),
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        }));
        setProjects(parsedProjects);
      } catch (error) {
        console.error('Error parsing saved projects:', error);
      }
    }

    if (savedTaskTypes) {
      try {
        const parsedTaskTypes = JSON.parse(savedTaskTypes);
        setTaskTypes(parsedTaskTypes);
      } catch (error) {
        console.error('Error parsing saved task types:', error);
      }
    }

    if (savedFilter) {
      setFilter(savedFilter);
    }
  }, []);

  // Sauvegarder les données dans localStorage quand elles changent
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('inboxItems', JSON.stringify(inboxItems));
  }, [inboxItems]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
  }, [taskTypes]);

  useEffect(() => {
    localStorage.setItem('taskFilter', filter);
  }, [filter]);

  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const addEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(event => 
      event.id === id 
        ? { ...event, ...updates, updatedAt: new Date() }
        : event
    ));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const addInboxItem = (itemData: Omit<InboxItem, 'id' | 'createdAt'>) => {
    const newItem: InboxItem = {
      ...itemData,
      id: `inbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    setInboxItems(prev => [...prev, newItem]);
  };

  const deleteInboxItem = (id: string) => {
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
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id 
        ? { ...project, ...updates, updatedAt: new Date() }
        : project
    ));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const addTaskType = (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTaskType: TaskType = {
      ...taskTypeData,
      id: `tasktype-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTaskTypes(prev => [...prev, newTaskType]);
  };

  const updateTaskType = (id: string, updates: Partial<TaskType>) => {
    setTaskTypes(prev => prev.map(taskType => 
      taskType.id === id 
        ? { ...taskType, ...updates, updatedAt: new Date() }
        : taskType
    ));
  };

  const deleteTaskType = (id: string) => {
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
