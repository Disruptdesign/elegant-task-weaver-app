
import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Link } from 'lucide-react';
import { TemplateTask, Priority } from '../types/task';

interface ProjectTaskManagerProps {
  tasks: TemplateTask[];
  onTasksChange: (tasks: TemplateTask[]) => void;
  availableTasks?: TemplateTask[];
}

export function ProjectTaskManager({ tasks, onTasksChange, availableTasks = [] }: ProjectTaskManagerProps) {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    estimatedDuration: 60,
    dayOffset: 0,
    dependencies: [] as string[],
  });

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    const task: TemplateTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      priority: newTask.priority,
      estimatedDuration: newTask.estimatedDuration,
      dayOffset: newTask.dayOffset,
      dependencies: newTask.dependencies,
    };

    onTasksChange([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      estimatedDuration: 60,
      dayOffset: 0,
      dependencies: [],
    });
  };

  const handleRemoveTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    // Nettoyer les dépendances qui pointent vers la tâche supprimée
    const cleanedTasks = updatedTasks.map(task => ({
      ...task,
      dependencies: task.dependencies?.filter(depId => depId !== taskId) || []
    }));
    onTasksChange(cleanedTasks);
  };

  const getTaskNameById = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : `Tâche ${taskId.slice(0, 8)}...`;
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Tâches du projet</h4>
      
      {/* Formulaire d'ajout de tâche */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <h5 className="text-sm font-medium text-gray-700">Ajouter une tâche</h5>
        
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Titre de la tâche"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>

        <textarea
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          placeholder="Description (optionnel)"
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Durée (minutes)</label>
            <input
              type="number"
              value={newTask.estimatedDuration}
              onChange={(e) => setNewTask({ ...newTask, estimatedDuration: parseInt(e.target.value) || 60 })}
              min="15"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Jour de début (après début projet)</label>
            <input
              type="number"
              value={newTask.dayOffset}
              onChange={(e) => setNewTask({ ...newTask, dayOffset: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Dépendances */}
        {tasks.length > 0 && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Dépendances (tâches qui doivent être terminées avant)</label>
            <div className="max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {tasks.map(task => (
                <label key={task.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newTask.dependencies.includes(task.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewTask({
                          ...newTask,
                          dependencies: [...newTask.dependencies, task.id]
                        });
                      } else {
                        setNewTask({
                          ...newTask,
                          dependencies: newTask.dependencies.filter(id => id !== task.id)
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span>{task.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAddTask}
          disabled={!newTask.title.trim()}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          Ajouter la tâche
        </button>
      </div>

      {/* Liste des tâches */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Tâches ({tasks.length})</h5>
          {tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                  {task.title}
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Link size={12} />
                      <span>{task.dependencies.length}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {task.priority} • {task.estimatedDuration}min • Jour {task.dayOffset}
                  {task.description && (
                    <div className="mt-1">{task.description}</div>
                  )}
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="mt-1">
                      <span className="font-medium">Dépend de:</span> {task.dependencies.map(depId => 
                        getTaskNameById(depId)
                      ).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTask(task.id)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
