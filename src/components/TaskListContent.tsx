
import React from 'react';
import { Task, Event, Project } from '../types/task';
import { TaskCard } from './TaskCard';
import { EventCard } from './EventCard';
import { Search, ListTodo, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface TaskListContentProps {
  items: (Task & { type: 'task' } | Event & { type: 'event' })[];
  hasActiveFilters: boolean;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onEditEvent: (event: Event) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onAddNew: () => void;
  onAssignTask?: (task: Task) => void;
  onAssignEvent?: (event: Event) => void;
  projects: Project[];
  loadingStates?: Record<string, boolean>;
}

export function TaskListContent({
  items,
  hasActiveFilters,
  onToggleComplete,
  onEditTask,
  onEditEvent,
  onDeleteTask,
  onDeleteEvent,
  onAddNew,
  onAssignTask,
  onAssignEvent,
  projects,
  loadingStates = {}
}: TaskListContentProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-responsive bg-background rounded-unified border border-border shadow-unified-sm mx-responsive">
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-muted rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-pulse">
          {hasActiveFilters ? (
            <Search className="text-muted-foreground" size={20} />
          ) : (
            <ListTodo className="text-muted-foreground" size={20} />
          )}
        </div>
        <h3 className="text-responsive font-semibold text-foreground mb-2 px-4">
          {hasActiveFilters
            ? 'Aucun élément trouvé' 
            : 'Aucune tâche ou événement'
          }
        </h3>
        <p className="text-muted-foreground mb-4 sm:mb-6 px-4 text-unified-sm sm:text-unified-base max-w-md mx-auto">
          {hasActiveFilters
            ? 'Essayez de modifier vos filtres de recherche ou d\'élargir vos critères'
            : 'Commencez par créer votre première tâche ou événement pour organiser votre travail'
          }
        </p>
        {!hasActiveFilters && (
          <Button
            onClick={onAddNew}
            variant="primary"
            size="lg"
          >
            <Plus size={16} />
            Créer le premier élément
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-responsive">
      <div className="grid gap-3 sm:gap-4">
        {items.map(item => (
          item.type === 'task' ? (
            <div 
              key={`task-${item.id}`} 
              className={`transition-unified ${loadingStates[item.id] ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <TaskCard
                task={item}
                onComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onClick={onEditTask}
                onAssignUser={onAssignTask}
                projects={projects}
                isLoading={loadingStates[item.id]}
              />
            </div>
          ) : (
            <div 
              key={`event-${item.id}`} 
              className={`transition-unified ${loadingStates[item.id] ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <EventCard
                event={item}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onClick={onEditEvent}
                onAssignUser={onAssignEvent}
                isLoading={loadingStates[item.id]}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
}
