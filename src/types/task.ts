
export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // en minutes
  completed: boolean;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  // Nouvelles propriétés
  canStartFrom?: Date; // Date à partir de laquelle la tâche peut commencer
  bufferBefore?: number; // Temps de pause avant (en minutes)
  bufferAfter?: number; // Temps de pause après (en minutes)
  allowSplitting?: boolean; // Permettre le découpage
  splitDuration?: number; // Durée minimum pour le découpage (en minutes)
  projectId?: string; // ID du projet parent
  dependencies?: string[]; // IDs des tâches dont cette tâche dépend
  taskTypeId?: string; // ID du type de tâche
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  markAsBusy: boolean;
  googleMeetLink?: string;
  location?: string;
  bufferBefore?: number;
  bufferAfter?: number;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export interface InboxItem {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  deadline: Date;
  color?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskType {
  id: string;
  name: string;
  color: string;
  timeSlots: TimeSlot[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  task?: Task;
  available: boolean;
  dayOfWeek?: number; // 0-6, où 0 = dimanche
  startTime?: string; // Format HH:mm
  endTime?: string; // Format HH:mm
}

export type Priority = Task['priority'];
export type ItemType = 'task' | 'event';
