
import React from 'react';
import { Clock, Calendar, Flag, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { Task } from '../types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getTaskStatus, getTaskStatusColors } from '../utils/taskStatus';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onClick?: (task: Task) => void;
}

export function TaskCard({ task, onComplete, onEdit, onDelete, onClick }: TaskCardProps) {
  const priorityColors = {
    low: 'text-gray-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  };

  const priorityLabels = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  };

  const taskStatus = getTaskStatus(task);
  const statusColors = getTaskStatusColors(taskStatus);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick && !e.defaultPrevented) {
      onClick(task);
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div 
      className={`group cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        task.completed 
          ? 'bg-gray-50 border-gray-200 opacity-60' 
          : `${statusColors.bg} ${statusColors.border} hover:shadow-lg`
      }`}
      onClick={handleCardClick}
    >
      <div className="p-5">
        {/* En-tête avec titre et actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-900 leading-tight ${
              task.completed ? 'line-through' : ''
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleActionClick(e, () => onEdit(task))}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={(e) => handleActionClick(e, () => onDelete(task.id))}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Métadonnées */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span>{format(task.deadline, 'dd MMM', { locale: fr })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{formatDuration(task.estimatedDuration)}</span>
          </div>
          <div className={`flex items-center gap-1.5 ${priorityColors[task.priority]}`}>
            <Flag size={12} />
            <span>{priorityLabels[task.priority]}</span>
          </div>
        </div>

        {/* Planification */}
        {task.scheduledStart && (
          <div className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md mb-3 ${statusColors.accent}`}>
            <Calendar size={12} />
            <span>
              Planifié: {format(task.scheduledStart, 'dd/MM à HH:mm', { locale: fr })}
            </span>
          </div>
        )}

        {/* Footer avec statut et action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {taskStatus === 'overdue' && (
              <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-md">
                En retard
              </span>
            )}
            {taskStatus === 'approaching' && (
              <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
                Échéance proche
              </span>
            )}
            {task.category && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                {task.category}
              </span>
            )}
          </div>
          
          <button
            onClick={(e) => handleActionClick(e, () => onComplete(task.id))}
            disabled={task.completed}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              task.completed
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
            }`}
          >
            <CheckCircle2 size={12} />
            {task.completed ? 'Terminée' : 'Terminer'}
          </button>
        </div>
      </div>
    </div>
  );
}
