
import React from 'react';
import { Task, Event, Project, TaskType } from '../types/task';
import { TaskCard } from './TaskCard';
import { EventCard } from './EventCard';
import { Search, ListTodo } from 'lucide-react';

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
  projects
}: TaskListContentProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-100">
        <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
          {hasActiveFilters ? (
            <Search className="text-blue-400" size={28} />
          ) : (
            <ListTodo className="text-blue-400" size={28} />
          )}
        </div>
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
          {hasActiveFilters
            ? 'Aucun élément trouvé' 
            : 'Aucune tâche ou événement'
          }
        </h3>
        <p className="text-gray-600 mb-6 px-4">
          {hasActiveFilters
            ? 'Essayez de modifier vos filtres de recherche'
            : 'Commencez par créer votre première tâche ou événement'
          }
        </p>
        {!hasActiveFilters && (
          <button
            onClick={onAddNew}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl touch-target"
          >
            Créer le premier élément
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {items.map(item => (
          item.type === 'task' ? (
            <TaskCard
              key={`task-${item.id}`}
              task={item}
              onComplete={onToggleComplete}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onClick={onEditTask}
              projects={projects}
            />
          ) : (
            <EventCard
              key={`event-${item.id}`}
              event={item}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
              onClick={onEditEvent}
            />
          )
        ))}
      </div>
    </div>
  );
}
