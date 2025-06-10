
import React, { useState } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { InboxItem, Task, Project, TaskType } from '../types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AddItemForm } from './AddItemForm';

interface InboxItemCardProps {
  item: InboxItem;
  onDeleteInboxItem: (id: string) => void;
  onConvertToTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  projects: Project[];
  taskTypes: TaskType[];
}

export function InboxItemCard({ 
  item, 
  onDeleteInboxItem, 
  onConvertToTask, 
  projects, 
  taskTypes 
}: InboxItemCardProps) {
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleScheduleClick = () => {
    setShowTaskForm(true);
  };

  const handleTaskSubmit = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    onConvertToTask(taskData);
    onDeleteInboxItem(item.id);
    setShowTaskForm(false);
  };

  const handleCancel = () => {
    setShowTaskForm(false);
  };

  if (showTaskForm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <AddItemForm
          onSubmitTask={handleTaskSubmit}
          onSubmitEvent={async () => {}} // Pas utilisé dans ce contexte
          onCancel={handleCancel}
          projects={projects}
          taskTypes={taskTypes}
          prefilledData={{
            title: item.title,
            description: item.description || ''
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          )}
          <p className="text-xs text-gray-500">
            Ajouté le {format(item.createdAt, 'dd MMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
        
        <div className="flex items-center gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleScheduleClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs font-medium transition-colors"
          >
            <ArrowRight size={12} />
            Planifier
          </button>
          <button
            onClick={() => onDeleteInboxItem(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
