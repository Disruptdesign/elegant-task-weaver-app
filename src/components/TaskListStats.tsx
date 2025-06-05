
import React from 'react';

interface TaskListStatsProps {
  pendingTasks: number;
  completedTasks: number;
  totalEvents: number;
}

export function TaskListStats({ pendingTasks, completedTasks, totalEvents }: TaskListStatsProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
      <span className="flex items-center gap-1 whitespace-nowrap">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        {pendingTasks} tâches en cours
      </span>
      <span className="flex items-center gap-1 whitespace-nowrap">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        {completedTasks} tâche{completedTasks > 1 ? 's' : ''} terminée{completedTasks > 1 ? 's' : ''}
      </span>
      <span className="flex items-center gap-1 whitespace-nowrap">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        {totalEvents} événement{totalEvents > 1 ? 's' : ''}
      </span>
    </div>
  );
}
