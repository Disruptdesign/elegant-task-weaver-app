import React, { useState } from 'react';
import { Task, Project, TaskType } from '../types/task';
import { TaskCard } from './TaskCard';
import { AddItemForm } from './AddItemForm';
import { Plus, Search, Filter, RefreshCw, ListTodo, CheckCircle } from 'lucide-react';
import { getTaskStatus } from '../utils/taskStatus';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  onReschedule: () => void;
  projects?: Project[];
  taskTypes?: TaskType[];
}

export function TaskList({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onAddTask,
  onReschedule,
  projects = [],
  taskTypes = [],
}: TaskListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');

  console.log('TaskList: Rendering with props:', {
    projects: projects.length,
    taskTypes: taskTypes.length
  });

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

  // Fonction améliorée pour gérer le basculement de l'état de completion
  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      console.log('🔄 Basculement état completion pour tâche:', taskId, 'De:', task.completed, 'Vers:', !task.completed);
      onUpdateTask(taskId, { completed: !task.completed });
    }
  };

  const pendingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  // Calculer les compteurs sur la base de TOUTES les tâches, pas seulement les filtrées
  const totalPendingTasks = tasks.filter(task => !task.completed).length;
  const totalCompletedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  const statusFilterOptions = [
    { value: 'all', label: 'Toutes', count: totalTasks },
    { value: 'pending', label: 'En cours', count: totalPendingTasks },
    { value: 'completed', label: 'Terminées', count: totalCompletedTasks },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête amélioré pour mobile */}
      <div className="flex flex-col gap-4 items-start">
        <div className="space-y-1 w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
            <ListTodo className="text-blue-600" size={32} />
            Mes tâches
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {totalPendingTasks} en cours
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {totalCompletedTasks} terminée{totalCompletedTasks > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onReschedule}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md touch-target flex-1 sm:flex-none justify-center"
          >
            <RefreshCw size={16} />
            <span>Replanifier</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl touch-target flex-1 sm:flex-none justify-center"
          >
            <Plus size={16} />
            <span>Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres améliorée pour mobile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            />
          </div>

          {/* Filtres - améliorés pour mobile */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtres de statut */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={16} className="text-gray-400 flex-shrink-0" />
              <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
                {statusFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterStatus(option.value as any)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                      filterStatus === option.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre de priorité */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-target flex-1 sm:flex-none"
            >
              <option value="all">Toutes priorités</option>
              <option value="urgent">🔴 Urgente</option>
              <option value="high">🟠 Haute</option>
              <option value="medium">🟡 Moyenne</option>
              <option value="low">🟢 Faible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des tâches - améliorée pour mobile */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-100">
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' ? (
              <Search className="text-blue-400" size={28} />
            ) : (
              <ListTodo className="text-blue-400" size={28} />
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
              ? 'Aucune tâche trouvée' 
              : 'Aucune tâche pour le moment'
            }
          </h3>
          <p className="text-gray-600 mb-6 px-4">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre première tâche'
            }
          </p>
          {(!searchTerm && filterStatus === 'all' && filterPriority === 'all') && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl touch-target"
            >
              Créer ma première tâche
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tâches en cours */}
          {pendingTasks.length > 0 && (filterStatus === 'all' || filterStatus === 'pending') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  En cours
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {pendingTasks.length}
                </span>
              </div>
              <div className="grid gap-4">
                {pendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleToggleComplete}
                    onEdit={handleEdit}
                    onDelete={onDeleteTask}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tâches terminées */}
          {completedTasks.length > 0 && (filterStatus === 'all' || filterStatus === 'completed') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  Terminées
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {completedTasks.length}
                </span>
              </div>
              <div className="grid gap-4">
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={handleToggleComplete}
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
      <AddItemForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmitTask={handleFormSubmit}
        onSubmitEvent={() => {}}
        editingTask={editingTask}
        projects={projects}
        taskTypes={taskTypes}
      />
    </div>
  );
}
