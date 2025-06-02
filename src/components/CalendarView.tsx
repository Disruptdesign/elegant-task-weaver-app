import React, { useState, useEffect, useRef } from 'react';
import { Task, Event, Project } from '../types/task';
import { format, startOfWeek, addDays, isSameDay, startOfDay, addHours, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, CalendarDays, Users, Edit, Check, Square, RefreshCw } from 'lucide-react';
import { getTaskStatus, getTaskStatusColors } from '../utils/taskStatus';
import { AddItemForm } from './AddItemForm';
import { useCalendarDragAndDrop } from '../hooks/useCalendarDragAndDrop';
import { useAlgorithmicScheduler } from '../hooks/useAlgorithmicScheduler';
import { Button } from './ui/button';

interface CalendarViewProps {
  tasks: Task[];
  events: Event[];
  projects?: Project[];
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onUpdateEvent?: (id: string, updates: Partial<Event>) => void;
  addTask?: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  addEvent?: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

type ViewMode = 'week' | 'month';

// Fonction utilitaire pour normaliser les dates et éviter les problèmes de timezone
const normalizeDate = (date: Date | string): Date => {
  if (typeof date === 'string') {
    // Si c'est une chaîne ISO, la parser en préservant l'heure locale
    return new Date(date);
  }
  return date instanceof Date ? date : new Date(date);
};

// Fonction pour comparer les dates en ignorant les millisecondes
const isSameDayNormalized = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return isSameDay(d1, d2);
};

