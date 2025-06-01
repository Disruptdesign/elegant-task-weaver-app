
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
}

export interface TimeSlot {
  start: Date;
  end: Date;
  task?: Task;
  available: boolean;
}

export type Priority = Task['priority'];
