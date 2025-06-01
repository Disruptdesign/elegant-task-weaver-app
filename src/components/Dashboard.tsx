import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Calendar, Edit3 } from 'lucide-react';
import { Task } from '../types/task';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardProps {
  tasks: Task[];
  onEditTask?: (id: string, updates: Partial<Task>) => void;
}

export function Dashboard({ tasks, onEditTask }: DashboardProps) {
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const overdueTasks = pendingTasks.filter(task => isPast(new Date(task.deadline)));
  const todayTasks = pendingTasks.filter(task => 
    task.scheduledStart && isToday(task.scheduledStart)
  );

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

  const handleTaskClick = (task: Task) => {
    if (onEditTask) {
      // Pour l'instant, on peut juste marquer comme terminé
      // L'édition complète sera gérée par un formulaire séparé
      onEditTask(task.id, { completed: !task.completed });
    }
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
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{task.title}</span>
                    <div className="text-sm text-red-600 font-medium mt-1">
                      Échéance: {format(task.deadline, 'dd/MM/yyyy')}
                    </div>
                  </div>
                  {onEditTask && (
                    <button
                      onClick={() => handleTaskClick(task)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
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

      {/* Prochaines tâches */}
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
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
                      <p className="text-sm text-gray-600">{formatTaskTime(task)}</p>
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
    </div>
  );
}
