import React, { useState, useEffect } from 'react';
import { Task, Event } from '../types/task';
import { format, startOfWeek, addDays, isSameDay, startOfDay, addHours, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, CalendarDays, Users, GripVertical, ArrowUpDown } from 'lucide-react';
import { getTaskStatus, getTaskStatusColors } from '../utils/taskStatus';
import { AddItemForm } from './AddItemForm';
import { useTaskDragAndDrop } from '../hooks/useTaskDragAndDrop';

interface CalendarViewProps {
  tasks: Task[];
  events: Event[];
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
}

type ViewMode = 'week' | 'month';

export function CalendarView({ tasks, events, onUpdateTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [hasAddedTestTask, setHasAddedTestTask] = useState(false);
  
  const workingHours = Array.from({ length: 10 }, (_, i) => 9 + i); // 9h à 18h

  console.log('CalendarView: Events received:', events);
  console.log('CalendarView: onUpdateTask function provided:', !!onUpdateTask);
  console.log('CalendarView: Tasks with scheduled times:', tasks.filter(t => t.scheduledStart).length);

  // Ajouter une tâche de test automatiquement si aucune tâche programmée et onUpdateTask disponible
  useEffect(() => {
    if (onUpdateTask && tasks.length === 0 && !hasAddedTestTask) {
      console.log('Adding test task for drag & drop testing');
      const testTask: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'> = {
        title: 'Tâche test drag & drop',
        description: 'Tâche pour tester le glisser-déposer',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // demain
        priority: 'medium',
        estimatedDuration: 60, // 1 heure
        scheduledStart: new Date(Date.now() + 60 * 60 * 1000), // dans 1 heure
        scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000), // dans 2 heures
      };
      
      // Simuler l'ajout d'une tâche via onUpdateTask (mais en fait on utilise un hack)
      const newTask: Task = {
        ...testTask,
        id: 'test-task-1',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Test task created:', newTask);
      setHasAddedTestTask(true);
    }
  }, [tasks, onUpdateTask, hasAddedTestTask]);

  // Créer une liste de tâches avec la tâche de test si nécessaire
  const tasksWithTest = React.useMemo(() => {
    if (onUpdateTask && tasks.length === 0 && hasAddedTestTask) {
      const testTask: Task = {
        id: 'test-task-1',
        title: 'Tâche test drag & drop',
        description: 'Tâche pour tester le glisser-déposer',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: 'medium',
        estimatedDuration: 60,
        scheduledStart: new Date(Date.now() + 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return [testTask];
    }
    return tasks;
  }, [tasks, onUpdateTask, hasAddedTestTask]);

  // Utiliser le hook de drag & drop seulement si onUpdateTask est fourni
  const { dragState, startDrag } = useTaskDragAndDrop(
    onUpdateTask || (() => {
      console.log('No update function provided, drag & drop disabled');
    })
  );

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
    return tasksWithTest.filter(task => 
      task.scheduledStart && isSameDay(new Date(task.scheduledStart), date)
    );
  };

  const getEventsForDay = (date: Date) => {
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return isSameDay(eventStart, date) || isSameDay(eventEnd, date) || 
             (eventStart <= date && eventEnd >= date);
    });
    console.log(`Events for ${format(date, 'yyyy-MM-dd')}:`, dayEvents);
    return dayEvents;
  };

  const getTaskPosition = (task: Task) => {
    if (!task.scheduledStart) return null;
    
    const start = new Date(task.scheduledStart);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    const adjustedTop = ((startHour - 9) + startMinute / 60) * 64;
    const height = Math.max((task.estimatedDuration / 60) * 64, 32);
    
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
    
    console.log('Event position calculated:', { event: event.title, top, height, start, end });
    
    return { top: Math.max(0, top), height };
  };

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    if (dragState.isDragging || dragState.isResizing) {
      console.log('Task click ignored during drag operation');
      return;
    }
    
    console.log('Task clicked:', task.title);
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTask && onUpdateTask) {
      onUpdateTask(selectedTask.id, taskData);
    }
    setSelectedTask(undefined);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTask(undefined);
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

  // Gestionnaires pour le drag & drop
  const handleTaskMouseDown = (e: React.MouseEvent, task: Task, action: 'move' | 'resize', resizeHandle?: 'top' | 'bottom') => {
    console.log('Task mouse down:', { 
      action, 
      taskTitle: task.title, 
      hasUpdateFunction: !!onUpdateTask,
      mouseButton: e.button,
      taskId: task.id,
      position: { x: e.clientX, y: e.clientY }
    });
    
    // Seulement le bouton gauche de la souris
    if (e.button !== 0) return;
    
    if (!onUpdateTask) {
      console.log('Cannot start drag: no update function provided');
      return;
    }
    
    // Empêcher la propagation pour éviter que le clic déclenche d'autres événements
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Calling startDrag...');
    startDrag(e, task, action, resizeHandle);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
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
          {/* Switch vue semaine/mois */}
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

      {/* Messages d'état */}
      {!onUpdateTask && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            📖 Mode lecture seule - Aucune modification possible
          </p>
        </div>
      )}

      {/* Info sur la tâche de test */}
      {onUpdateTask && hasAddedTestTask && tasksWithTest.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            ✅ Tâche de test ajoutée ! Glissez-la horizontalement pour la déplacer vers un autre jour.
          </p>
        </div>
      )}

      {/* Calendrier */}
      {viewMode === 'week' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
            <div className="p-4 text-center text-sm font-medium text-gray-600">
              Heures
            </div>
            {getWeekDays().map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const dayTasks = getTasksForDay(day);
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={index}
                  className={`p-4 text-center border-l border-gray-200 ${
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
              <div className="bg-gray-50">
                {workingHours.map(hour => (
                  <div key={hour} className="h-16 border-b border-gray-200 flex items-center justify-center">
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
                  className="relative border-l border-gray-200 overflow-hidden"
                  style={{ minWidth: '150px' }} // Largeur fixe pour éviter les débordements
                >
                  {/* Lignes horaires */}
                  {workingHours.map(hour => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100"
                    />
                  ))}

                  {/* Événements */}
                  <div className="absolute inset-0 p-1">
                    {getEventsForDay(day)
                      .filter(event => !event.allDay)
                      .map(event => {
                        const position = getEventPosition(event);
                        if (!position) return null;

                        return (
                          <div
                            key={`event-${event.id}`}
                            className="absolute rounded-lg border p-1 cursor-pointer hover:shadow-lg transition-all z-30 bg-purple-100 border-purple-300 hover:bg-purple-200 overflow-hidden"
                            style={{
                              top: `${position.top}px`,
                              height: `${position.height}px`,
                              left: '2px',
                              right: '2px',
                            }}
                            title={`${event.title}\n${format(new Date(event.startDate), 'HH:mm')} - ${format(new Date(event.endDate), 'HH:mm')}\n${event.location || ''}`}
                          >
                            <div className="flex items-center gap-1 text-xs font-bold text-purple-900 mb-1">
                              <Users size={10} />
                              <span className="truncate">{event.title}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Tâches avec drag & drop */}
                  <div className="absolute inset-0 p-1">
                    {getTasksForDay(day).map(task => {
                      const position = getTaskPosition(task);
                      if (!position) return null;

                      const taskStatus = getTaskStatus(task);
                      const statusColors = getTaskStatusColors(taskStatus);
                      const isBeingDragged = dragState.taskId === task.id;

                      return (
                        <div
                          key={`task-${task.id}`}
                          className={`absolute rounded-lg border transition-all z-20 group select-none overflow-hidden ${
                            statusColors.bg
                          } ${statusColors.border} ${
                            isBeingDragged ? 'opacity-80 shadow-lg scale-105 ring-2 ring-blue-400 z-50' : 'hover:shadow-md hover:scale-105'
                          }`}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                            left: '2px',
                            right: '2px',
                            pointerEvents: isBeingDragged ? 'none' : 'auto',
                          }}
                          onClick={(e) => !isBeingDragged && handleTaskClick(task, e)}
                          title={`${task.title}\nDurée: ${task.estimatedDuration}min\n${task.description || ''}\n${onUpdateTask ? 'Glisser pour déplacer, redimensionner par les bords' : 'Mode lecture seule'}`}
                        >
                          {/* Handle de redimensionnement haut */}
                          {onUpdateTask && position.height > 40 && (
                            <div
                              className="absolute top-0 left-0 right-0 h-3 cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gray-300 hover:bg-gray-400 rounded-t-lg z-50"
                              onMouseDown={(e) => handleTaskMouseDown(e, task, 'resize', 'top')}
                            >
                              <div className="w-8 h-1 bg-gray-600 rounded"></div>
                            </div>
                          )}

                          {/* Contenu de la tâche avec handle de déplacement */}
                          <div
                            className={`p-2 h-full flex flex-col justify-between ${onUpdateTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                            onMouseDown={onUpdateTask ? (e) => handleTaskMouseDown(e, task, 'move') : undefined}
                          >
                            <div className="flex items-start gap-1">
                              {onUpdateTask && (
                                <GripVertical 
                                  size={12} 
                                  className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" 
                                />
                              )}
                              <div className="text-xs font-medium line-clamp-2 text-gray-900 flex-1 overflow-hidden">
                                {task.title}
                              </div>
                            </div>
                            {position.height > 40 && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                <Clock size={10} />
                                <span className="truncate">
                                  {task.scheduledStart && format(new Date(task.scheduledStart), 'HH:mm')}
                                  {' '}({task.estimatedDuration}min)
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Handle de redimensionnement bas */}
                          {onUpdateTask && position.height > 40 && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gray-300 hover:bg-gray-400 rounded-b-lg z-50"
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
        // Vue mois
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
                    {/* Événements */}
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={`month-event-${event.id}`}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 bg-purple-100 text-purple-800 truncate font-medium"
                        title={`${event.title}\n${event.allDay ? 'Toute la journée' : format(new Date(event.startDate), 'HH:mm') + ' - ' + format(new Date(event.endDate), 'HH:mm')}\n${event.location || ''}`}
                      >
                        {event.allDay ? '🗓️' : '📅'} {event.title}
                      </div>
                    ))}
                    
                    {/* Tâches */}
                    {dayTasks.slice(0, dayEvents.length > 0 ? 1 : 3).map(task => {
                      const taskStatus = getTaskStatus(task);
                      const statusColors = getTaskStatusColors(taskStatus);
                      
                      return (
                        <div
                          key={`month-task-${task.id}`}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${statusColors.bg} ${statusColors.text} truncate`}
                          onClick={(e) => handleTaskClick(task, e)}
                          title={`${task.title}\n${task.estimatedDuration}min\n${task.description || ''}`}
                        >
                          ✓ {task.title}
                        </div>
                      );
                    })}
                    
                    {/* Compteur d'éléments cachés */}
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

      {/* Légende mise à jour */}
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
          
          {onUpdateTask && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Interactions avec les tâches :</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <GripVertical size={12} className="text-gray-400" />
                  <span>Glisser pour déplacer la tâche (verticalement pour l'heure, horizontalement pour le jour)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={12} className="text-gray-400" />
                  <span>Glisser les bords gris haut/bas pour ajuster la durée</span>
                </div>
                <div>• Cliquer pour éditer les détails de la tâche</div>
                <div>• Déplacement libre entre les jours - pas de contrainte horaire</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire de modification */}
      {onUpdateTask && (
        <AddItemForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmitTask={handleFormSubmit}
          onSubmitEvent={() => {}} // Pas utilisé dans CalendarView
          editingTask={selectedTask}
        />
      )}
    </div>
  );
}
