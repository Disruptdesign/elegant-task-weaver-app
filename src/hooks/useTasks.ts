
import { useState, useEffect } from 'react';
import { Task, Event, InboxItem } from '../types/task';
import { taskScheduler } from '../utils/taskScheduler';

const STORAGE_KEY = 'flowsavvy-tasks';
const EVENTS_STORAGE_KEY = 'flowsavvy-events';
const INBOX_STORAGE_KEY = 'flowsavvy-inbox';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);

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

  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTasks = [...tasks, newTask];
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks);
    setTasks(rescheduledTasks);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    );
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks);
    setTasks(rescheduledTasks);
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks);
    setTasks(rescheduledTasks);
  };

  const completeTask = (id: string) => {
    updateTask(id, { completed: true });
  };

  const rescheduleAllTasks = () => {
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(tasks);
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
    setEvents([...events, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(events.map(event =>
      event.id === id
        ? { ...event, ...updates, updatedAt: new Date() }
        : event
    ));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
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

  const convertInboxItemToTask = (item: InboxItem) => {
    // Supprimer l'élément de l'inbox
    deleteInboxItem(item.id);
    
    // Retourner les données pour créer une nouvelle tâche
    return {
      title: item.title,
      description: item.description,
    };
  };

  return {
    tasks,
    events,
    inboxItems,
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
  };
}
