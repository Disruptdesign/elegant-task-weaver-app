
import React, { useState } from 'react';
import { Calendar, CheckSquare, X } from 'lucide-react';
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
    editingTask: editingTask ? {
      id: editingTask.id,
      title: editingTask.title
    } : null,
    editingEvent: editingEvent ? {
      id: editingEvent.id,
      title: editingEvent.title
    } : null,
    projects: projects.map(p => ({
      id: p.id,
      title: p.title
    })),
    taskTypes: taskTypes.map(t => ({
      id: t.id,
      name: t.name
    }))
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
    onCancel();
  };

  const handleEventSubmit = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    await onSubmitEvent(eventData);
    onCancel();
  };

  return (
    <div className="card-base w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-background flex items-center justify-between spacing-lg border-b border-border rounded-t-unified">
        <div className="flex-1">
          <h2 className="text-unified-xl font-semibold text-foreground">
            {editingTask ? 'Modifier la tâche' : editingEvent ? 'Modifier l\'événement' : 'Ajouter un nouvel élément'}
          </h2>
          <p className="text-unified-sm text-muted-foreground mt-1">
            {editingTask ? 'Modifiez les détails de la tâche.' : editingEvent ? 'Modifiez les détails de l\'événement.' : 'Choisissez le type d\'élément à créer.'}
          </p>
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant={currentType === 'task' ? 'primary' : 'outline'} 
              onClick={handleTaskTypeSelect} 
              disabled={isEditing} 
              size="sm"
              isActive={currentType === 'task'}
            >
              <CheckSquare size={16} />
              Tâche
            </Button>
            <Button 
              variant={currentType === 'event' ? 'primary' : 'outline'} 
              onClick={handleEventTypeSelect} 
              disabled={isEditing} 
              size="sm"
              isActive={currentType === 'event'}
            >
              <Calendar size={16} />
              Événement
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={onCancel} 
          variant="ghost" 
          size="icon"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="spacing-lg">
        {currentType === 'task' ? (
          <TaskForm 
            isOpen={true} 
            onClose={() => {}}
            onSubmit={handleTaskSubmit} 
            editingTask={editingTask} 
            projects={projects} 
            taskTypes={taskTypes} 
            tasks={[]} 
            inline={true}
          />
        ) : (
          <EventForm 
            isOpen={true} 
            onClose={() => {}}
            onSubmit={handleEventSubmit} 
            editingEvent={editingEvent} 
            inline={true}
          />
        )}
      </div>
    </div>
  );
}
