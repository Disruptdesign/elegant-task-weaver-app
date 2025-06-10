
import React from 'react';
import { ListTodo, Plus, RefreshCw } from 'lucide-react';
import { TaskListStats } from './TaskListStats';
import { useUnifiedRescheduler } from '../hooks/useUnifiedRescheduler';
import { Task, Event } from '../types/task';

interface TaskListHeaderProps {
  pendingTasks: number;
  completedTasks: number;
  totalEvents: number;
  onAddNew: () => void;
  tasks: Task[];
  events: Event[];
  projects?: any[];
  onTasksUpdate: (tasks: Task[]) => void;
}

export function TaskListHeader({ 
  pendingTasks, 
  completedTasks, 
  totalEvents, 
  onAddNew,
  tasks,
  events,
  projects = [],
  onTasksUpdate
}: TaskListHeaderProps) {
  const { performUnifiedReschedule, isScheduling } = useUnifiedRescheduler();

  const handleReschedule = async () => {
    console.log('🔄 TASKLISTHEADER: Replanification unifiée avec contraintes canStartFrom STRICTEMENT PRÉSERVÉES');
    console.log('📊 Données pour replanification TaskListHeader:', {
      tasks: tasks.length,
      events: events.length,
      projects: projects.length
    });

    try {
      await performUnifiedReschedule(tasks, events, projects, onTasksUpdate);
      console.log('✅ TASKLISTHEADER: Replanification unifiée terminée avec contraintes STRICTEMENT respectées');
    } catch (error) {
      console.error('❌ TASKLISTHEADER: Erreur lors de la replanification unifiée:', error);
    }
  };

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
          onClick={handleReschedule}
          disabled={isScheduling}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md touch-target flex-1 sm:flex-none justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={isScheduling ? 'animate-spin' : ''} />
          <span>{isScheduling ? 'Replanification...' : 'Replanifier'}</span>
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
