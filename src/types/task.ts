
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
}

export interface InboxItem {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  task?: Task;
  available: boolean;
}

export type Priority = Task['priority'];
