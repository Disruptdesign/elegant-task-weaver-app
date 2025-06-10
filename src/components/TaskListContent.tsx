
import React from 'react';
import { Task, Event, Project } from '../types/task';
import { TaskCard } from './TaskCard';
import { EventCard } from './EventCard';
import { Search, ListTodo, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

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
      <Card className="text-center py-6xl container-padding">
        <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-2xl">
          {hasActiveFilters ? (
            <Search className="text-muted-foreground" size={24} />
          ) : (
            <ListTodo className="text-muted-foreground" size={24} />
          )}
        </div>
        <h3 className="text-display-sm text-foreground mb-md">
          {hasActiveFilters
            ? 'Aucun élément trouvé' 
            : 'Aucune tâche ou événement'
          }
        </h3>
        <p className="text-body-md text-muted-foreground mb-2xl max-w-md mx-auto">
          {hasActiveFilters
            ? 'Essayez de modifier vos filtres de recherche ou d\'élargir vos critères'
            : 'Commencez par créer votre première tâche ou événement pour organiser votre travail'
          }
        </p>
        {!hasActiveFilters && (
          <Button
            onClick={onAddNew}
            size="lg"
            className="gap-md"
          >
            <Plus size={16} />
            Créer le premier élément
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="grid gap-lg">
        {items.map(item => (
          item.type === 'task' ? (
            <div 
              key={`task-${item.id}`} 
              className={`transition-normal ${loadingStates[item.id] ? 'opacity-60 pointer-events-none' : ''}`}
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
              className={`transition-normal ${loadingStates[item.id] ? 'opacity-60 pointer-events-none' : ''}`}
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
