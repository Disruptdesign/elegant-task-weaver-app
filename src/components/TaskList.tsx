
import React, { useState } from 'react';
import { Task, Project, TaskType, Event } from '../types/task';
import { TaskCard } from './TaskCard';
import { EventCard } from './EventCard';
import { AddItemForm } from './AddItemForm';
import { Plus, Search, Filter, RefreshCw, ListTodo, CheckCircle, ArrowUpDown, Calendar, Clock } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  events: Event[];
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onCompleteTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onAddEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onReschedule: () => void;
  projects?: Project[];
  taskTypes?: TaskType[];
}

type SortOption = 'deadline' | 'priority' | 'title' | 'created' | 'project' | 'date';
type ItemType = 'all' | 'tasks' | 'events';

export function TaskList({
  tasks,
  events,
  onUpdateTask,
  onDeleteTask,
  onUpdateEvent,
  onDeleteEvent,
  onCompleteTask,
  onAddTask,
  onAddEvent,
  onReschedule,
  projects = [],
  taskTypes = [],
}: TaskListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [filterType, setFilterType] = useState<ItemType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  console.log('TaskList: Rendering with props:', {
    projects: projects.length,
    taskTypes: taskTypes.length,
    tasks: tasks.length,
    events: events.length
  });

  // Combiner et filtrer les éléments
  const allItems = [
    ...tasks.map(task => ({ ...task, type: 'task' as const })),
    ...events.map(event => ({ ...event, type: 'event' as const }))
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (item.type === 'task') {
      matchesStatus = filterStatus === 'all' ||
                     (filterStatus === 'pending' && !item.completed) ||
                     (filterStatus === 'completed' && item.completed);
    } else {
      // Pour les événements, on considère qu'ils sont toujours "pending" (non terminés)
      matchesStatus = filterStatus === 'all' || filterStatus === 'pending';
    }
    
    let matchesPriority = true;
    if (item.type === 'task') {
      matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    }
    
    const matchesType = filterType === 'all' ||
                       (filterType === 'tasks' && item.type === 'task') ||
                       (filterType === 'events' && item.type === 'event');
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'deadline':
      case 'date':
        const dateA = a.type === 'task' ? new Date(a.deadline) : new Date(a.startDate);
        const dateB = b.type === 'task' ? new Date(b.deadline) : new Date(b.startDate);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case 'priority':
        if (a.type === 'task' && b.type === 'task') {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
        } else {
          // Les événements ont une priorité neutre
          comparison = a.type === 'task' ? -1 : 1;
        }
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'project':
        if (a.type === 'task' && b.type === 'task') {
          const projectA = a.projectId ? projects.find(p => p.id === a.projectId)?.title || '' : '';
          const projectB = b.projectId ? projects.find(p => p.id === b.projectId)?.title || '' : '';
          comparison = projectA.localeCompare(projectB);
        } else {
          comparison = a.type === 'task' ? -1 : 1;
        }
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Fonctions de gestion
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditingEvent(undefined);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  const handleTaskFormSubmit = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingTask) {
        await onUpdateTask(editingTask.id, taskData);
      } else {
        await onAddTask(taskData);
      }
      setEditingTask(undefined);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEventFormSubmit = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEvent) {
        await onUpdateEvent(editingEvent.id, eventData);
      } else {
        await onAddEvent(eventData);
      }
      setEditingEvent(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
    setEditingEvent(undefined);
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      console.log('🔄 Basculement état completion pour tâche:', taskId, 'De:', task.completed, 'Vers:', !task.completed);
      onUpdateTask(taskId, { completed: !task.completed }).catch(error => {
        console.error('Error toggling task completion:', error);
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await onDeleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await onDeleteEvent(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  const totalTasks = tasks.length;
  const totalEvents = events.length;

  const typeFilterOptions = [
    { value: 'all', label: 'Tout', count: totalTasks + totalEvents },
    { value: 'tasks', label: 'Tâches', count: totalTasks },
    { value: 'events', label: 'Événements', count: totalEvents },
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'Toutes', count: filterType === 'events' ? totalEvents : (filterType === 'tasks' ? totalTasks : totalTasks + totalEvents) },
    { value: 'pending', label: 'En cours', count: filterType === 'events' ? totalEvents : pendingTasks.length },
    { value: 'completed', label: 'Terminées', count: filterType === 'events' ? 0 : completedTasks.length },
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'priority', label: 'Priorité' },
    { value: 'title', label: 'Titre' },
    { value: 'created', label: 'Date de création' },
    { value: 'project', label: 'Projet' },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 items-start">
        <div className="space-y-1 w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
            <ListTodo className="text-blue-600" size={32} />
            Tâches et événements
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {pendingTasks.length} tâches en cours
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {completedTasks.length} tâche{completedTasks.length > 1 ? 's' : ''} terminée{completedTasks.length > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              {totalEvents} événement{totalEvents > 1 ? 's' : ''}
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
            <span>Nouveau</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une tâche ou un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtre par type */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={16} className="text-gray-400 flex-shrink-0" />
              <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
                {typeFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterType(option.value as ItemType)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                      filterType === option.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre par statut */}
            <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value as any)}
                  disabled={filterType === 'events' && option.value === 'completed'}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    filterStatus === option.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>

            {/* Filtre par priorité (seulement pour les tâches) */}
            {filterType !== 'events' && (
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
            )}

            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-gray-400 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-target flex-1 sm:flex-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                title={sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des éléments */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-100">
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all' ? (
              <Search className="text-blue-400" size={28} />
            ) : (
              <ListTodo className="text-blue-400" size={28} />
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all'
              ? 'Aucun élément trouvé' 
              : 'Aucune tâche ou événement'
            }
          </h3>
          <p className="text-gray-600 mb-6 px-4">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre première tâche ou événement'
            }
          </p>
          {(!searchTerm && filterStatus === 'all' && filterPriority === 'all' && filterType === 'all') && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl touch-target"
            >
              Créer le premier élément
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {sortedItems.map(item => (
              item.type === 'task' ? (
                <TaskCard
                  key={`task-${item.id}`}
                  task={item}
                  onComplete={handleToggleComplete}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onClick={handleEditTask}
                  projects={projects}
                />
              ) : (
                <EventCard
                  key={`event-${item.id}`}
                  event={item}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  onClick={handleEditEvent}
                />
              )
            ))}
          </div>
        </div>
      )}

      <AddItemForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmitTask={handleTaskFormSubmit}
        onSubmitEvent={handleEventFormSubmit}
        editingTask={editingTask}
        editingEvent={editingEvent}
        projects={projects}
        taskTypes={taskTypes}
      />
    </div>
  );
}
