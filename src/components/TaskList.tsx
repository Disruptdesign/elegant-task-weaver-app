
import React, { useState } from 'react';
import { Task, Project, TaskType, Event } from '../types/task';
import { AddItemForm } from './AddItemForm';
import { TaskListHeader } from './TaskListHeader';
import { TaskListFilters } from './TaskListFilters';
import { TaskListContent } from './TaskListContent';
import { useTaskListFilters } from '../hooks/useTaskListFilters';
import { useTaskListSorting } from '../hooks/useTaskListSorting';

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

  console.log('TaskList: Rendering with props:', {
    projects: projects.length,
    taskTypes: taskTypes.length,
    tasks: tasks.length,
    events: events.length
  });

  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterType,
    setFilterType,
    filteredItems
  } = useTaskListFilters(tasks, events);

  const {
    sortBy,
    sortOrder,
    sortedItems,
    handleSortChange,
    setSortOrder
  } = useTaskListSorting(filteredItems, projects);

  // Calculer les statistiques
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  const totalTasks = tasks.length;
  const totalEvents = events.length;

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all';

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

  const handleAddNew = () => setIsFormOpen(true);

  return (
    <div className="space-y-6">
      <TaskListHeader
        pendingTasks={pendingTasks.length}
        completedTasks={completedTasks.length}
        totalEvents={totalEvents}
        onAddNew={handleAddNew}
        onReschedule={onReschedule}
      />

      <TaskListFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        setSortOrder={setSortOrder}
        totalTasks={totalTasks}
        totalEvents={totalEvents}
        pendingTasks={pendingTasks.length}
        completedTasks={completedTasks.length}
      />

      <TaskListContent
        items={sortedItems}
        hasActiveFilters={hasActiveFilters}
        onToggleComplete={handleToggleComplete}
        onEditTask={handleEditTask}
        onEditEvent={handleEditEvent}
        onDeleteTask={handleDeleteTask}
        onDeleteEvent={handleDeleteEvent}
        onAddNew={handleAddNew}
        projects={projects}
      />

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
