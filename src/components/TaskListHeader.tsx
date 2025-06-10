
import React from 'react';
import { ListTodo, Plus, RefreshCw } from 'lucide-react';
import { TaskListStats } from './TaskListStats';
import { useUnifiedRescheduler } from '../hooks/useUnifiedRescheduler';
import { Task, Event } from '../types/task';
import { Button } from './ui/button';

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
        <h1 className="text-responsive-xl font-bold text-foreground flex items-center gap-3 flex-wrap">
          <ListTodo className="text-foreground" size={32} />
          Tâches et événements
        </h1>
        <TaskListStats 
          pendingTasks={pendingTasks}
          completedTasks={completedTasks}
          totalEvents={totalEvents}
        />
      </div>
      
      <div className="flex gap-3 w-full sm:w-auto">
        <Button
          onClick={handleReschedule}
          disabled={isScheduling}
          variant="secondary"
          size="default"
          isLoading={isScheduling}
        >
          <RefreshCw size={16} className={isScheduling ? 'animate-spin' : ''} />
          <span>{isScheduling ? 'Replanification...' : 'Replanifier'}</span>
        </Button>
        
        <Button
          onClick={onAddNew}
          variant="primary"
          size="default"
        >
          <Plus size={16} />
          <span>Nouveau</span>
        </Button>
      </div>
    </div>
  );
}
