import React, { useState, useEffect } from 'react';
import { Task, Event } from '../types/task';
import { format, startOfWeek, addDays, isSameDay, startOfDay, addHours, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, CalendarDays, Users, GripVertical, ArrowUpDown, Edit, Check, Square } from 'lucide-react';
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
  
  const workingHours = Array.from({ length: 10 }, (_, i) => 9 + i);

  console.log('CalendarView render:', { 
    tasksCount: tasks.length, 
    eventsCount: events.length,
    hasUpdateTask: !!onUpdateTask,
    hasUpdateEvent: !!onUpdateEvent
  });

  // Utiliser le hook unifié de drag & drop
  const {
    dragState,
    startTaskDrag,
    startEventDrag,
  } = useCalendarDragAndDrop(
    onUpdateTask || (() => console.log('No task update function provided')),
    onUpdateEvent || (() => console.log('No event update function provided'))
  );

  // Suivre l'état du drag pour empêcher les clics indésirables
  useEffect(() => {
    setIsDragInProgress(dragState.isDragging || dragState.isResizing);
  }, [dragState.isDragging, dragState.isResizing]);

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
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return isSameDay(eventStart, date) || isSameDay(eventEnd, date) || 
             (eventStart <= date && eventEnd >= date);
    });
    console.log(`Events for ${format(date, 'yyyy-MM-dd')}:`, dayEvents.length);
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
    const height = Math.max((task.estimatedDuration / 60) * 64, 32);
    
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
    const height = Math.max((duration / 60) * 64, 32);
    
    console.log('Event position:', { 
      title: event.title, 
      startHour, 
      startMinute, 
      top, 
      height 
    });
    
    return { top: Math.max(0, top), height };
  };

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    // Empêcher l'ouverture seulement si on vient de terminer une opération de drag
    if (dragState.isDragging || dragState.isResizing) {
      console.log('Task click ignored: drag operation in progress');
      return;
    }
    
    console.log('Task clicked for editing:', task.title);
    setSelectedTask(task);
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    // Empêcher l'ouverture seulement si on vient de terminer une opération de drag
    if (dragState.isDragging || dragState.isResizing) {
      console.log('Event click ignored: drag operation in progress');
      return;
    }
    
    console.log('Event clicked for editing:', event.title);
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
    if (selectedTask && onUpdateTask) {
      onUpdateTask(selectedTask.id, taskData);
    }
    setSelectedTask(undefined);
  };

  const handleEventFormSubmit = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEvent && onUpdateEvent) {
      onUpdateEvent(selectedEvent.id, eventData);
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
    
    // Empêcher la propagation seulement pour les actions de drag
    e.preventDefault();
    e.stopPropagation();
    
    startTaskDrag(e, task, action, resizeHandle);
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
    
    // Empêcher la propagation seulement pour les actions de drag
    e.preventDefault();
    e.stopPropagation();
    
    startEventDrag(e, event, action, resizeHandle);
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

      {/* Debug info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          📊 Debug: {tasks.length} tâche{tasks.length > 1 ? 's' : ''}, {events.length} événement{events.length > 1 ? 's' : ''}
          {tasks.filter(t => t.scheduledStart).length > 0 && ` - ${tasks.filter(t => t.scheduledStart).length} tâche(s) programmée(s)`}
          {events.filter(e => !e.allDay).length > 0 && ` - ${events.filter(e => !e.allDay).length} événement(s) avec horaire`}
          {dragState.isDragging && ' - 🎯 DRAGGING'}
          {dragState.isResizing && ' - 📏 RESIZING'}
        </p>
      </div>

      {viewMode === 'week' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* En-tête des jours */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
            <div className="w-20 p-4 text-center text-sm font-medium text-gray-600 border-r border-gray-200">
              Heures
            </div>
            {getWeekDays().map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const dayTasks = getTasksForDay(day);
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={index}
                  className={`p-4 text-center border-r border-gray-200 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {dayEvents.length > 0 && (
                      <span className="text-purple-600">{dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}</span>
                    )}
                    {dayEvents.length > 0 && dayTasks.length > 0 && ' • '}
                    {dayTasks.length > 0 && (
                      <span>{dayTasks.length} tâche{dayTasks.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grille horaire */}
          <div className="relative">
            <div className="grid grid-cols-8">
              {/* Colonne des heures */}
              <div className="w-20 bg-gray-50 border-r border-gray-200">
                {workingHours.map(hour => (
                  <div key={hour} className="h-16 border-b border-gray-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {hour}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Colonnes des jours */}
              {getWeekDays().map((day, dayIndex) => (
                <div 
                  key={dayIndex} 
                  className="relative border-r border-gray-200"
                >
                  {/* Lignes horaires */}
                  {workingHours.map(hour => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100"
                    />
                  ))}

                  {/* Événements */}
                  <div className="absolute inset-0 p-1 pointer-events-none">
                    {getEventsForDay(day)
                      .filter(event => !event.allDay)
                      .map(event => {
                        const position = getEventPosition(event);
                        if (!position) return null;

                        const isBeingDragged = dragState.itemId === event.id && dragState.itemType === 'event';

                        return (
                          <div
                            key={`event-${event.id}`}
                            className={`absolute rounded-lg border transition-all z-30 group select-none bg-purple-100 border-purple-300 pointer-events-auto ${
                              isBeingDragged ? 'opacity-80 shadow-lg ring-2 ring-purple-400 z-50' : 'hover:bg-purple-200 hover:shadow-md'
                            }`}
                            style={{
                              top: `${position.top}px`,
                              height: `${position.height}px`,
                              left: '4px',
                              right: '4px',
                              minWidth: '0',
                              overflow: 'hidden',
                            }}
                            onClick={(e) => handleEventClick(event, e)}
                            title={`${event.title}\n${format(new Date(event.startDate), 'HH:mm')} - ${format(new Date(event.endDate), 'HH:mm')}\n${event.location || ''}`}
                          >
                            {onUpdateEvent && position.height > 40 && (
                              <div
                                className="absolute top-0 left-0 right-0 h-3 cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-purple-300 hover:bg-purple-400 rounded-t-lg z-50 pointer-events-auto"
                                onMouseDown={(e) => handleEventMouseDown(e, event, 'resize', 'top')}
                              >
                                <div className="w-8 h-1 bg-purple-600 rounded"></div>
                              </div>
                            )}

                            <div
                              className={`flex p-1 h-full overflow-hidden ${onUpdateTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                              onMouseDown={onUpdateEvent ? (e) => handleEventMouseDown(e, event, 'move') : undefined}
                            >
                              <div className="flex items-start gap-1 w-full min-w-0">
                                {onUpdateEvent && (
                                  <GripVertical 
                                    size={10} 
                                    className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" 
                                  />
                                )}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-1 text-xs font-bold text-purple-900">
                                    <Users size={8} className="flex-shrink-0" />
                                    <span className="truncate leading-tight">{event.title}</span>
                                  </div>
                                  {position.height > 40 && (
                                    <div className="text-xs text-purple-700 opacity-75 truncate mt-0.5">
                                      {format(new Date(event.startDate), 'HH:mm')} - {format(new Date(event.endDate), 'HH:mm')}
                                    </div>
                                  )}
                                </div>
                                {onUpdateEvent && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEventClick(event, e);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-purple-300 rounded z-50 flex-shrink-0"
                                    title="Modifier l'événement"
                                  >
                                    <Edit size={8} className="text-purple-700" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {onUpdateEvent && position.height > 40 && (
                              <div
                                className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-purple-300 hover:bg-purple-400 rounded-b-lg z-50 pointer-events-auto"
                                onMouseDown={(e) => handleEventMouseDown(e, event, 'resize', 'bottom')}
                              >
                                <div className="w-8 h-1 bg-purple-600 rounded"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Tâches */}
                  <div className="absolute inset-0 p-1 pointer-events-none">
                    {getTasksForDay(day).map(task => {
                      const position = getTaskPosition(task);
                      if (!position) {
                        console.log('No position calculated for task:', task.title);
                        return null;
                      }

                      const taskStatus = getTaskStatus(task);
                      const statusColors = getTaskStatusColors(taskStatus);
                      const isBeingDragged = dragState.itemId === task.id && dragState.itemType === 'task';

                      return (
                        <div
                          key={`task-${task.id}`}
                          className={`absolute rounded-lg border transition-all z-20 group select-none pointer-events-auto ${
                            statusColors.bg
                          } ${statusColors.border} ${
                            isBeingDragged ? 'opacity-80 shadow-lg ring-2 ring-blue-400 z-50' : 'hover:shadow-md'
                          } ${task.completed ? 'opacity-60' : ''}`}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                            left: '4px',
                            right: '4px',
                            minWidth: '0',
                            overflow: 'hidden',
                          }}
                          onClick={(e) => handleTaskClick(task, e)}
                          title={`${task.title}\nDurée: ${task.estimatedDuration}min\n${task.description || ''}`}
                        >
                          {onUpdateTask && position.height > 40 && (
                            <div
                              className="absolute top-0 left-0 right-0 h-3 cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gray-300 hover:bg-gray-400 rounded-t-lg z-50 pointer-events-auto"
                              onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize', 'top')}
                            >
                              <div className="w-8 h-1 bg-gray-600 rounded"></div>
                            </div>
                          )}

                          <div
                            className={`flex p-0.5 h-full overflow-hidden ${onUpdateTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                            onMouseDown={onUpdateTask ? (e) => handleTaskMouseDown(e, task, 'move') : undefined}
                          >
                            <div className="flex items-start gap-1 w-full min-w-0">
                              {onUpdateTask && (
                                <button
                                  onClick={(e) => handleTaskCompletion(task, e)}
                                  className="p-0.5 hover:bg-gray-300 rounded flex-shrink-0 bg-white bg-opacity-80 border border-gray-300 z-50"
                                  title={task.completed ? "Marquer comme non terminé" : "Marquer comme terminé"}
                                >
                                  {task.completed ? (
                                    <Check size={6} className="text-green-600" />
                                  ) : (
                                    <Square size={6} className="text-gray-500" />
                                  )}
                                </button>
                              )}
                              
                              {onUpdateTask && (
                                <GripVertical 
                                  size={6} 
                                  className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" 
                                />
                              )}
                              
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className={`text-xs font-medium text-gray-900 truncate leading-tight ${task.completed ? 'line-through' : ''}`}>
                                  {task.title}
                                </div>
                                {position.height > 40 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                                    <Clock size={6} className="flex-shrink-0" />
                                    <span className="truncate leading-tight">
                                      {task.scheduledStart && format(new Date(task.scheduledStart), 'HH:mm')}
                                      {' '}({task.estimatedDuration}min)
                                    </span>
                                  </div>
                                )}
                              </div>
                                
                              {onUpdateTask && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleTaskClick(task, e);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-300 rounded z-50 flex-shrink-0"
                                  title="Modifier la tâche"
                                >
                                  <Edit size={6} className="text-gray-700" />
                                </button>
                              )}
                            </div>
                          </div>

                          {onUpdateTask && position.height > 40 && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gray-300 hover:bg-gray-400 rounded-b-lg z-50 pointer-events-auto"
                              onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize', 'bottom')}
                            >
                              <div className="w-8 h-1 bg-gray-600 rounded"></div>
                            </div>
                          )}
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
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={`month-event-${event.id}`}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 bg-purple-100 text-purple-800 truncate font-medium flex items-center gap-1 group"
                        onClick={(e) => handleEventClick(event, e)}
                        title={`${event.title}\n${event.allDay ? 'Toute la journée' : format(new Date(event.startDate), 'HH:mm') + ' - ' + format(new Date(event.endDate), 'HH:mm')}\n${event.location || ''}`}
                      >
                        {event.allDay ? '🗓️' : '📅'} <span className="truncate flex-1">{event.title}</span>
                        {onUpdateEvent && (
                          <Edit size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    ))}
                    
                    {dayTasks.slice(0, dayEvents.length > 0 ? 1 : 3).map(task => {
                      const taskStatus = getTaskStatus(task);
                      const statusColors = getTaskStatusColors(taskStatus);
                      
                      return (
                        <div
                          key={`month-task-${task.id}`}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${statusColors.bg} ${statusColors.text} truncate flex items-center gap-1 group ${task.completed ? 'opacity-60' : ''}`}
                          onClick={(e) => handleTaskClick(task, e)}
                          title={`${task.title}\n${task.estimatedDuration}min\n${task.description || ''}`}
                        >
                          {onUpdateTask && (
                            <button
                              onClick={(e) => handleTaskCompletion(task, e)}
                              className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0 bg-white bg-opacity-70"
                              title={task.completed ? "Marquer comme non terminé" : "Marquer comme terminé"}
                            >
                              {task.completed ? (
                                <Check size={8} className="text-green-600" />
                              ) : (
                                <Square size={8} className="text-gray-500" />
                              )}
                            </button>
                          )}
                          <span className={`truncate flex-1 ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
                          {onUpdateTask && (
                            <Edit size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
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
        <h3 className="text-sm font-medium text-gray-900 mb-4">Légende et Instructions</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-purple-100 border-purple-300" />
              <span className="text-sm text-gray-600">Événements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-green-50 border-green-200" />
              <span className="text-sm text-gray-600">Tâches dans les temps</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-orange-50 border-orange-200" />
              <span className="text-sm text-gray-600">Échéance proche</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-red-50 border-red-200" />
              <span className="text-sm text-gray-600">En retard</span>
            </div>
          </div>
          
          {(onUpdateTask || onUpdateEvent) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Interactions disponibles :</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <GripVertical size={12} className="text-gray-400" />
                  <span>Glisser pour déplacer (verticalement pour l'heure, horizontalement pour le jour)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={12} className="text-gray-400" />
                  <span>Glisser les bords gris haut/bas pour ajuster la durée</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-green-600" />
                  <span>Checkbox pour marquer les tâches comme terminées</span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit size={12} className="text-gray-400" />
                  <span>Icône d'édition pour modifier les détails</span>
                </div>
                <div>• Déplacement libre entre les jours - pas de contrainte horaire</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {(onUpdateTask || onUpdateEvent) && (
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
