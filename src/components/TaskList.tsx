
import React, { useState } from 'react';
import { Task } from '../types/task';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  onReschedule: () => void;
}

export function TaskList({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onAddTask,
  onReschedule,
}: TaskListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'pending' && !task.completed) ||
                         (filterStatus === 'completed' && task.completed);
    
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCardClick = (task: Task) => {
    handleEdit(task);
  };

  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      onUpdateTask(editingTask.id, taskData);
    } else {
      onAddTask(taskData);
    }
    setEditingTask(undefined);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const pendingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes tâches</h1>
          <p className="text-gray-600 mt-2">
            {pendingTasks.length} tâche{pendingTasks.length > 1 ? 's' : ''} en attente
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReschedule}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Replanifier
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={16} />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                <option value="pending">En attente</option>
                <option value="completed">Terminées</option>
              </select>
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes priorités</option>
              <option value="urgent">Urgente</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des tâches */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Search className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Aucune tâche trouvée
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre première tâche'
            }
          </p>
          {(!searchTerm && filterStatus === 'all' && filterPriority === 'all') && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Créer ma première tâche
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tâches en attente */}
          {pendingTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                En attente ({pendingTasks.length})
              </h2>
              <div className="grid gap-4">
                {pendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={onCompleteTask}
                    onEdit={handleEdit}
                    onDelete={onDeleteTask}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tâches terminées */}
          {completedTasks.length > 0 && filterStatus !== 'pending' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Terminées ({completedTasks.length})
              </h2>
              <div className="grid gap-4">
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={onCompleteTask}
                    onEdit={handleEdit}
                    onDelete={onDeleteTask}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulaire de tâche */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editingTask={editingTask}
      />
    </div>
  );
}
