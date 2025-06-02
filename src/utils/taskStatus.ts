
import { Task } from '../types/task';
import { differenceInDays, isPast } from 'date-fns';

export type TaskStatus = 'on-time' | 'approaching' | 'overdue';

export const getTaskStatus = (task: Task, warningDays: number = 1): TaskStatus => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  
  // Si la tâche est terminée, elle n'est jamais en retard
  if (task.completed) {
    return 'on-time';
  }
  
  // Si l'échéance est passée par rapport à maintenant
  if (isPast(deadline)) {
    return 'overdue';
  }
  
  // Calculer les jours entre maintenant et l'échéance
  const daysUntilDeadline = differenceInDays(deadline, now);
  
  // Si l'échéance est proche (aujourd'hui ou demain)
  if (daysUntilDeadline <= warningDays && daysUntilDeadline >= 0) {
    return 'approaching';
  }
  
  return 'on-time';
};

export const getTaskStatusColors = (status: TaskStatus) => {
  switch (status) {
    case 'on-time':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        accent: 'bg-green-100',
        bgColor: '#f0fdf4',
        borderColor: '#bbf7d0'
      };
    case 'approaching':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        accent: 'bg-orange-100',
        bgColor: '#fff7ed',
        borderColor: '#fed7aa'
      };
    case 'overdue':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        accent: 'bg-red-100',
        bgColor: '#fef2f2',
        borderColor: '#fecaca'
      };
  }
};
