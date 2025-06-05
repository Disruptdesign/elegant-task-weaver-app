
import React from 'react';
import { ListTodo, Plus, RefreshCw } from 'lucide-react';
import { TaskListStats } from './TaskListStats';

interface TaskListHeaderProps {
  pendingTasks: number;
  completedTasks: number;
  totalEvents: number;
  onAddNew: () => void;
  onReschedule: () => void;
}

export function TaskListHeader({ 
  pendingTasks, 
  completedTasks, 
  totalEvents, 
  onAddNew, 
  onReschedule 
}: TaskListHeaderProps) {
  return (
    <div className="flex flex-col gap-4 items-start">
      <div className="space-y-1 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
          <ListTodo className="text-blue-600" size={32} />
          Tâches et événements
        </h1>
        <TaskListStats 
          pendingTasks={pendingTasks}
          completedTasks={completedTasks}
          totalEvents={totalEvents}
        />
      </div>
      
      <div className="flex gap-3 w-full sm:w-auto">
        <button
          onClick={onReschedule}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md touch-target flex-1 sm:flex-none justify-center"
        >
          <RefreshCw size={16} />
          <span>Replanifier</span>
        </button>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl touch-target flex-1 sm:flex-none justify-center"
        >
          <Plus size={16} />
          <span>Nouveau</span>
        </button>
      </div>
    </div>
  );
}
