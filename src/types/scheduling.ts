
import { Task, Event } from './task';

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  event?: Event;
}

export interface SchedulingOptions {
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  bufferBetweenTasks: number; // minutes
  maxTasksPerDay: number;
  allowWeekends: boolean;
}

export interface TaskConstraints {
  canStartFrom?: Date;
  deadline: Date;
  dependencies?: string[];
  projectId?: string;
}

export interface SchedulingContext {
  completedTasks: Task[];
  tasksInProgress: Task[];
  scheduledTasks: Task[];
  events: Event[];
  projects: any[];
}
