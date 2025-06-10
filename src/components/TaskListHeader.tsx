
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
    <div className="flex flex-col gap-2xl">
      <div className="space-y-sm">
        <h1 className="text-display-lg text-foreground flex items-center gap-lg flex-wrap">
          <ListTodo className="text-primary" size={32} />
          Tâches et événements
        </h1>
        <TaskListStats 
          pendingTasks={pendingTasks}
          completedTasks={completedTasks}
          totalEvents={totalEvents}
        />
      </div>
      
      <div className="flex gap-lg flex-wrap">
        <Button
          onClick={handleReschedule}
          disabled={isScheduling}
          variant="outline"
          className="gap-md"
        >
          <RefreshCw size={16} className={isScheduling ? 'animate-spin' : ''} />
          <span>{isScheduling ? 'Replanification...' : 'Replanifier'}</span>
        </Button>
        <Button
          onClick={onAddNew}
          className="gap-md shadow-sm"
        >
          <Plus size={16} />
          <span>Nouveau</span>
        </Button>
      </div>
    </div>
  );
}
