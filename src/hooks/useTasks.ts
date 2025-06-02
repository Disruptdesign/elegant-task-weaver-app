
import { useState, useEffect } from 'react';
import { Task, Event, InboxItem, Project, TaskType } from '../types/task';
import { taskScheduler } from '../utils/taskScheduler';

const STORAGE_KEY = 'flowsavvy-tasks';
const EVENTS_STORAGE_KEY = 'flowsavvy-events';
const INBOX_STORAGE_KEY = 'flowsavvy-inbox';
const PROJECTS_STORAGE_KEY = 'flowsavvy-projects';
const TASK_TYPES_STORAGE_KEY = 'flowsavvy-task-types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);

  // Charger les tâches depuis le localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        deadline: new Date(task.deadline),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        scheduledStart: task.scheduledStart ? new Date(task.scheduledStart) : undefined,
        scheduledEnd: task.scheduledEnd ? new Date(task.scheduledEnd) : undefined,
        canStartFrom: task.canStartFrom ? new Date(task.canStartFrom) : undefined,
      }));
      setTasks(parsedTasks);
    }
  }, []);

  // Charger les événements depuis le localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));
      setEvents(parsedEvents);
    }
  }, []);

  // Charger l'inbox depuis le localStorage
  useEffect(() => {
    const savedInbox = localStorage.getItem(INBOX_STORAGE_KEY);
    if (savedInbox) {
      const parsedInbox = JSON.parse(savedInbox).map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }));
      setInboxItems(parsedInbox);
    }
  }, []);

  // Charger les projets depuis le localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects).map((project: any) => ({
        ...project,
        startDate: new Date(project.startDate),
        deadline: new Date(project.deadline),
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      }));
      setProjects(parsedProjects);
    }
  }, []);

  // Charger les types de tâches depuis le localStorage
  useEffect(() => {
    const savedTaskTypes = localStorage.getItem(TASK_TYPES_STORAGE_KEY);
    if (savedTaskTypes) {
      const parsedTaskTypes = JSON.parse(savedTaskTypes).map((taskType: any) => ({
        ...taskType,
        createdAt: new Date(taskType.createdAt),
        updatedAt: new Date(taskType.updatedAt),
        timeSlots: taskType.timeSlots?.map((slot: any) => ({
          ...slot,
          start: slot.start ? new Date(slot.start) : undefined,
          end: slot.end ? new Date(slot.end) : undefined,
        })) || [],
      }));
      setTaskTypes(parsedTaskTypes);
    } else {
      // Créer des types de tâches par défaut
      const defaultTaskTypes: TaskType[] = [
        {
          id: 'work',
          name: 'Travail',
          color: '#3B82F6',
          timeSlots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'personal',
          name: 'Personnel',
          color: '#10B981',
          timeSlots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'health',
          name: 'Santé',
          color: '#F59E0B',
          timeSlots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      setTaskTypes(defaultTaskTypes);
    }
  }, []);

  // Sauvegarder les tâches dans le localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Sauvegarder les événements dans le localStorage
  useEffect(() => {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  // Sauvegarder l'inbox dans le localStorage
  useEffect(() => {
    localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(inboxItems));
  }, [inboxItems]);

  // Sauvegarder les projets dans le localStorage
  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  // Sauvegarder les types de tâches dans le localStorage
  useEffect(() => {
    localStorage.setItem(TASK_TYPES_STORAGE_KEY, JSON.stringify(taskTypes));
  }, [taskTypes]);

  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTasks = [...tasks, newTask];
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks, events);
    setTasks(rescheduledTasks);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    );
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks, events);
    setTasks(rescheduledTasks);
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks, events);
    setTasks(rescheduledTasks);
  };

  const completeTask = (id: string) => {
    updateTask(id, { completed: true });
  };

  const rescheduleAllTasks = () => {
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(tasks, events);
    setTasks(rescheduledTasks);
  };

  // Fonctions pour les événements
  const addEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    
    // Replanifier toutes les tâches avec le nouvel événement
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(tasks, updatedEvents);
    setTasks(rescheduledTasks);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    const updatedEvents = events.map(event =>
      event.id === id
        ? { ...event, ...updates, updatedAt: new Date() }
        : event
    );
    setEvents(updatedEvents);
    
    // Replanifier toutes les tâches avec les événements mis à jour
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(tasks, updatedEvents);
    setTasks(rescheduledTasks);
  };

  const deleteEvent = (id: string) => {
    const updatedEvents = events.filter(event => event.id !== id);
    setEvents(updatedEvents);
    
    // Replanifier toutes les tâches sans l'événement supprimé
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(tasks, updatedEvents);
    setTasks(rescheduledTasks);
  };

  // Fonctions pour l'inbox
  const addInboxItem = (itemData: Omit<InboxItem, 'id' | 'createdAt'>) => {
    const newItem: InboxItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setInboxItems([...inboxItems, newItem]);
  };

  const deleteInboxItem = (id: string) => {
    setInboxItems(inboxItems.filter(item => item.id !== id));
  };

  const convertInboxItemToTask = (item: InboxItem, shouldDelete: boolean = false) => {
    // Supprimer l'élément de l'inbox seulement si explicitement demandé
    if (shouldDelete) {
      deleteInboxItem(item.id);
    }
    
    // Retourner les données pour créer une nouvelle tâche
    return {
      title: item.title,
      description: item.description,
    };
  };

  // Fonctions pour les projets
  const addProject = (projectData: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects([...projects, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updatedProjects = projects.map(project =>
      project.id === id
        ? { ...project, ...updates, updatedAt: new Date() }
        : project
    );
    setProjects(updatedProjects);
  };

  const deleteProject = (id: string) => {
    // Supprimer aussi toutes les tâches liées au projet
    const updatedTasks = tasks.filter(task => task.projectId !== id);
    setTasks(updatedTasks);
    setProjects(projects.filter(project => project.id !== id));
  };

  // Fonctions pour les types de tâches
  const addTaskType = (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTaskType: TaskType = {
      ...taskTypeData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTaskTypes([...taskTypes, newTaskType]);
  };

  const updateTaskType = (id: string, updates: Partial<TaskType>) => {
    const updatedTaskTypes = taskTypes.map(taskType =>
      taskType.id === id
        ? { ...taskType, ...updates, updatedAt: new Date() }
        : taskType
    );
    setTaskTypes(updatedTaskTypes);
  };

  const deleteTaskType = (id: string) => {
    setTaskTypes(taskTypes.filter(taskType => taskType.id !== id));
  };

  return {
    tasks,
    events,
    inboxItems,
    projects,
    taskTypes,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    rescheduleAllTasks,
    addEvent,
    updateEvent,
    deleteEvent,
    addInboxItem,
    deleteInboxItem,
    convertInboxItemToTask,
    addProject,
    updateProject,
    deleteProject,
    addTaskType,
    updateTaskType,
    deleteTaskType,
  };
}
