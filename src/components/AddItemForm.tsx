
import React, { useState } from 'react';
import { X, Calendar, CheckSquare } from 'lucide-react';
import { Task, Event, Project, TaskType } from '../types/task';
import { TaskForm } from './TaskForm';
import { ExtendedTaskForm } from './ExtendedTaskForm';
import { EventForm } from './EventForm';
import { Button } from './ui/button';

interface AddItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onSubmitEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingTask?: Task;
  editingEvent?: Event;
  projects?: Project[];
  taskTypes?: TaskType[];
}

export function AddItemForm({
  isOpen,
  onClose,
  onSubmitTask,
  onSubmitEvent,
  editingTask,
  editingEvent,
  projects = [],
  taskTypes = []
}: AddItemFormProps) {
  const [itemType, setItemType] = useState<'task' | 'event'>('task');
  const [useExtendedForm, setUseExtendedForm] = useState(false);

  console.log('AddItemForm: Rendering with', {
    projectsCount: projects.length,
    taskTypesCount: taskTypes.length,
    isOpen,
    editingTask: editingTask ? { id: editingTask.id, title: editingTask.title } : null,
    editingEvent: editingEvent ? { id: editingEvent.id, title: editingEvent.title } : null,
    projects: projects.map(p => ({ id: p.id, title: p.title })),
    taskTypes: taskTypes.map(t => ({ id: t.id, name: t.name }))
  });

  React.useEffect(() => {
    if (editingTask) {
      setItemType('task');
    } else if (editingEvent) {
      setItemType('event');
    } else {
      setItemType('task');
    }
  }, [editingTask, editingEvent]);

  if (!isOpen) return null;

  // Si on édite une tâche ou un événement, déterminer le type automatiquement
  const currentType = editingTask ? 'task' : editingEvent ? 'event' : itemType;
  const isEditing = !!(editingTask || editingEvent);

  const handleTaskTypeSelect = () => {
    if (!isEditing) {
      setItemType('task');
    }
  };

  const handleEventTypeSelect = () => {
    if (!isEditing) {
      setItemType('event');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTask ? 'Modifier la tâche' : editingEvent ? 'Modifier l\'événement' : 'Ajouter un nouvel élément'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingTask ? 'Modifiez les détails de la tâche.' : editingEvent ? 'Modifiez les détails de l\'événement.' : 'Choisissez le type d\'élément à créer.'}
            </p>
            
            {/* Sélecteur de type directement intégré - toujours visible */}
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant={currentType === 'task' ? 'default' : 'outline'}
                onClick={handleTaskTypeSelect}
                disabled={isEditing}
                className="flex items-center gap-2"
              >
                <CheckSquare size={16} />
                Tâche
              </Button>
              <Button
                type="button"
                variant={currentType === 'event' ? 'default' : 'outline'}
                onClick={handleEventTypeSelect}
                disabled={isEditing}
                className="flex items-center gap-2"
              >
                <Calendar size={16} />
                Événement
              </Button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {currentType === 'task' ? (
            useExtendedForm ? (
              <ExtendedTaskForm
                onSubmit={onSubmitTask}
                onCancel={onClose}
                onDelete={editingTask ? (taskId: string) => {
                  console.log('AddItemForm: Tentative de suppression de tâche', taskId);
                  // TODO: Implémenter la suppression
                } : undefined}
                initialData={editingTask}
                projects={projects}
                taskTypes={taskTypes}
                tasks={[]} // Pas de dépendances pour l'instant
              />
            ) : (
              <TaskForm
                isOpen={false}
                onClose={onClose}
                onSubmit={onSubmitTask}
                editingTask={editingTask}
                projects={projects}
                taskTypes={taskTypes}
                tasks={[]}
              />
            )
          ) : (
            <EventForm
              isOpen={false}
              onClose={onClose}
              onSubmit={onSubmitEvent}
              editingEvent={editingEvent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
