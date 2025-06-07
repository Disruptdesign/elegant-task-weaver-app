
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
  projects,
  loadingStates = {}
}: TaskListContentProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 lg:py-16 bg-white rounded-2xl border border-gray-100 shadow-sm mx-2 sm:mx-0">
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-pulse">
          {hasActiveFilters ? (
            <Search className="text-blue-400" size={20} />
          ) : (
            <ListTodo className="text-blue-400" size={20} />
          )}
        </div>
        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 px-4">
          {hasActiveFilters
            ? 'Aucun élément trouvé' 
            : 'Aucune tâche ou événement'
          }
        </h3>
        <p className="text-gray-600 mb-4 sm:mb-6 px-4 text-sm sm:text-base max-w-md mx-auto">
          {hasActiveFilters
            ? 'Essayez de modifier vos filtres de recherche ou d\'élargir vos critères'
            : 'Commencez par créer votre première tâche ou événement pour organiser votre travail'
          }
        </p>
        {!hasActiveFilters && (
          <Button
            onClick={onAddNew}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 touch-target text-sm sm:text-base"
            size="lg"
          >
            <Plus className="mr-2" size={16} />
            Créer le premier élément
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4">
        {items.map(item => (
          item.type === 'task' ? (
            <div 
              key={`task-${item.id}`} 
              className={`transition-all duration-200 ${loadingStates[item.id] ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <TaskCard
                task={item}
                onComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onClick={onEditTask}
                projects={projects}
                isLoading={loadingStates[item.id]}
              />
            </div>
          ) : (
            <div 
              key={`event-${item.id}`} 
              className={`transition-all duration-200 ${loadingStates[item.id] ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <EventCard
                event={item}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onClick={onEditEvent}
                isLoading={loadingStates[item.id]}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
}
