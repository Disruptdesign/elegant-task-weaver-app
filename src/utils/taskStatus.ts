
import { Task } from '../types/task';
import { differenceInDays, isPast } from 'date-fns';

export type TaskStatus = 'on-time' | 'approaching' | 'overdue';

export const getTaskStatus = (task: Task, warningDays: number = 1): TaskStatus => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  
  if (isPast(deadline) && !task.completed) {
    return 'overdue';
  }
  
  const daysUntilDeadline = differenceInDays(deadline, now);
  
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
        accent: 'bg-green-100'
      };
    case 'approaching':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        accent: 'bg-orange-100'
      };
    case 'overdue':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        accent: 'bg-red-100'
      };
  }
};
