import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Calendar, Edit3, Users } from 'lucide-react';
import { Task, Event } from '../types/task';
import { format, isToday, isTomorrow, isThisWeek, isPast, isFuture, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AddItemForm } from './AddItemForm';

interface DashboardProps {
  tasks: Task[];
  events: Event[];
  onEditTask?: (id: string, updates: Partial<Task>) => void;
  onEditEvent?: (id: string, updates: Partial<Event>) => void;
}

export function Dashboard({ tasks, events, onEditTask, onEditEvent }: DashboardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const overdueTasks = pendingTasks.filter(task => isPast(new Date(task.deadline)));
  const todayTasks = pendingTasks.filter(task => 
    task.scheduledStart && isToday(task.scheduledStart)
  );

  // Événements d'aujourd'hui et à venir
  const todayEvents = events.filter(event => isToday(new Date(event.startDate)));
  const upcomingEvents = events.filter(event => isFuture(new Date(event.startDate)));

  const stats = [
    {
      title: 'Terminées',
      value: completedTasks.length,
      total: tasks.length,
      color: 'green',
      icon: CheckCircle2,
    },
    {
      title: 'En attente',
      value: pendingTasks.length,
      color: 'blue',
      icon: Clock,
    },
    {
      title: 'En retard',
      value: overdueTasks.length,
      color: 'red',
      icon: AlertTriangle,
    },
    {
      title: "Aujourd'hui",
      value: todayTasks.length,
      color: 'purple',
      icon: Calendar,
    },
  ];

  const getUpcomingTasks = () => {
    return pendingTasks
      .filter(task => task.scheduledStart && !isPast(new Date(task.deadline)))
      .sort((a, b) => 
        new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime()
      )
      .slice(0, 5);
  };

  const getUpcomingEvents = () => {
    return upcomingEvents
      .sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      .slice(0, 5);
  };

  const formatTaskTime = (task: Task) => {
    if (!task.scheduledStart) return 'Non planifié';
    
    if (isToday(task.scheduledStart)) {
      return `Aujourd'hui à ${format(task.scheduledStart, 'HH:mm')}`;
    } else if (isTomorrow(task.scheduledStart)) {
      return `Demain à ${format(task.scheduledStart, 'HH:mm')}`;
    } else if (isThisWeek(task.scheduledStart)) {
      return format(task.scheduledStart, 'EEEE à HH:mm', { locale: fr });
    } else {
      return format(task.scheduledStart, 'dd MMM à HH:mm', { locale: fr });
    }
  };

  const formatEventTime = (event: Event) => {
    if (isToday(event.startDate)) {
      return `Aujourd'hui à ${format(event.startDate, 'HH:mm')}`;
    } else if (isTomorrow(event.startDate)) {
      return `Demain à ${format(event.startDate, 'HH:mm')}`;
    } else if (isThisWeek(event.startDate)) {
      return format(event.startDate, 'EEEE à HH:mm', { locale: fr });
    } else {
      return format(event.startDate, 'dd MMM à HH:mm', { locale: fr });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSelectedTask(undefined);
    setIsFormOpen(true);
  };

  const handleTaskCompletion = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onEditTask) {
      onEditTask(task.id, { completed: !task.completed });
    }
  };

  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTask && onEditTask) {
      onEditTask(selectedTask.id, taskData);
    }
    setSelectedTask(undefined);
    setIsFormOpen(false);
  };

  const handleEventFormSubmit = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEvent && onEditEvent) {
      onEditEvent(selectedEvent.id, eventData);
    }
    setSelectedEvent(undefined);
    setIsFormOpen(false);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTask(undefined);
    setSelectedEvent(undefined);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Tableau de bord
        </h1>
        <p className="text-lg text-gray-600">
          Vue d'ensemble de votre productivité
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          const colorClasses = {
            green: 'bg-green-50 text-green-600 border-green-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            red: 'bg-red-50 text-red-600 border-red-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
          };

          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-xl border-2 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <IconComponent size={32} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                    {stat.total && (
                      <span className="text-lg text-gray-500 font-normal">
                        /{stat.total}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-700">{stat.title}</h3>
                </div>
                {stat.total && (
                  <div className="w-full">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          stat.color === 'green' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          stat.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          stat.color === 'red' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                          'bg-gradient-to-r from-purple-400 to-purple-600'
                        }`}
                        style={{ width: `${(stat.value / stat.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Événements d'aujourd'hui avec bouton d'édition */}
      {todayEvents.length > 0 && (
        <div className="mx-4">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="text-purple-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-purple-800">
                Événements d'aujourd'hui ({todayEvents.length})
              </h2>
            </div>
            <div className="space-y-3">
              {todayEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm group hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{event.title}</span>
                    <div className="text-sm text-purple-600 font-medium mt-1">
                      {event.allDay ? 'Toute la journée' : `${format(event.startDate, 'HH:mm')} - ${format(event.endDate, 'HH:mm')}`}
                    </div>
                    {event.location && (
                      <div className="text-sm text-gray-600 mt-1">
                        📍 {event.location}
                      </div>
                    )}
                  </div>
                  {onEditEvent && (
                    <button
                      onClick={() => handleEventClick(event)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Modifier l'événement"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tâches en retard */}
      {overdueTasks.length > 0 && (
        <div className="mx-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-red-800">
                Tâches en retard ({overdueTasks.length})
              </h2>
            </div>
            <div className="space-y-3">
              {overdueTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm group hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 flex-1">
                    {onEditTask && (
                      <button
                        onClick={(e) => handleTaskCompletion(task, e)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Marquer comme terminé"
                      >
                        <CheckCircle2 size={16} className="text-gray-400 hover:text-green-600" />
                      </button>
                    )}
                    <div>
                      <span className="font-medium text-gray-900">{task.title}</span>
                      <div className="text-sm text-red-600 font-medium mt-1">
                        Échéance: {format(task.deadline, 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                  {onEditTask && (
                    <button
                      onClick={() => handleTaskClick(task)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Modifier la tâche"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {overdueTasks.length > 3 && (
                <p className="text-sm text-red-600 text-center font-medium">
                  +{overdueTasks.length - 3} autres tâches en retard
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prochains événements avec bouton d'édition */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <Users className="text-purple-600" size={24} />
              Prochains événements
            </h2>
          </div>
          <div className="p-6">
            {getUpcomingEvents().length > 0 ? (
              <div className="space-y-4">
                {getUpcomingEvents().map((event, index) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-sm text-purple-600 mb-1">{formatEventTime(event)}</p>
                      {event.location && (
                        <p className="text-sm text-gray-600">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {event.allDay ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Toute la journée
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 font-medium">
                          {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                        </span>
                      )}
                      {onEditEvent && (
                        <button
                          onClick={() => handleEventClick(event)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Modifier l'événement"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun événement planifié
                </h3>
                <p className="text-gray-600">
                  Vos prochains événements apparaîtront ici
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prochaines tâches avec bouton d'édition */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <Calendar className="text-blue-600" size={24} />
              Prochaines tâches planifiées
            </h2>
          </div>
          <div className="p-6">
            {getUpcomingTasks().length > 0 ? (
              <div className="space-y-4">
                {getUpcomingTasks().map((task, index) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {onEditTask && (
                        <button
                          onClick={(e) => handleTaskCompletion(task, e)}
                          className="p-1 hover:bg-white rounded"
                          title="Marquer comme terminé"
                        >
                          <CheckCircle2 size={16} className="text-gray-400 hover:text-green-600" />
                        </button>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
                        <p className="text-sm text-gray-600">{formatTaskTime(task)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority === 'urgent' ? 'Urgente' :
                         task.priority === 'high' ? 'Haute' :
                         task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">
                        {Math.floor(task.estimatedDuration / 60)}h{task.estimatedDuration % 60 > 0 ? ` ${task.estimatedDuration % 60}min` : ''}
                      </span>
                      {onEditTask && (
                        <Edit3 className="text-gray-400 group-hover:text-blue-600 transition-colors" size={16} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune tâche planifiée
                </h3>
                <p className="text-gray-600">
                  Commencez par créer vos premières tâches
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire de modification */}
      {(onEditTask || onEditEvent) && (
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
