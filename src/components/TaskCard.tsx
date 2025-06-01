
import React from 'react';
import { Clock, Calendar, Flag, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { Task } from '../types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onComplete, onEdit, onDelete }: TaskCardProps) {
  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200',
  };

  const priorityLabels = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div className={`group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
      task.completed ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 mb-2 ${
            task.completed ? 'line-through' : ''
          }`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} />
            <span>
              {format(task.deadline, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={16} />
            <span>{formatDuration(task.estimatedDuration)}</span>
          </div>
        </div>

        {task.scheduledStart && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <Calendar size={16} />
            <span>
              Planifié: {format(task.scheduledStart, 'dd/MM à HH:mm', { locale: fr })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            priorityColors[task.priority]
          }`}>
            <Flag size={12} />
            {priorityLabels[task.priority]}
          </div>
          
          <button
            onClick={() => onComplete(task.id)}
            disabled={task.completed}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              task.completed
                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
            }`}
          >
            <CheckCircle2 size={16} />
            {task.completed ? 'Terminée' : 'Marquer terminée'}
          </button>
        </div>
      </div>
    </div>
  );
}
