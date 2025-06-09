import React, { useState, useEffect, useRef } from 'react';
import { Task, Event, Project } from '../types/task';
import { format, startOfWeek, addDays, isSameDay, startOfDay, addHours, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, CalendarDays, Users, Edit, Check, Square, RefreshCw, AlertTriangle } from 'lucide-react';
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

// Limite de sécurité pour éviter le blocage de l'interface
const MAX_ITEMS_TO_RENDER = 100;

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
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showOverloadWarning, setShowOverloadWarning] = useState(false);
  
  // Protection contre la surcharge de données
  const isTooManyItems = tasks.length > 1000 || events.length > 500;
  const safeTasks = isTooManyItems ? tasks.slice(0, MAX_ITEMS_TO_RENDER) : tasks;
  const safeEvents = isTooManyItems ? events.slice(0, MAX_ITEMS_TO_RENDER) : events;
  
  // Hook pour la planification algorithmique
  const { isScheduling, rescheduleAllTasks } = useAlgorithmicScheduler();
  
  // Gestion des clics simplifiée
  const clickTimerRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);
  
  // Heures de travail (8h-18h pour éviter la surcharge)
  const workingHours = Array.from({ length: 11 }, (_, i) => i + 8);

  console.log('CalendarView render (protection activée):', { 
    originalTasks: tasks.length,
    originalEvents: events.length,
    safeTasks: safeTasks.length, 
    safeEvents: safeEvents.length,
    isTooManyItems,
    hasUpdateTask: !!onUpdateTask,
    hasUpdateEvent: !!onUpdateEvent
  });

  // Afficher l'avertissement si trop de données
  useEffect(() => {
    if (isTooManyItems && !showOverloadWarning) {
      setShowOverloadWarning(true);
      console.warn('⚠️ Trop de données détectées, limitation du rendu pour maintenir les performances');
    }
  }, [isTooManyItems, showOverloadWarning]);

  // Nettoyer le localStorage si surchargé
  useEffect(() => {
    if (tasks.length > 10000) {
      console.warn('🧹 Nettoyage du localStorage nécessaire - trop de tâches stockées');
      try {
        localStorage.removeItem('flowsavvy_tasks');
        localStorage.removeItem('flowsavvy_events');
        window.location.reload();
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
      }
    }
  }, [tasks.length]);

  // Utiliser le hook unifié de drag & drop avec protection
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
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    } else if (dragStartedRef.current) {
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
    const dayTasks = safeTasks.filter(task => 
      task.scheduledStart && isSameDayNormalized(task.scheduledStart, date)
    );
    return dayTasks;
  };

  const getEventsForDay = (date: Date) => {
    const dayEvents = safeEvents.filter(event => {
      const eventStart = normalizeDate(event.startDate);
      const eventEnd = normalizeDate(event.endDate);
      
      const isEventStartSameDay = isSameDay(eventStart, date);
      const isEventEndSameDay = isSameDay(eventEnd, date);
      
      const targetTime = date.getTime();
      const eventStartTime = startOfDay(eventStart).getTime();
      const eventEndTime = startOfDay(eventEnd).getTime();
      const isInRange = targetTime >= eventStartTime && targetTime <= eventEndTime;
      
      return isEventStartSameDay || isEventEndSameDay || isInRange;
    });
    
    return dayEvents;
  };

  const getTaskPosition = (task: Task) => {
    if (!task.scheduledStart) return null;
    
    const start = normalizeDate(task.scheduledStart);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    // Ajuster pour les heures de travail seulement
    const adjustedHour = Math.max(8, Math.min(18, startHour));
    const adjustedTop = (adjustedHour - 8 + startMinute / 60) * 64;
    const height = Math.max((task.estimatedDuration || 60) / 60 * 64, 28);
    
    return { top: Math.max(0, adjustedTop), height };
  };

  const getEventPosition = (event: Event) => {
    if (event.allDay) return null;
    
    const start = normalizeDate(event.startDate);
    const end = normalizeDate(event.endDate);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    // Ajuster pour les heures de travail seulement
    const adjustedHour = Math.max(8, Math.min(18, startHour));
    const top = (adjustedHour - 8 + startMinute / 60) * 64;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    const height = Math.max((duration / 60) * 64, 28);
    
    return { top: Math.max(0, top), height };
  };

  // Fonction pour déterminer le style du curseur selon la position
  const getCursorStyle = (e: React.MouseEvent, elementHeight: number): string => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    if (relativeY <= 4) {
      return 'n-resize';
    } else if (relativeY >= elementHeight - 4) {
      return 's-resize';
    }
    return 'grab';
  };

  // Gestionnaire simplifié pour la replanification
  const handleReschedule = async () => {
    if (!onUpdateTask || tasks.length > 1000) {
      console.log('🚫 Replanification désactivée : trop de tâches ou fonction manquante');
      return;
    }

    console.log('🔄 Démarrage de la replanification...');
    
    try {
      const rescheduledTasks = await rescheduleAllTasks(safeTasks, safeEvents);
      
      let updatedCount = 0;
      rescheduledTasks.forEach(rescheduledTask => {
        const originalTask = tasks.find(t => t.id === rescheduledTask.id);
        if (originalTask) {
          const hasScheduleChanged = 
            originalTask.scheduledStart !== rescheduledTask.scheduledStart ||
            originalTask.scheduledEnd !== rescheduledTask.scheduledEnd;
          
          if (hasScheduleChanged) {
            onUpdateTask(rescheduledTask.id, {
              scheduledStart: rescheduledTask.scheduledStart,
              scheduledEnd: rescheduledTask.scheduledEnd
            });
            updatedCount++;
          }
        }
      });
      
      console.log(`✅ Replanification terminée ! ${updatedCount} tâche(s) mise(s) à jour.`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la replanification:', error);
    }
  };

  // Gestionnaires de clic simplifiés
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSelectedEvent(undefined);
    setShowForm(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSelectedTask(undefined);
    setShowForm(true);
  };

  const handleTaskCompletion = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onUpdateTask) {
      onUpdateTask(task.id, { completed: !task.completed });
    }
  };

  const handleFormSubmit = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTask && onUpdateTask) {
      onUpdateTask(selectedTask.id, taskData);
    } else if (addTask) {
      addTask(taskData);
    }
    setSelectedTask(undefined);
    setShowForm(false);
  };

  const handleEventFormSubmit = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEvent && onUpdateEvent) {
      const normalizedData = {
        ...eventData,
        startDate: normalizeDate(eventData.startDate),
        endDate: normalizeDate(eventData.endDate)
      };
      onUpdateEvent(selectedEvent.id, normalizedData);
    } else if (addEvent) {
      const normalizedData = {
        ...eventData,
        startDate: normalizeDate(eventData.startDate),
        endDate: normalizeDate(eventData.endDate)
      };
      addEvent(normalizedData);
    }
    setSelectedEvent(undefined);
    setShowForm(false);
  };

  const handleFormClose = () => {
    setShowForm(false);
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

  // Gestionnaires pour le drag & drop simplifiés
  const handleTaskMouseDown = (e: React.MouseEvent, task: Task, action: 'move' | 'resize', resizeHandle?: 'top' | 'bottom') => {
    if (e.button !== 0 || !onUpdateTask) return;
    
    const onTaskClick = action === 'move' ? () => handleTaskClick(task) : undefined;
    startTaskDrag(e, task, action, resizeHandle, onTaskClick);
  };

  const handleEventMouseDown = (e: React.MouseEvent, event: Event, action: 'move' | 'resize', resizeHandle?: 'top' | 'bottom') => {
    if (e.button !== 0 || !onUpdateEvent) return;
    
    const onEventClick = action === 'move' ? () => handleEventClick(event) : undefined;
    startEventDrag(e, event, action, resizeHandle, onEventClick);
  };

  // Calculer le nombre de tâches non programmées (avec limite)
  const unscheduledTasksCount = Math.min(
    safeTasks.filter(t => !t.completed && !t.scheduledStart).length,
    50
  );

  return (
    <div className="space-y-6 h-full">
      {/* Avertissement de surcharge */}
      {showOverloadWarning && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-600" size={20} />
            <div>
              <h3 className="font-medium text-orange-800">Trop de données détectées</h3>
              <p className="text-sm text-orange-700 mt-1">
                Pour maintenir les performances, seuls les {MAX_ITEMS_TO_RENDER} premiers éléments sont affichés.
                Vous avez {tasks.length} tâches et {events.length} événements au total.
              </p>
            </div>
          </div>
        </div>
      )}

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
          {/* Bouton de replanification avec protection */}
          {onUpdateTask && !isTooManyItems && (
            <Button
              onClick={handleReschedule}
              disabled={isScheduling || safeTasks.length === 0}
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

      {/* Debug info simplifié */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          📊 Affichage: {safeTasks.length}/{tasks.length} tâche{tasks.length > 1 ? 's' : ''}, {safeEvents.length}/{events.length} événement{events.length > 1 ? 's' : ''}
          {isTooManyItems && ' (Mode performance activé)'}
          {dragState.isDragging && ' - 🎯 DRAGGING'}
          {dragState.isResizing && ' - 📏 RESIZING'}
        </p>
      </div>

      {viewMode === 'week' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête des jours */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3 text-center text-xs font-medium text-gray-500 border-r border-gray-200 bg-gray-50/30">
              Heures
            </div>
            {getWeekDays().map((day, index) => {
              const isToday = isSameDayNormalized(day, new Date());
              
              return (
                <div
                  key={index}
                  className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
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

          {/* Grille horaire optimisée */}
          <div className="h-[600px] overflow-y-auto">
            <div className="grid grid-cols-8">
              {/* Colonne des heures */}
              <div className="bg-gray-50/30 border-r border-gray-200">
                {workingHours.map(hour => (
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
                  className="relative border-r border-gray-200 last:border-r-0 bg-white hover:bg-gray-50/30 transition-colors"
                >
                  {/* Lignes horaires */}
                  {workingHours.map(hour => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    />
                  ))}

                  {/* Événements avec curseurs améliorés */}
                  <div className="absolute inset-0 p-1 pointer-events-none">
                    {getEventsForDay(day)
                      .filter(event => !event.allDay)
                      .slice(0, 10)
                      .map(event => {
                        const position = getEventPosition(event);
                        if (!position) return null;

                        const isBeingDragged = dragState.itemId === event.id && dragState.itemType === 'event';

                        return (
                          <div
                            key={`event-${event.id}`}
                            className={`absolute rounded-lg transition-all duration-150 cursor-grab select-none shadow-sm pointer-events-auto group ${
                              isBeingDragged 
                                ? 'opacity-80 shadow-lg z-50 cursor-grabbing' 
                                : 'hover:shadow-md z-20 hover:scale-[1.02]'
                            }`}
                            style={{
                              top: `${position.top}px`,
                              height: `${position.height}px`,
                              left: '2px',
                              right: '2px',
                              backgroundColor: '#f0f9ff',
                              border: '1px solid #e0f2fe',
                            }}
                            onMouseMove={(e) => {
                              if (!isBeingDragged && onUpdateEvent) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const relativeY = e.clientY - rect.top;
                                
                                if (relativeY <= 4) {
                                  e.currentTarget.style.cursor = 'n-resize';
                                } else if (relativeY >= rect.height - 4) {
                                  e.currentTarget.style.cursor = 's-resize';
                                } else {
                                  e.currentTarget.style.cursor = 'grab';
                                }
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isBeingDragged) {
                                e.currentTarget.style.cursor = 'grab';
                              }
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
                            onClick={() => {
                              if (!dragStartedRef.current) {
                                handleEventClick(event);
                              }
                            }}
                          >
                            {/* Zones de redimensionnement visuelles */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-blue-300 opacity-0 group-hover:opacity-50 transition-opacity cursor-n-resize"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-blue-300 opacity-0 group-hover:opacity-50 transition-opacity cursor-s-resize"></div>
                            
                            <div className="h-full px-2 py-1 flex flex-col justify-start">
                              <div className="text-xs font-medium text-sky-800 leading-tight truncate">
                                {event.title}
                              </div>
                              {position.height > 35 && (
                                <div className="text-xs text-sky-600 leading-tight mt-0.5 opacity-75">
                                  {format(new Date(event.startDate), 'HH:mm')}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Tâches avec curseurs améliorés */}
                  <div className="absolute inset-0 p-1 pointer-events-none">
                    {getTasksForDay(day)
                      .slice(0, 10)
                      .map(task => {
                        const position = getTaskPosition(task);
                        if (!position) return null;

                        const isBeingDragged = dragState.itemId === task.id && dragState.itemType === 'task';
                        const isCompleted = task.completed;
                        const taskStatus = getTaskStatus(task);
                        const statusColors = getTaskStatusColors(taskStatus);

                        return (
                          <div
                            key={`task-${task.id}`}
                            className={`absolute rounded-lg transition-all duration-150 cursor-grab select-none shadow-sm pointer-events-auto group ${
                              isBeingDragged 
                                ? 'opacity-80 shadow-lg z-50 cursor-grabbing' 
                                : 'hover:shadow-md z-20 hover:scale-[1.02]'
                            } ${isCompleted ? 'opacity-60' : ''}`}
                            style={{
                              top: `${position.top}px`,
                              height: `${position.height}px`,
                              left: '2px',
                              right: '2px',
                              backgroundColor: isCompleted ? '#f8f8f8' : statusColors.bgColor,
                              border: `1px solid ${isCompleted ? '#e5e5e5' : statusColors.borderColor}`,
                            }}
                            onMouseMove={(e) => {
                              if (!isBeingDragged && onUpdateTask) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const relativeY = e.clientY - rect.top;
                                
                                if (relativeY <= 4) {
                                  e.currentTarget.style.cursor = 'n-resize';
                                } else if (relativeY >= rect.height - 4) {
                                  e.currentTarget.style.cursor = 's-resize';
                                } else {
                                  e.currentTarget.style.cursor = 'grab';
                                }
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isBeingDragged) {
                                e.currentTarget.style.cursor = 'grab';
                              }
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
                            onClick={() => {
                              if (!dragStartedRef.current) {
                                handleTaskClick(task);
                              }
                            }}
                          >
                            {/* Zones de redimensionnement visuelles */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-orange-300 opacity-0 group-hover:opacity-50 transition-opacity cursor-n-resize"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-orange-300 opacity-0 group-hover:opacity-50 transition-opacity cursor-s-resize"></div>
                            
                            <div className="h-full px-2 py-1 flex items-start gap-1.5">
                              {onUpdateTask && (
                                <button
                                  className={`flex-shrink-0 w-3.5 h-3.5 rounded border transition-all mt-0.5 z-10 ${
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
                              
                              <div className="flex-1 min-w-0 flex flex-col justify-start">
                                <div className={`text-xs font-medium leading-tight truncate ${
                                  isCompleted 
                                    ? 'text-gray-500 line-through' 
                                    : statusColors.text
                                }`}>
                                  {task.title}
                                </div>
                                {position.height > 35 && (
                                  <div className={`text-xs leading-tight mt-0.5 opacity-75 ${
                                    isCompleted ? 'text-gray-400' : statusColors.text
                                  }`}>
                                    {task.scheduledStart && format(new Date(task.scheduledStart), 'HH:mm')}
                                  </div>
                                )}
                              </div>
                            </div>
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
        // Vue mois simplifiée
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
              const dayTasks = getTasksForDay(day).slice(0, 3); // Limite affichage
              const dayEvents = getEventsForDay(day).slice(0, 2); // Limite affichage
              
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
                    {/* Événements */}
                    {dayEvents.map(event => (
                      <div
                        key={`month-event-${event.id}`}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate font-medium border-l-2"
                        onClick={() => handleEventClick(event)}
                        style={{
                          backgroundColor: '#e3f2fd',
                          borderLeftColor: '#1976d2',
                          color: '#1976d2'
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    
                    {/* Tâches */}
                    {dayTasks.map(task => {
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
                          }}
                          title={task.title}
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
                    {(getEventsForDay(day).length + getTasksForDay(day).length) > 5 && (
                      <div className="text-xs text-gray-500">
                        +{(getEventsForDay(day).length + getTasksForDay(day).length) - 5} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (onUpdateTask || onUpdateEvent || addTask || addEvent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AddItemForm
            onSubmitTask={handleFormSubmit}
            onSubmitEvent={handleEventFormSubmit}
            onCancel={handleFormClose}
            editingTask={selectedTask}
            editingEvent={selectedEvent}
            projects={projects}
          />
        </div>
      )}
    </div>
  );
}
