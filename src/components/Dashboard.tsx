
import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Task } from '../types/task';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardProps {
  tasks: Task[];
}

export function Dashboard({ tasks }: DashboardProps) {
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const urgentTasks = pendingTasks.filter(task => task.priority === 'urgent');
  const todayTasks = pendingTasks.filter(task => 
    task.scheduledStart && isToday(task.scheduledStart)
  );
  const overdueTasks = pendingTasks.filter(task => 
    new Date(task.deadline) < new Date()
  );

  const stats = [
    {
      title: 'Tâches terminées',
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
      title: 'Urgentes',
      value: urgentTasks.length,
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
      .filter(task => task.scheduledStart)
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Tableau de bord
        </h1>
        <p className="text-gray-600">
          Vue d'ensemble de votre productivité
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg border ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <IconComponent size={24} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                    {stat.total && (
                      <span className="text-sm text-gray-500 font-normal">
                        /{stat.total}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-700">{stat.title}</h3>
              {stat.total && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${
                        stat.color === 'green' ? 'from-green-400 to-green-600' :
                        stat.color === 'blue' ? 'from-blue-400 to-blue-600' :
                        stat.color === 'red' ? 'from-red-400 to-red-600' :
                        'from-purple-400 to-purple-600'
                      }`}
                      style={{ width: `${(stat.value / stat.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tâches en retard */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-red-800">
              Tâches en retard ({overdueTasks.length})
            </h2>
          </div>
          <div className="space-y-2">
            {overdueTasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <span className="font-medium text-gray-900">{task.title}</span>
                <span className="text-sm text-red-600">
                  Échéance: {format(task.deadline, 'dd/MM/yyyy')}
                </span>
              </div>
            ))}
            {overdueTasks.length > 3 && (
              <p className="text-sm text-red-600 text-center">
                +{overdueTasks.length - 3} autres tâches en retard
              </p>
            )}
          </div>
        </div>
      )}

      {/* Prochaines tâches */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            <Calendar className="text-blue-600" size={20} />
            Prochaines tâches planifiées
          </h2>
        </div>
        <div className="p-6">
          {getUpcomingTasks().length > 0 ? (
            <div className="space-y-4">
              {getUpcomingTasks().map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                    <p className="text-sm text-gray-600">{formatTaskTime(task)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority === 'urgent' ? 'Urgente' :
                       task.priority === 'high' ? 'Haute' :
                       task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.floor(task.estimatedDuration / 60)}h{task.estimatedDuration % 60 > 0 ? ` ${task.estimatedDuration % 60}min` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600">Aucune tâche planifiée pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
