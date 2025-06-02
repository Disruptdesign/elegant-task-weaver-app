import React, { useState, useEffect, useRef } from 'react';
import { Task, Event } from '../types/task';
import { format, startOfWeek, addDays, isSameDay, startOfDay, addHours, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, CalendarDays, Users, Edit, Check, Square } from 'lucide-react';
import { getTaskStatus, getTaskStatusColors } from '../utils/taskStatus';
import { AddItemForm } from './AddItemForm';
import { useCalendarDragAndDrop } from '../hooks/useCalendarDragAndDrop';

interface CalendarViewProps {
  tasks: Task[];
  events: Event[];
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onUpdateEvent?: (id: string, updates: Partial<Event>) => void;
  addTask?: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  addEvent?: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

type ViewMode = 'week' | 'month';

export function CalendarView({ 
  tasks, 
  events, 
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
  
  // Gestion des clics avec délai pour éviter l'ouverture pendant le drag
  const clickTimerRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);
  
  const workingHours = Array.from({ length: 10 }, (_, i) => 9 + i);

  console.log('CalendarView render:', { 
    tasksCount: tasks.length, 
    eventsCount: events.length,
    hasUpdateTask: !!onUpdateTask,
    hasUpdateEvent: !!onUpdateEvent
  });

  // Debug des événements reçus
  useEffect(() => {
    console.log('🎭 CalendarView: Événements reçus:', events.map(e => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      startDateType: typeof e.startDate,
      startDateString: e.startDate instanceof Date ? e.startDate.toISOString() : String(e.startDate)
    })));
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
      task.scheduledStart && isSameDay(new Date(task.scheduledStart), date)
    );
    console.log(`Tasks for ${format(date, 'yyyy-MM-dd')}:`, dayTasks.length);
    return dayTasks;
  };

  const getEventsForDay = (date: Date) => {
    console.log(`🔍 Filtrage événements pour ${format(date, 'yyyy-MM-dd')}:`);
    
    const dayEvents = events.filter(event => {
      // S'assurer que les dates sont bien des objets Date
      const eventStart = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
      const eventEnd = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
      
      // Normaliser les dates pour la comparaison (début de journée)
      const targetDayStart = startOfDay(date);
      const eventDayStart = startOfDay(eventStart);
      const eventDayEnd = startOfDay(eventEnd);
      
      console.log(`   - Événement "${event.title}":`, {
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        targetDate: date.toISOString(),
        targetDayStart: targetDayStart.toISOString(),
        eventDayStart: eventDayStart.toISOString(),
        eventDayEnd: eventDayEnd.toISOString(),
        isSameStart: eventDayStart.getTime() === targetDayStart.getTime(),
        isSameEnd: eventDayEnd.getTime() === targetDayStart.getTime(),
        isInRange: targetDayStart >= eventDayStart && targetDayStart <= eventDayEnd
      });
      
      // Un événement est affiché dans un jour si :
      // 1. Il commence ce jour-là
      // 2. Il finit ce jour-là  
      // 3. Il est en cours ce jour-là (pour les événements multi-jours)
      const matches = eventDayStart.getTime() === targetDayStart.getTime() || 
                     eventDayEnd.getTime() === targetDayStart.getTime() ||
                     (targetDayStart >= eventDayStart && targetDayStart <= eventDayEnd);
      
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
    
    const start = new Date(task.scheduledStart);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    const adjustedTop = ((startHour - 9) + startMinute / 60) * 64;
    const height = Math.max((task.estimatedDuration / 60) * 64, 28);
    
    console.log('Task position:', { 
      title: task.title, 
      startHour, 
      startMinute, 
      top: adjustedTop, 
      height 
    });
    
    return { top: Math.max(0, adjustedTop), height };
  };

  const getEventPosition = (event: Event) => {
    if (event.allDay) return null;
    
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    const top = ((startHour - 9) + startMinute / 60) * 64;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    const height = Math.max((duration / 60) * 64, 28);
    
    console.log('Event position:', { 
      title: event.title, 
      startHour, 
      startMinute, 
      top, 
      height 
    });
    
    return { top: Math.max(0, top), height };
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
    console.log('📝 Event form submitted:', eventData);
    if (selectedEvent && onUpdateEvent) {
      onUpdateEvent(selectedEvent.id, eventData);
    } else if (addEvent) {
      console.log('🎯 Ajout nouvel événement via CalendarView:', {
        title: eventData.title,
        startDate: eventData.startDate,
        endDate: eventData.endDate
      });
      addEvent(eventData);
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

      {/* Debug info amélioré */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          📊 Debug: {tasks.length} tâche{tasks.length > 1 ? 's' : ''}, {events.length} événement{events.length > 1 ? 's' : ''}
          {tasks.filter(t => t.scheduledStart).length > 0 && ` - ${tasks.filter(t => t.scheduledStart).length} tâche(s) programmée(s)`}
          {events.filter(e => !e.allDay).length > 0 && ` - ${events.filter(e => !e.allDay).length} événement(s) avec horaire`}
          {dragState.isDragging && ' - 🎯 DRAGGING'}
          {dragState.isResizing && ' - 📏 RESIZING'}
        </p>
        {events.length > 0 && (
          <div className="text-xs text-blue-600 mt-2">
            Événements détectés: {events.map(e => `"${e.title}" (${e.startDate instanceof Date ? e.startDate.toLocaleDateString() : 'date invalide'})`).join(', ')}
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
              const isToday = isSameDay(day, new Date());
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

          {/* Grille horaire - Style Notion */}
          <div className="relative">
            <div className="grid grid-cols-8">
              {/* Colonne des heures */}
              <div className="w-16 bg-gray-50/30 border-r border-gray-200">
                {workingHours.map(hour => (
                  <div key={hour} className="h-16 border-b border-gray-100 flex items-start justify-center pt-1">
                    <span className="text-xs font-medium text-gray-400">
                      {hour}:00
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
                  {workingHours.map(hour => (
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

                  {/* Tâches - Style Notion avec contenu aligné en haut */}
                  <div className="absolute inset-0 p-1 pointer-events-none">
                    {getTasksForDay(day).map(task => {
                      const position = getTaskPosition(task);
                      if (!position) {
                        console.log('No position calculated for task:', task.title);
                        return null;
                      }

                      const isBeingDragged = dragState.itemId === task.id && dragState.itemType === 'task';
                      const isCompleted = task.completed;
                      
                      // Calculer le nombre de lignes possible pour le titre
                      const lineHeight = 14; // hauteur d'une ligne en pixels
                      const padding = 8; // padding vertical total
                      const checkboxWidth = 20; // largeur du checkbox + gap
                      const timeHeight = position.height > 35 ? 14 : 0; // hauteur de l'heure si affichée
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
                            backgroundColor: isCompleted ? '#f8f8f8' : '#fef7ed',
                            border: isCompleted ? '1px solid #e5e5e5' : '1px solid #fed7aa',
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
                                    : 'bg-white border-amber-300 hover:border-amber-400'
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
                                    : 'text-amber-800'
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
                                  isCompleted ? 'text-gray-400' : 'text-amber-600'
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
              const isToday = isSameDay(day, new Date());
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
                    
                    {/* Tâches avec style Google Calendar */}
                    {dayTasks.slice(0, dayEvents.length > 0 ? 1 : 3).map(task => {
                      const isCompleted = task.completed;
                      
                      return (
                        <div
                          key={`month-task-${task.id}`}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate flex items-center gap-1 border-l-2 ${
                            isCompleted ? 'opacity-60' : ''
                          }`}
                          onClick={() => handleTaskClick(task)}
                          style={{
                            backgroundColor: isCompleted ? '#f5f5f5' : '#fff3e0',
                            borderLeftColor: isCompleted ? '#9e9e9e' : '#ff9800',
                            color: isCompleted ? '#757575' : '#f57c00'
                          }}
                          title={`${task.title}\n${task.estimatedDuration}min\n${task.description || ''}`}
                        >
                          {onUpdateTask && (
                            <button
                              onClick={(e) => handleTaskCompletion(task, e)}
                              className={`w-2.5 h-2.5 rounded-sm border flex-shrink-0 ${
                                isCompleted 
                                  ? 'bg-gray-500 border-gray-500' 
                                  : 'bg-white border-orange-400'
                              }`}
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
        <h3 className="text-sm font-medium text-gray-900 mb-4">Style Notion Calendar</h3>
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
          
          {(onUpdateTask || onUpdateEvent) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Design Notion Calendar :</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Cartes minimalistes avec bordures subtiles</div>
                <div>• Contenu aligné en haut avec titres sur plusieurs lignes</div>
                <div>• Checkbox circulaire pour les tâches</div>
                <div>• Animations fluides au survol et lors du drag</div>
                <div>• Palette de couleurs épurée et moderne</div>
                <div>• Typographie fine et élégante</div>
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
        />
      )}
    </div>
  );
}
