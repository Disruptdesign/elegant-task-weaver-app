
import React, { useState } from 'react';
import { Calendar, CheckSquare } from 'lucide-react';
import { Task, Event, Project, TaskType } from '../types/task';
import { TaskForm } from './TaskForm';
import { EventForm } from './EventForm';
import { Button } from './ui/button';

interface AddItemFormProps {
  onSubmitTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onSubmitEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  editingTask?: Task;
  editingEvent?: Event;
  projects?: Project[];
  taskTypes?: TaskType[];
}

export function AddItemForm({
  onSubmitTask,
  onSubmitEvent,
  onCancel,
  editingTask,
  editingEvent,
  projects = [],
  taskTypes = []
}: AddItemFormProps) {
  const [itemType, setItemType] = useState<'task' | 'event'>('task');

  console.log('AddItemForm: Rendering with', {
    projectsCount: projects.length,
    taskTypesCount: taskTypes.length,
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

  const handleTaskSubmit = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    await onSubmitTask(taskData);
    onCancel(); // Fermer le formulaire après soumission
  };

  const handleEventSubmit = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    await onSubmitEvent(eventData);
    onCancel(); // Fermer le formulaire après soumission
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTask ? 'Modifier la tâche' : editingEvent ? 'Modifier l\'événement' : 'Ajouter un nouvel élément'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {editingTask ? 'Modifiez les détails de la tâche.' : editingEvent ? 'Modifiez les détails de l\'événement.' : 'Choisissez le type d\'élément à créer.'}
          </p>
          
          {/* Sélecteur de type directement intégré */}
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
          onClick={onCancel} 
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-6">
        {currentType === 'task' ? (
          <TaskForm
            isOpen={true}
            onClose={() => {}} // Pas utilisé en mode inline
            onSubmit={handleTaskSubmit}
            editingTask={editingTask}
            projects={projects}
            taskTypes={taskTypes}
            tasks={[]}
            inline={true} // Mode inline activé
            onCancel={onCancel} // Passer la fonction onCancel
          />
        ) : (
          <EventForm
            isOpen={true}
            onClose={() => {}} // Pas utilisé en mode inline
            onSubmit={handleEventSubmit}
            editingEvent={editingEvent}
            inline={true} // Mode inline activé
            onCancel={onCancel} // Passer la fonction onCancel
          />
        )}
      </div>
    </div>
  );
}
