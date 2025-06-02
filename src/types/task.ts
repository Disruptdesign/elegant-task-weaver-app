
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

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  color?: string;
  defaultDuration: number; // Durée par défaut en jours
  tasks: TemplateTask[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // en minutes
  category?: string;
  bufferBefore?: number;
  bufferAfter?: number;
  allowSplitting?: boolean;
  splitDuration?: number;
  dependencies?: string[]; // IDs des autres tâches du template
  taskTypeId?: string;
  // Position relative dans le projet (en jours après le début)
  dayOffset?: number;
}

export interface TaskType {
  id: string;
  name: string;
  color: string;
  timeSlots: TimeSlot[];
  autoSchedule?: boolean; // Planification automatique activée
  allowWeekends?: boolean; // Permettre les week-ends
  bufferBetweenTasks?: number; // Pause entre tâches (en minutes)
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
