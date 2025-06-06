
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
export type ItemType = 'task' | 'event';

export interface TimeSlot {
  id: string;
  taskTypeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  available: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: Date;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedDuration: number;
  completed: boolean;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  canStartFrom?: Date;
  bufferBefore?: number;
  bufferAfter?: number;
  allowSplitting?: boolean;
  splitDuration?: number;
  projectId?: string;
  dependencies?: string[];
  taskTypeId?: string;
  assignments?: TaskAssignment[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  markAsBusy?: boolean;
  googleMeetLink?: string;
  location?: string;
  bufferBefore?: number;
  bufferAfter?: number;
  repeat?: RepeatType;
  createdAt: Date;
  updatedAt: Date;
  assignments?: EventAssignment[];
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
  color: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskType {
  id: string;
  name: string;
  color: string;
  timeSlots: TimeSlot[];
  autoSchedule: boolean;
  allowWeekends: boolean;
  bufferBetweenTasks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  color: string;
  defaultDuration: number;
  tasks: TemplateTask[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateTask {
  id: string;
  title: string;
  description?: string;
  estimatedDuration: number;
  priority: Priority;
  dayOffset: number;
  category?: string;
  bufferBefore?: number;
  bufferAfter?: number;
  allowSplitting?: boolean;
  splitDuration?: number;
  taskTypeId?: string;
  dependencies?: string[];
}

import { AppUser, TaskAssignment, EventAssignment } from './user';
