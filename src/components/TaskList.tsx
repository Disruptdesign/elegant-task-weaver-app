
import React, { useState } from 'react';
import { Task, Project, TaskType, Event } from '../types/task';
import { AddItemForm } from './AddItemForm';
import { TaskListHeader } from './TaskListHeader';
import { TaskListFilters } from './TaskListFilters';
import { TaskListContent } from './TaskListContent';
import { useTaskListFilters } from '../hooks/useTaskListFilters';
import { useTaskListSorting } from '../hooks/useTaskListSorting';
import { useToast } from '../hooks/use-toast';

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
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

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

  // Utilitaire pour gérer les états de chargement
  const setItemLoading = (itemId: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [itemId]: loading }));
  };

  // Fonctions de gestion avec amélioration des erreurs
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditingEvent(undefined);
    setShowForm(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditingTask(undefined);
    setShowForm(true);
  };

  const handleTaskFormSubmit = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingTask) {
        setItemLoading(editingTask.id, true);
        await onUpdateTask(editingTask.id, taskData);
        toast({
          title: "Tâche mise à jour",
          description: "La tâche a été modifiée avec succès.",
        });
      } else {
        await onAddTask(taskData);
        toast({
          title: "Tâche créée",
          description: "La nouvelle tâche a été ajoutée avec succès.",
        });
      }
      setEditingTask(undefined);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de la tâche.",
        variant: "destructive",
      });
    } finally {
      if (editingTask) {
        setItemLoading(editingTask.id, false);
      }
    }
  };

  const handleEventFormSubmit = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEvent) {
        setItemLoading(editingEvent.id, true);
        await onUpdateEvent(editingEvent.id, eventData);
        toast({
          title: "Événement mis à jour",
          description: "L'événement a été modifié avec succès.",
        });
      } else {
        await onAddEvent(eventData);
        toast({
          title: "Événement créé",
          description: "Le nouvel événement a été ajouté avec succès.",
        });
      }
      setEditingEvent(undefined);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'événement.",
        variant: "destructive",
      });
    } finally {
      if (editingEvent) {
        setItemLoading(editingEvent.id, false);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(undefined);
    setEditingEvent(undefined);
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      try {
        setItemLoading(taskId, true);
        console.log('🔄 Basculement état completion pour tâche:', taskId, 'De:', task.completed, 'Vers:', !task.completed);
        await onUpdateTask(taskId, { completed: !task.completed });
        toast({
          title: task.completed ? "Tâche rouverte" : "Tâche terminée",
          description: task.completed ? "La tâche a été rouverte." : "Félicitations ! Tâche marquée comme terminée.",
        });
      } catch (error) {
        console.error('Error toggling task completion:', error);
        toast({
          title: "Erreur",
          description: "Impossible de modifier l'état de la tâche.",
          variant: "destructive",
        });
      } finally {
        setItemLoading(taskId, false);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setItemLoading(taskId, true);
      await onDeleteTask(taskId);
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée définitivement.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche.",
        variant: "destructive",
      });
    } finally {
      setItemLoading(taskId, false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setItemLoading(eventId, true);
      await onDeleteEvent(eventId);
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé définitivement.",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement.",
        variant: "destructive",
      });
    } finally {
      setItemLoading(eventId, false);
    }
  };

  const handleAddNew = () => setShowForm(true);

  // Fonction pour mettre à jour les tâches après replanification
  const handleTasksUpdate = (updatedTasks: Task[]) => {
    console.log('📋 TaskList: Mise à jour des tâches après replanification', updatedTasks.length, 'tâches');
    
    // Appliquer les mises à jour via onUpdateTask pour chaque tâche modifiée
    updatedTasks.forEach(async (updatedTask) => {
      const originalTask = tasks.find(t => t.id === updatedTask.id);
      if (originalTask) {
        // Vérifier s'il y a des changements dans la planification
        const hasSchedulingChanges = 
          updatedTask.scheduledStart !== originalTask.scheduledStart ||
          updatedTask.scheduledEnd !== originalTask.scheduledEnd;
        
        if (hasSchedulingChanges) {
          console.log('🔄 TaskList: Application mise à jour tâche:', updatedTask.title, {
            avant: originalTask.scheduledStart ? new Date(originalTask.scheduledStart).toLocaleString() : 'non programmée',
            après: updatedTask.scheduledStart ? new Date(updatedTask.scheduledStart).toLocaleString() : 'non programmée'
          });
          
          try {
            await onUpdateTask(updatedTask.id, {
              scheduledStart: updatedTask.scheduledStart,
              scheduledEnd: updatedTask.scheduledEnd,
              canStartFrom: updatedTask.canStartFrom
            });
          } catch (error) {
            console.error('❌ TaskList: Erreur mise à jour tâche:', updatedTask.id, error);
          }
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <TaskListHeader
        pendingTasks={pendingTasks.length}
        completedTasks={completedTasks.length}
        totalEvents={totalEvents}
        onAddNew={handleAddNew}
        tasks={tasks}
        events={events}
        projects={projects}
        onTasksUpdate={handleTasksUpdate}
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
        loadingStates={loadingStates}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AddItemForm
            onSubmitTask={handleTaskFormSubmit}
            onSubmitEvent={handleEventFormSubmit}
            onCancel={handleFormClose}
            editingTask={editingTask}
            editingEvent={editingEvent}
            projects={projects}
            taskTypes={taskTypes}
          />
        </div>
      )}
    </div>
  );
}
