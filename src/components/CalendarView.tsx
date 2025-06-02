
import React, { useState } from 'react';
import { Task, Event } from '../types/task';
import { format, startOfWeek, addDays, isSameDay, startOfDay, addHours, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, CalendarDays, Users } from 'lucide-react';
import { getTaskStatus, getTaskStatusColors } from '../utils/taskStatus';
import { AddItemForm } from './AddItemForm';

interface CalendarViewProps {
  tasks: Task[];
  events?: Event[];
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
}

type ViewMode = 'week' | 'month';

export function CalendarView({ tasks, events = [], onUpdateTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  
  const workingHours = Array.from({ length: 10 }, (_, i) => 9 + i); // 9h à 18h

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
    return tasks.filter(task => 
      task.scheduledStart && isSameDay(new Date(task.scheduledStart), date)
    );
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return isSameDay(eventStart, date) || isSameDay(eventEnd, date) || 
             (eventStart <= date && eventEnd >= date);
    });
  };

  const getTaskPosition = (task: Task) => {
    if (!task.scheduledStart) return null;
    
    const start = new Date(task.scheduledStart);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    // Position sans buffer (le buffer est géré par le planificateur)
    const adjustedTop = ((startHour - 9) + startMinute / 60) * 64;
    
    // Hauteur uniquement de la tâche (sans buffers)
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
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // en minutes
    const height = Math.max((duration / 60) * 64, 32);
    
    return { top: Math.max(0, top), height };
  };

  const handleTaskClick = (task: Task) => {
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
                <div key={dayIndex} className="relative border-l border-gray-200">
                  {/* Lignes horaires */}
                  {workingHours.map(hour => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100"
                    />
                  ))}

                  {/* Événements - affichés avec z-index plus élevé */}
                  <div className="absolute inset-0 p-1">
                    {getEventsForDay(day)
                      .filter(event => !event.allDay)
                      .map(event => {
                        const position = getEventPosition(event);
                        if (!position) return null;

                        return (
                          <div
                            key={`event-${event.id}`}
                            className="absolute left-1 right-1 rounded-lg border p-2 cursor-pointer hover:shadow-md transition-all z-30 bg-purple-100 border-purple-300"
                            style={{
                              top: `${position.top}px`,
                              height: `${position.height}px`,
                            }}
                            title={`${event.title}\n${format(new Date(event.startDate), 'HH:mm')} - ${format(new Date(event.endDate), 'HH:mm')}`}
                          >
                            <div className="flex items-center gap-1 text-xs font-medium text-purple-800 mb-1">
                              <Users size={10} />
                              <span className="truncate">{event.title}</span>
                            </div>
                            {position.height > 40 && (
                              <div className="text-xs text-purple-600">
                                {format(new Date(event.startDate), 'HH:mm')} - {format(new Date(event.endDate), 'HH:mm')}
                              </div>
                            )}
                            {event.location && position.height > 60 && (
                              <div className="text-xs text-purple-500 truncate">
                                📍 {event.location}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Événements toute la journée */}
                  <div className="absolute top-0 left-1 right-1">
                    {getEventsForDay(day)
                      .filter(event => event.allDay)
                      .map((event, index) => (
                        <div
                          key={`allday-${event.id}`}
                          className="mb-1 p-1 bg-purple-200 text-purple-800 text-xs rounded border border-purple-300"
                          style={{ top: `${index * 20}px` }}
                        >
                          <span className="truncate block">🗓️ {event.title}</span>
                        </div>
                      ))}
                  </div>

                  {/* Tâches sans affichage des buffers */}
                  <div className="absolute inset-0 p-1">
                    {getTasksForDay(day).map(task => {
                      const position = getTaskPosition(task);
                      if (!position) return null;

                      const taskStatus = getTaskStatus(task);
                      const statusColors = getTaskStatusColors(taskStatus);

                      return (
                        <div
                          key={`task-${task.id}`}
                          className={`absolute left-1 right-1 rounded-lg border p-2 cursor-pointer hover:shadow-md transition-all z-20 ${
                            statusColors.bg
                          } ${statusColors.border} hover:scale-105`}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                          }}
                          onClick={() => handleTaskClick(task)}
                          title={`${task.title}\nDurée: ${task.estimatedDuration}min\n${task.description || ''}`}
                        >
                          <div className="text-xs font-medium line-clamp-2 text-gray-900 mb-1">
                            {task.title}
                          </div>
                          {position.height > 40 && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Clock size={10} />
                              <span>
                                {task.scheduledStart && format(new Date(task.scheduledStart), 'HH:mm')}
                                {' '}({task.estimatedDuration}min)
                              </span>
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
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 bg-purple-100 text-purple-800 truncate"
                        title={`${event.title}\n${event.allDay ? 'Toute la journée' : format(new Date(event.startDate), 'HH:mm') + ' - ' + format(new Date(event.endDate), 'HH:mm')}`}
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
                          onClick={() => handleTaskClick(task)}
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

      {/* Légende */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Légende</h3>
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