export function CalendarView({ 
  tasks, 
  events, 
  projects = [],
  onUpdateTask, 
  onUpdateEvent, 
  addTask, 
  addEvent 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [testDataAdded, setTestDataAdded] = useState(false);
  
  // Hook pour la planification algorithmique - utiliser rescheduleAllTasks pour la replanification
  const { isScheduling, rescheduleAllTasks } = useAlgorithmicScheduler();
  
  // Gestion des clics avec délai pour éviter l'ouverture pendant le drag
  const clickTimerRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);
  
  // Étendre les heures pour couvrir toute la journée (00h à 23h)
  const allDayHours = Array.from({ length: 24 }, (_, i) => i);

  console.log('CalendarView render:', { 
    tasksCount: tasks.length, 
    eventsCount: events.length,
    hasUpdateTask: !!onUpdateTask,
    hasUpdateEvent: !!onUpdateEvent
  });

  // Debug des événements reçus avec normalisation
  useEffect(() => {
    console.log('🎭 CalendarView: Événements reçus (normalisés):', events.map(e => {
      const startDate = normalizeDate(e.startDate);
      const endDate = normalizeDate(e.endDate);
      return {
        id: e.id,
        title: e.title,
        originalStartDate: e.startDate,
        originalEndDate: e.endDate,
        normalizedStartDate: startDate.toISOString(),
        normalizedEndDate: endDate.toISOString(),
        startHour: startDate.getHours(),
        startMinute: startDate.getMinutes()
      };
    }));
  }, [events]);

  // Utiliser le hook unifié de drag & drop
  const {
    dragState,
    startTaskDrag,
    startEventDrag,
  } = useCalendarDragAndDrop(
    onUpdateTask || (() => console.log('No task update function provided')),
    onUpdateEvent || (() => console.log('No event update function provided'))
  );

  // Nettoyer le timer de clic quand un drag commence
  useEffect(() => {
    if (dragState.isDragging || dragState.isResizing) {
      dragStartedRef.current = true;
      if (clickTimerRef.current) {
        console.log('Drag started - cancelling pending click');
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    } else if (dragStartedRef.current) {
      // Reset du flag après la fin du drag
      setTimeout(() => {
        dragStartedRef.current = false;
      }, 100);
    }
  }, [dragState.isDragging, dragState.isResizing]);

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  // Ajouter des données de test si nécessaire et si les fonctions sont disponibles
  useEffect(() => {
    if (!testDataAdded && (tasks.length === 0 || events.length === 0)) {
      if (addTask && tasks.length === 0) {
        console.log('Adding test task for demonstration');
        const testTask: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'> = {
          title: 'Tâche test drag & drop',
          description: 'Tâche pour tester le glisser-déposer',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: 'medium',
          estimatedDuration: 60,
          scheduledStart: new Date(Date.now() + 60 * 60 * 1000),
          scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
        };
        addTask(testTask);
      }
      
      if (addEvent && events.length === 0) {
        console.log('Adding test event for demonstration');
        const testEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
          title: 'Événement test drag & drop',
          description: 'Événement pour tester le glisser-déposer',
          startDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
          allDay: false,
          markAsBusy: true,
          location: 'Bureau',
        };
        addEvent(testEvent);
      }
      
      setTestDataAdded(true);
    }
  }, [addTask, addEvent, tasks.length, events.length, testDataAdded]);

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const getDaysToShow = () => {
    return viewMode === 'week' ? getWeekDays() : getMonthDays();
  };

  const getTasksForDay = (date: Date) => {
    const dayTasks = tasks.filter(task => 
      task.scheduledStart && isSameDayNormalized(task.scheduledStart, date)
    );
    console.log(`Tasks for ${format(date, 'yyyy-MM-dd')}:`, dayTasks.length);
    return dayTasks;
  };

  const getEventsForDay = (date: Date) => {
    console.log(`🔍 Filtrage événements pour ${format(date, 'yyyy-MM-dd')} (amélioré):`);
    
    const dayEvents = events.filter(event => {
      // Normaliser les dates avec gestion robuste des timezones
      const eventStart = normalizeDate(event.startDate);
      const eventEnd = normalizeDate(event.endDate);
      
      // Utiliser isSameDay de date-fns qui est plus robuste
      const isEventStartSameDay = isSameDay(eventStart, date);
      const isEventEndSameDay = isSameDay(eventEnd, date);
      
      // Pour les événements multi-jours, vérifier si la date cible est dans la plage
      const targetTime = date.getTime();
      const eventStartTime = startOfDay(eventStart).getTime();
      const eventEndTime = startOfDay(eventEnd).getTime();
      const isInRange = targetTime >= eventStartTime && targetTime <= eventEndTime;
      
      console.log(`   - Événement "${event.title}":`, {
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        targetDate: date.toISOString(),
        isEventStartSameDay,
        isEventEndSameDay,
        isInRange,
        eventStartHour: eventStart.getHours(),
        eventStartMinute: eventStart.getMinutes()
      });
      
      const matches = isEventStartSameDay || isEventEndSameDay || isInRange;
      
      if (matches) {
        console.log(`   ✅ Événement "${event.title}" correspond au jour ${format(date, 'yyyy-MM-dd')}`);
      }
      
      return matches;
    });
    
    console.log(`📊 Total événements pour ${format(date, 'yyyy-MM-dd')}:`, dayEvents.length);
    return dayEvents;
  };

  const getTaskPosition = (task: Task) => {
    if (!task.scheduledStart) {
      console.log('Task has no scheduledStart:', task.title);
      return null;
    }
    
    const start = normalizeDate(task.scheduledStart);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    // Ajuster le calcul pour couvrir toute la journée (00h à 23h)
    const adjustedTop = (startHour + startMinute / 60) * 64;
    const height = Math.max((task.estimatedDuration / 60) * 64, 28);
    
    console.log('Task position (normalisée pour 24h):', { 
      title: task.title, 
      originalStart: task.scheduledStart,
      normalizedStart: start.toISOString(),
      startHour, 
      startMinute, 
      top: adjustedTop, 
      height 
    });
    
    return { top: Math.max(0, adjustedTop), height };
  };

  const getEventPosition = (event: Event) => {
    if (event.allDay) return null;
    
    const start = normalizeDate(event.startDate);
    const end = normalizeDate(event.endDate);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    // Ajuster le calcul pour couvrir toute la journée (00h à 23h)
    const top = (startHour + startMinute / 60) * 64;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    const height = Math.max((duration / 60) * 64, 28);
    
    console.log('Event position (normalisée pour 24h):', { 
      title: event.title, 
      originalStart: event.startDate,
      originalEnd: event.endDate,
      normalizedStart: start.toISOString(),
      normalizedEnd: end.toISOString(),
      startHour, 
      startMinute, 
      duration,
      top, 
      height 
    });
    
    return { top: Math.max(0, top), height };
  };

  // Gestionnaire amélioré pour la replanification algorithmique AGGRESSIVE
  const handleReschedule = async () => {
    if (!onUpdateTask) {
      console.log('🚫 Impossible de replanifier : aucune fonction de mise à jour des tâches fournie');
      return;
    }

    console.log('🔄 Démarrage de la replanification algorithmique AGGRESSIVE...');
    console.log('📊 État initial:', {
      totalTasks: tasks.length,
      scheduledTasks: tasks.filter(t => t.scheduledStart && !t.completed).length,
      unscheduledTasks: tasks.filter(t => !t.scheduledStart && !t.completed).length,
      completedTasks: tasks.filter(t => t.completed).length,
      events: events.length
    });
    
    try {
      // Utiliser la replanification aggressive qui va replanifier TOUTES les tâches non terminées
      const rescheduledTasks = await rescheduleAllTasks(tasks, events);
      
      console.log('📈 Résultats de la replanification aggressive:', {
        tasksProcessed: rescheduledTasks.length,
        newlyScheduled: rescheduledTasks.filter(t => t.scheduledStart && !t.completed).length,
        totalUnscheduled: rescheduledTasks.filter(t => !t.scheduledStart && !t.completed).length
      });
      
      // Appliquer les changements pour chaque tâche modifiée
      let updatedCount = 0;
      rescheduledTasks.forEach(rescheduledTask => {
        const originalTask = tasks.find(t => t.id === rescheduledTask.id);
        if (originalTask) {
          // Vérifier si la planification a changé
          const hasScheduleChanged = 
            originalTask.scheduledStart !== rescheduledTask.scheduledStart ||
            originalTask.scheduledEnd !== rescheduledTask.scheduledEnd;
          
          if (hasScheduleChanged) {
            console.log(`📅 Mise à jour tâche "${rescheduledTask.title}":`, {
              avant: originalTask.scheduledStart ? format(new Date(originalTask.scheduledStart), 'dd/MM HH:mm') : 'non planifiée',
              après: rescheduledTask.scheduledStart ? format(new Date(rescheduledTask.scheduledStart), 'dd/MM HH:mm') : 'non planifiée',
              durée: rescheduledTask.estimatedDuration + 'min'
            });
            
            onUpdateTask(rescheduledTask.id, {
              scheduledStart: rescheduledTask.scheduledStart,
              scheduledEnd: rescheduledTask.scheduledEnd
            });
            updatedCount++;
          }
        }
      });
      
      console.log(`✅ Replanification aggressive terminée avec succès ! ${updatedCount} tâche(s) mise(s) à jour.`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la replanification algorithmique:', error);
    }
  };

  // Gestionnaires de clic simplifiés
  const handleTaskClick = (task: Task) => {
    console.log('Task clicked for editing:', task.id);
    setSelectedTask(task);
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  };

  const handleEventClick = (event: Event) => {
    console.log('Event clicked for editing:', event.id);
    setSelectedEvent(event);
    setSelectedTask(undefined);
    setIsFormOpen(true);
  };

  const handleTaskCompletion = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Completing task:', task.id, 'current completed:', task.completed);
    if (onUpdateTask) {
      onUpdateTask(task.id, { completed: !task.completed });
    }
  };

  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    console.log('📝 Task form submitted:', taskData);
    if (selectedTask && onUpdateTask) {
      onUpdateTask(selectedTask.id, taskData);
    } else if (addTask) {
      addTask(taskData);
    }
    setSelectedTask(undefined);
  };

  const handleEventFormSubmit = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('📝 Event form submitted (dates normalisées):', {
      ...eventData,
      startDate: normalizeDate(eventData.startDate).toISOString(),
      endDate: normalizeDate(eventData.endDate).toISOString()
    });
    if (selectedEvent && onUpdateEvent) {
      // Normaliser les dates avant la mise à jour
      const normalizedData = {
        ...eventData,
        startDate: normalizeDate(eventData.startDate),
        endDate: normalizeDate(eventData.endDate)
      };
      onUpdateEvent(selectedEvent.id, normalizedData);
    } else if (addEvent) {
      console.log('🎯 Ajout nouvel événement via CalendarView (normalisé):', {
        title: eventData.title,
        startDate: normalizeDate(eventData.startDate).toISOString(),
        endDate: normalizeDate(eventData.endDate).toISOString()
      });
      // Normaliser les dates avant l'ajout
      const normalizedData = {
        ...eventData,
        startDate: normalizeDate(eventData.startDate),
        endDate: normalizeDate(eventData.endDate)
      };
      addEvent(normalizedData);
    }
    setSelectedEvent(undefined);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTask(undefined);
    setSelectedEvent(undefined);
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const amount = viewMode === 'week' ? 7 : 30;
    const newDate = addDays(currentDate, direction === 'next' ? amount : -amount);
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy', { locale: fr })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: fr });
    }
  };

  // Gestionnaires pour le drag & drop des tâches
  const handleTaskMouseDown = (e: React.MouseEvent, task: Task, action: 'move' | 'resize', resizeHandle?: 'top' | 'bottom') => {
    console.log('Task mouse down:', { 
      action, 
      taskTitle: task.title, 
      hasUpdateFunction: !!onUpdateTask,
      mouseButton: e.button,
      taskId: task.id
    });
    
    if (e.button !== 0) return;
    
    if (!onUpdateTask) {
      console.log('Cannot start task drag: no update function provided');
      return;
    }
    
    // Passer la fonction de clic appropriée
    const onTaskClick = action === 'move' ? () => handleTaskClick(task) : undefined;
    startTaskDrag(e, task, action, resizeHandle, onTaskClick);
  };

  // Gestionnaires pour le drag & drop des événements
  const handleEventMouseDown = (e: React.MouseEvent, event: Event, action: 'move' | 'resize', resizeHandle?: 'top' | 'bottom') => {
    console.log('Event mouse down:', { 
      action, 
      eventTitle: event.title, 
      hasUpdateFunction: !!onUpdateEvent,
      mouseButton: e.button,
      eventId: event.id
    });
    
    if (e.button !== 0) return;
    
    if (!onUpdateEvent) {
      console.log('Cannot start event drag: no update function provided');
      return;
    }
    
    // Passer la fonction de clic appropriée
    const onEventClick = action === 'move' ? () => handleEventClick(event) : undefined;
    startEventDrag(e, event, action, resizeHandle, onEventClick);
  };

  // Calculer le nombre de tâches à replanifier
  const unscheduledTasksCount = tasks.filter(t => !t.completed && !t.scheduledStart).length;
  const schedulableTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="text-blue-600" size={32} />
            Vue calendrier
          </h1>
          <p className="text-gray-600 mt-2">
            {getDateRangeText()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Bouton de replanification algorithmique amélioré */}
          {onUpdateTask && (
            <Button
              onClick={handleReschedule}
              disabled={isScheduling || schedulableTasksCount === 0}
              variant="outline"
              className={`flex items-center gap-2 px-4 py-2 transition-all ${
                unscheduledTasksCount > 0 
                  ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <RefreshCw 
                size={16} 
                className={isScheduling ? 'animate-spin' : ''} 
              />
              {isScheduling ? (
                'Replanification...'
              ) : (
                <>
                  Replanifier
                  {unscheduledTasksCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                      {unscheduledTasksCount}
                    </span>
                  )}
                </>
              )}
            </Button>
          )}
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mois
            </button>
          </div>

          <button
            onClick={() => navigatePeriod('prev')}
            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => navigatePeriod('next')}
            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Debug info amélioré avec informations de planification */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          📊 Debug: {tasks.length} tâche{tasks.length > 1 ? 's' : ''}, {events.length} événement{events.length > 1 ? 's' : ''}
          {tasks.filter(t => t.scheduledStart && !t.completed).length > 0 && ` - ${tasks.filter(t => t.scheduledStart && !t.completed).length} tâche(s) programmée(s)`}
          {unscheduledTasksCount > 0 && ` - ${unscheduledTasksCount} tâche(s) non programmée(s)`}
          {events.filter(e => !e.allDay).length > 0 && ` - ${events.filter(e => !e.allDay).length} événement(s) avec horaire`}
          {dragState.isDragging && ' - 🎯 DRAGGING'}
          {dragState.isResizing && ' - 📏 RESIZING'}
          {isScheduling && ' - 🤖 REPLANIFICATION ALGORITHMIQUE EN COURS'}
        </p>
        {events.length > 0 && (
          <div className="text-xs text-blue-600 mt-2">
            Événements détectés: {events.map(e => {
              const start = normalizeDate(e.startDate);
              return `"${e.title}" (${format(start, 'dd/MM/yyyy HH:mm')})`;
            }).join(', ')}
          </div>
        )}
        {onUpdateTask && unscheduledTasksCount > 0 && (
          <div className="text-xs text-green-600 mt-1">
            🤖 {unscheduledTasksCount} tâche(s) peuvent être planifiées automatiquement avec l'algorithme optimisé
          </div>
        )}
        {onUpdateTask && schedulableTasksCount > unscheduledTasksCount && (
          <div className="text-xs text-amber-600 mt-1">
            🔄 {schedulableTasksCount - unscheduledTasksCount} tâche(s) déjà programmée(s) peuvent être replanifiées pour optimisation
          </div>
        )}
      </div>

      {viewMode === 'week' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête des jours - Style Notion */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="w-16 p-3 text-center text-xs font-medium text-gray-500 border-r border-gray-200">
              GMT+1
            </div>
            {getWeekDays().map((day, index) => {
              const isToday = isSameDayNormalized(day, new Date());
              const dayTasks = getTasksForDay(day);
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={index}
                  className={`p-3 text-center border-r border-gray-200 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className={`text-lg font-semibold mt-1 ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grille horaire - Style Notion pour 24 heures avec hauteur réduite */}
          <div className="relative max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-8">
              {/* Colonne des heures - Toute la journée */}
              <div className="w-16 bg-gray-50/30 border-r border-gray-200">
                {allDayHours.map(hour => (
                  <div key={hour} className="h-16 border-b border-gray-100 flex items-start justify-center pt-1">
                    <span className="text-xs font-medium text-gray-400">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Colonnes des jours */}
              {getWeekDays().map((day, dayIndex) => (
                <div 
                  key={dayIndex} 
                  className="relative border-r border-gray-200 bg-white hover:bg-gray-50/30 transition-colors"
                >
                  {/* Lignes horaires */}
                  {allDayHours.map(hour => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100"
                    />
                  ))}

                  {/* Événements - Style Notion avec contenu aligné en haut */}
                  <div className="absolute inset-0 p-1 pointer-events-none">
                    {getEventsForDay(day)
                      .filter(event => !event.allDay)
                      .map(event => {
                        const position = getEventPosition(event);
                        if (!position) return null;

                        const isBeingDragged = dragState.itemId === event.id && dragState.itemType === 'event';
                        
                        // Calculer le nombre de lignes possible pour le titre
                        const lineHeight = 14; // hauteur d'une ligne en pixels
                        const padding = 8; // padding vertical total
                        const timeHeight = position.height > 35 ? 14 : 0; // hauteur de l'heure si affichée
                        const availableHeight = position.height - padding - timeHeight;
                        const maxLines = Math.min(3, Math.floor(availableHeight / lineHeight));

                        return (
                          <div
                            key={`event-${event.id}`}
                            className={`absolute rounded-lg transition-all duration-200 cursor-pointer pointer-events-auto select-none shadow-sm group ${
                              isBeingDragged 
                                ? 'opacity-80 shadow-lg z-50' 
                                : 'hover:shadow-md'
                            }`}
                            style={{
                              top: `${position.top}px`,
                              height: `${position.height}px`,
                              left: '2px',
                              right: '2px',
                              backgroundColor: '#f0f9ff',
                              border: '1px solid #e0f2fe',
                            }}
                            onMouseDown={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const relativeY = e.clientY - rect.top;
                              
                              if (relativeY <= 4 && onUpdateEvent) {
                                handleEventMouseDown(e, event, 'resize', 'top');
                              } else if (relativeY >= rect.height - 4 && onUpdateEvent) {
                                handleEventMouseDown(e, event, 'resize', 'bottom');
                              } else if (onUpdateEvent) {
                                handleEventMouseDown(e, event, 'move');
                              }
                            }}
                          >
                            {/* Zone de redimensionnement haut */}
                            <div className="absolute top-0 left-0 right-0 h-1 cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Contenu aligné en haut */}
                            <div className="h-full px-2 py-1 flex flex-col justify-start">
                              <div 
                                className="text-xs font-medium text-sky-800 leading-tight"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: maxLines,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {event.title}
                              </div>
                              {position.height > 35 && (
                                <div className="text-xs text-sky-600 leading-tight mt-0.5 opacity-75 flex-shrink-0">
                                  {format(new Date(event.startDate), 'HH:mm')}
                                </div>
                              )}
                            </div>
                            
                            {/* Zone de redimensionnement bas */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        );
                      })}
                  </div>

                  {/* Tâches - Style Notion avec couleurs de fond corrigées */}
                  <div className="absolute inset-0 p-1 pointer-events-none">
                    {getTasksForDay(day).map(task => {
                      const position = getTaskPosition(task);
                      if (!position) {
                        console.log('No position calculated for task:', task.title);
                        return null;
                      }

                      const isBeingDragged = dragState.itemId === task.id && dragState.itemType === 'task';
                      const isCompleted = task.completed;
                      const taskStatus = getTaskStatus(task);
                      const statusColors = getTaskStatusColors(taskStatus);
                      
                      // Calculer le nombre de lignes possible pour le titre
                      const lineHeight = 14;
                      const padding = 8;
                      const checkboxWidth = 20;
                      const timeHeight = position.height > 35 ? 14 : 0;
                      const availableHeight = position.height - padding - timeHeight;
                      const maxLines = Math.min(3, Math.floor(availableHeight / lineHeight));

                      return (
                        <div
                          key={`task-${task.id}`}
                          className={`absolute rounded-lg transition-all duration-200 cursor-pointer pointer-events-auto select-none shadow-sm group ${
                            isBeingDragged 
                              ? 'opacity-80 shadow-lg z-50' 
                              : 'hover:shadow-md'
                          } ${isCompleted ? 'opacity-60' : ''}`}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                            left: '2px',
                            right: '2px',
                            backgroundColor: isCompleted ? '#f8f8f8' : statusColors.bgColor,
                            border: `1px solid ${isCompleted ? '#e5e5e5' : statusColors.borderColor}`,
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const relativeY = e.clientY - rect.top;
                            
                            if (relativeY <= 4 && onUpdateTask) {
                              handleTaskMouseDown(e, task, 'resize', 'top');
                            } else if (relativeY >= rect.height - 4 && onUpdateTask) {
                              handleTaskMouseDown(e, task, 'resize', 'bottom');
                            } else if (onUpdateTask) {
                              handleTaskMouseDown(e, task, 'move');
                            }
                          }}
                        >
                          {/* Zone de redimensionnement haut */}
                          <div className="absolute top-0 left-0 right-0 h-1 cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {/* Contenu aligné en haut */}
                          <div className="h-full px-2 py-1 flex items-start gap-1.5">
                            {/* Checkbox minimaliste style Notion */}
                            {onUpdateTask && (
                              <button
                                className={`flex-shrink-0 w-3.5 h-3.5 rounded border transition-all mt-0.5 ${
                                  isCompleted 
                                    ? 'bg-gray-400 border-gray-400' 
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                                }`}
                                onClick={(e) => handleTaskCompletion(task, e)}
                              >
                                {isCompleted && (
                                  <Check size={10} className="text-white m-auto" />
                                )}
                              </button>
                            )}
                            
                            {/* Contenu */}
                            <div className="flex-1 min-w-0 flex flex-col justify-start">
                              <div 
                                className={`text-xs font-medium leading-tight ${
                                  isCompleted 
                                    ? 'text-gray-500 line-through' 
                                    : statusColors.text
                                }`}
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: maxLines,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {task.title}
                              </div>
                              {position.height > 35 && (
                                <div className={`text-xs leading-tight mt-0.5 opacity-75 flex-shrink-0 ${
                                  isCompleted ? 'text-gray-400' : statusColors.text
                                }`}>
                                  {task.scheduledStart && format(new Date(task.scheduledStart), 'HH:mm')}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Zone de redimensionnement bas */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {getMonthDays().map((day, index) => {
              const isToday = isSameDayNormalized(day, new Date());
              const dayTasks = getTasksForDay(day);
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={index}
                  className={`bg-white p-2 min-h-[120px] ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {/* Événements avec style Google Calendar */}
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={`month-event-${event.id}`}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate font-medium border-l-2"
                        onClick={() => handleEventClick(event)}
                        style={{
                          backgroundColor: '#e3f2fd',
                          borderLeftColor: '#1976d2',
                          color: '#1976d2'
                        }}
                        title={`${event.title}\n${event.allDay ? 'Toute la journée' : format(new Date(event.startDate), 'HH:mm') + ' - ' + format(new Date(event.endDate), 'HH:mm')}\n${event.location || ''}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    
                    {/* Tâches avec couleurs contextuelles corrigées */}
                    {dayTasks.slice(0, dayEvents.length > 0 ? 1 : 3).map(task => {
                      const isCompleted = task.completed;
                      const taskStatus = getTaskStatus(task);
                      const statusColors = getTaskStatusColors(taskStatus);
                      
                      return (
                        <div
                          key={`month-task-${task.id}`}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate flex items-center gap-1 border-l-2 ${
                            isCompleted ? 'opacity-60' : ''
                          }`}
                          onClick={() => handleTaskClick(task)}
                          style={{
                            backgroundColor: isCompleted ? '#f5f5f5' : statusColors.bgColor,
                            borderLeftColor: isCompleted ? '#9e9e9e' : statusColors.borderColor,
                            color: isCompleted ? '#757575' : statusColors.text.replace('text-', '')
                          }}
                          title={`${task.title}\n${task.estimatedDuration}min\n${task.description || ''}`}
                        >
                          {onUpdateTask && (
                            <button
                              onClick={(e) => handleTaskCompletion(task, e)}
                              className={`w-2.5 h-2.5 rounded-sm border flex-shrink-0 ${
                                isCompleted 
                                  ? 'bg-gray-500 border-gray-500' 
                                  : 'bg-white'
                              }`}
                              style={{
                                borderColor: isCompleted ? '#6b7280' : statusColors.borderColor
                              }}
                              title={task.completed ? "Marquer comme non terminé" : "Marquer comme terminé"}
                            >
                              {isCompleted && <Check size={6} className="text-white m-auto" />}
                            </button>
                          )}
                          <span className={`truncate flex-1 ${isCompleted ? 'line-through' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Indicateur d'overflow */}
                    {(dayEvents.length + dayTasks.length) > 3 && (
                      <div className="text-xs text-gray-500">
                        +{(dayEvents.length + dayTasks.length) - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Planification algorithmique intelligente</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded-lg border" style={{ backgroundColor: '#f0f9ff', borderColor: '#e0f2fe' }} />
              <span className="text-sm text-gray-600">Événements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded-lg border" style={{ backgroundColor: '#fef7ed', borderColor: '#fed7aa' }} />
              <span className="text-sm text-gray-600">Tâches</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded-lg border" style={{ backgroundColor: '#f8f8f8', borderColor: '#e5e5e5' }} />
              <span className="text-sm text-gray-600">Tâches terminées</span>
            </div>
          </div>
          
          {onUpdateTask && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Algorithme de planification :</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Planification automatique basée sur les priorités et les deadlines</div>
                <div>• Respect des heures de travail et des événements existants</div>
                <div>• Optimisation des créneaux pour minimiser les conflits</div>
                <div>• Replanification intelligente après modification d'événements</div>
                <div>• Gestion des buffers entre les tâches pour éviter la fatigue</div>
                {unscheduledTasksCount > 0 && (
                  <div className="text-orange-600 font-medium">
                    • {unscheduledTasksCount} tâche(s) en attente de planification automatique
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {(onUpdateTask || onUpdateEvent || addTask || addEvent) && (
        <AddItemForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmitTask={handleFormSubmit}
          onSubmitEvent={handleEventFormSubmit}
          editingTask={selectedTask}
          editingEvent={selectedEvent}
          projects={projects}
        />
      )}
    </div>
  );
}
