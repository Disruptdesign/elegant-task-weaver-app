import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Calendar, Edit3, Users, TrendingUp, FolderOpen } from 'lucide-react';
import { Task, Event, Project, InboxItem, TaskType, ProjectTemplate } from '../types/task';
import { format, isToday, isTomorrow, isThisWeek, isPast, isFuture, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AddItemForm } from './AddItemForm';
import { getTaskStatus } from '../utils/taskStatus';

interface DashboardProps {
  tasks: Task[];
  events: Event[];
  inboxItems: InboxItem[];
  projects: Project[];
  taskTypes: TaskType[];
  projectTemplates: ProjectTemplate[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onAddInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteInboxItem: (id: string) => Promise<void>;
  onAddProject: (project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddTaskType: (taskType: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateTaskType: (id: string, updates: Partial<TaskType>) => Promise<void>;
  onDeleteTaskType: (id: string) => Promise<void>;
  onAddProjectTemplate: (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProjectTemplate: (id: string, updates: Partial<ProjectTemplate>) => Promise<void>;
  onDeleteProjectTemplate: (id: string) => Promise<void>;
  onCreateProjectFromTemplate: (templateId: string, projectData: { title: string; description?: string; startDate: Date; deadline: Date }) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onConvertToTask: (item: InboxItem) => Promise<void>;
}

function Dashboard({ 
  tasks, 
  events, 
  inboxItems,
  projects, 
  taskTypes,
  projectTemplates,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddInboxItem,
  onDeleteInboxItem,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTaskType,
  onUpdateTaskType,
  onDeleteTaskType,
  onAddProjectTemplate,
  onUpdateProjectTemplate,
  onDeleteProjectTemplate,
  onCreateProjectFromTemplate,
  onRefreshData,
  onConvertToTask
}: DashboardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  
  // Utiliser getTaskStatus pour les tâches en retard
  const overdueTasks = pendingTasks.filter(task => getTaskStatus(task) === 'overdue');
  
  const todayTasks = pendingTasks.filter(task => 
    task.scheduledStart && isToday(task.scheduledStart)
  );

  // Calcul du taux de completion
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Événements d'aujourd'hui et à venir
  const todayEvents = events.filter(event => isToday(new Date(event.startDate)));
  const upcomingEvents = events.filter(event => isFuture(new Date(event.startDate)));

  // Calcul du nombre total d'heures des événements d'aujourd'hui
  const todayEventsHours = todayEvents.reduce((total, event) => {
    if (event.allDay) {
      return total + 8; // Considérer qu'un événement de toute la journée dure 8h
    }
    const duration = differenceInHours(new Date(event.endDate), new Date(event.startDate));
    return total + Math.max(duration, 0);
  }, 0);

  const stats = [
    {
      title: 'Terminées',
      value: completedTasks.length,
      total: tasks.length,
      color: 'green',
      icon: CheckCircle2,
      subtitle: `${completionRate}% de réussite`,
    },
    {
      title: 'En attente',
      value: pendingTasks.length,
      color: 'blue',
      icon: Clock,
      subtitle: `${Math.round(pendingTasks.reduce((acc, task) => acc + task.estimatedDuration, 0) / 60)}h de travail`,
    },
    {
      title: 'En retard',
      value: overdueTasks.length,
      color: 'red',
      icon: AlertTriangle,
      subtitle: overdueTasks.length > 0 ? 'Action requise' : 'Tout va bien',
    },
    {
      title: "Aujourd'hui",
      value: todayEvents.length,
      color: 'purple',
      icon: Calendar,
      subtitle: (
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-500">
            événement{todayEvents.length > 1 ? 's' : ''} aujourd'hui
            {todayEventsHours > 0 && (
              <span className="text-gray-600 ml-1">
                ({todayEventsHours}h)
              </span>
            )}
          </div>
          {upcomingEvents.length > 0 && (
            <div className="text-xs text-gray-400">
              +{upcomingEvents.length} à venir
            </div>
          )}
        </div>
      ),
    },
  ];

  // Fonction pour obtenir le nom du projet
  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find(project => project.id === projectId)?.title;
  };

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
    console.log('Task clicked from dashboard:', task.id);
    setSelectedTask(task);
    setSelectedEvent(undefined);
    setIsFormOpen(true);
  };

  const handleEventClick = (event: Event) => {
    console.log('Event clicked from dashboard:', event.id);
    setSelectedEvent(event);
    setSelectedTask(undefined);
    setIsFormOpen(true);
  };

  const handleTaskCompletion = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Task completion clicked from dashboard:', task.id);
    
    if (onUpdateTask) {
      onUpdateTask(task.id, { completed: !task.completed });
    }
  };

  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTask && onUpdateTask) {
      onUpdateTask(selectedTask.id, taskData);
    }
    setSelectedTask(undefined);
    setIsFormOpen(false);
  };

  const handleEventFormSubmit = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEvent && onUpdateEvent) {
      onUpdateEvent(selectedEvent.id, eventData);
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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-4 lg:px-0">
      {/* En-tête */}
      <div className="text-center py-6 sm:py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-4">
          Tableau de bord
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-2 sm:mb-4 px-4">
          Vue d'ensemble de votre productivité
        </p>
        {tasks.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 px-4">
            <TrendingUp size={14} className="sm:size-4" />
            <span>
              {completionRate}% de tâches terminées · {pendingTasks.length} tâches restantes
            </span>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          const colorClasses = {
            green: 'bg-green-50 text-green-600 border-green-200 from-green-400 to-green-600',
            blue: 'bg-blue-50 text-blue-600 border-blue-200 from-blue-400 to-blue-600',
            red: 'bg-red-50 text-red-600 border-red-200 from-red-400 to-red-600',
            purple: 'bg-purple-50 text-purple-600 border-purple-200 from-purple-400 to-purple-600',
          };

          const classes = colorClasses[stat.color as keyof typeof colorClasses];

          return (
            <div
              key={index}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 lg:space-y-4">
                <div className={`p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 ${classes}`}>
                  <IconComponent size={20} className="sm:size-6 lg:size-7" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                    {stat.total && (
                      <span className="text-sm sm:text-base lg:text-lg text-gray-500 font-normal">
                        /{stat.total}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">{stat.title}</h3>
                  <div className="text-xs text-gray-500 break-words">
                    {typeof stat.subtitle === 'string' ? stat.subtitle : stat.subtitle}
                  </div>
                </div>
                {stat.total && (
                  <div className="w-full">
                    <div className="bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${classes}`}
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

      {/* Tâches en retard */}
      {overdueTasks.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl animate-pulse">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-red-800">
                ⚠️ Tâches en retard ({overdueTasks.length})
              </h2>
              <p className="text-xs sm:text-sm text-red-600">Ces tâches nécessitent votre attention immédiate</p>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {overdueTasks.slice(0, 3).map(task => {
              const projectName = getProjectName(task.projectId);
              return (
                <div key={task.id} className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {onUpdateTask && (
                      <button
                        type="button"
                        onClick={(e) => handleTaskCompletion(task, e)}
                        className="p-1.5 sm:p-2 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
                        title="Marquer comme terminé"
                      >
                        <CheckCircle2 size={16} className="text-gray-400 hover:text-green-600" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{task.title}</span>
                        {projectName && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <FolderOpen size={10} className="text-blue-600" />
                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate max-w-20 sm:max-w-none">
                              {projectName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-red-600 font-medium">
                        {task.scheduledStart && task.scheduledStart > new Date(task.deadline) 
                          ? `Planifiée après l'échéance: ${format(task.scheduledStart, 'dd/MM/yyyy à HH:mm')}`
                          : `Échéance dépassée: ${format(task.deadline, 'dd/MM/yyyy à HH:mm')}`
                        }
                      </div>
                    </div>
                  </div>
                  {onUpdateTask && (
                    <button
                      type="button"
                      onClick={() => handleTaskClick(task)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex-shrink-0"
                      title="Modifier la tâche"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            {overdueTasks.length > 3 && (
              <p className="text-xs sm:text-sm text-red-600 text-center font-medium bg-white p-2 rounded-lg">
                +{overdueTasks.length - 3} autres tâches en retard
              </p>
            )}
          </div>
        </div>
      )}

      {/* Événements d'aujourd'hui */}
      {todayEvents.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg sm:rounded-xl">
              <Users className="text-purple-600" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-purple-800">
                📅 Événements d'aujourd'hui ({todayEvents.length})
              </h2>
              <p className="text-xs sm:text-sm text-purple-600">Vos rendez-vous du jour</p>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {todayEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm group hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 text-sm sm:text-base block truncate">{event.title}</span>
                  <div className="text-xs sm:text-sm text-purple-600 font-medium mt-1">
                    {event.allDay ? 'Toute la journée' : `${format(event.startDate, 'HH:mm')} - ${format(event.endDate, 'HH:mm')}`}
                  </div>
                  {event.location && (
                    <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">📍 {event.location}</div>
                  )}
                </div>
                {onUpdateEvent && (
                  <button
                    type="button"
                    onClick={() => handleEventClick(event)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors flex-shrink-0"
                    title="Modifier l'événement"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid responsive pour les sections suivantes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Prochains événements */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-3">
              <Users className="text-purple-600" size={20} />
              Prochains événements
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {getUpcomingEvents().length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {getUpcomingEvents().map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl hover:bg-purple-100 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base truncate">{event.title}</h3>
                      <p className="text-xs sm:text-sm text-purple-600 font-medium">{formatEventTime(event)}</p>
                      {event.location && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {event.allDay ? (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-800">
                          Toute la journée
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:inline">
                          {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                        </span>
                      )}
                      {onUpdateEvent && (
                        <button
                          type="button"
                          onClick={() => handleEventClick(event)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-purple-600 hover:bg-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Modifier l'événement"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Users className="mx-auto text-gray-400 mb-4" size={40} />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Aucun événement planifié
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Vos prochains événements apparaîtront ici
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Prochaines tâches */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-3">
              <Calendar className="text-blue-600" size={20} />
              Prochaines tâches
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {getUpcomingTasks().length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {getUpcomingTasks().map((task) => {
                  const projectName = getProjectName(task.projectId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {onUpdateTask && (
                          <button
                            type="button"
                            onClick={(e) => handleTaskCompletion(task, e)}
                            className="p-1 hover:bg-white rounded flex-shrink-0"
                            title="Marquer comme terminé"
                          >
                            <CheckCircle2 size={14} className="text-gray-400 hover:text-green-600" />
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{task.title}</h3>
                            {projectName && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <FolderOpen size={10} className="text-blue-600" />
                                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate max-w-16 sm:max-w-none">
                                  {projectName}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">{formatTaskTime(task)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'urgent' ? 'Urgente' :
                           task.priority === 'high' ? 'Haute' :
                           task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:inline">
                          {Math.floor(task.estimatedDuration / 60)}h{task.estimatedDuration % 60 > 0 ? ` ${task.estimatedDuration % 60}min` : ''}
                        </span>
                        {onUpdateTask && (
                          <Edit3 className="text-gray-400 group-hover:text-blue-600 transition-colors hidden sm:inline" size={14} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Calendar className="mx-auto text-gray-400 mb-4" size={40} />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Aucune tâche planifiée
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Commencez par créer vos premières tâches
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire de modification */}
      {(onUpdateTask || onUpdateEvent) && (
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

export default Dashboard;
