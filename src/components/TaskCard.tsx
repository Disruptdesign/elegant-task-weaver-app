
import React, { useState, useRef, useEffect } from 'react';
import { Clock, Calendar, Flag, CheckCircle2, Edit3, Trash2, MoreVertical } from 'lucide-react';
import { Task } from '../types/task';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
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
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const priorityConfig = {
    low: { label: 'Faible', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    medium: { label: 'Moyenne', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    high: { label: 'Haute', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    urgent: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };

  const taskStatus = getTaskStatus(task);
  const statusColors = getTaskStatusColors(taskStatus);
  const config = priorityConfig[task.priority];

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const formatScheduledTime = () => {
    if (!task.scheduledStart) return null;
    
    if (isToday(task.scheduledStart)) {
      return `Aujourd'hui à ${format(task.scheduledStart, 'HH:mm')}`;
    } else if (isTomorrow(task.scheduledStart)) {
      return `Demain à ${format(task.scheduledStart, 'HH:mm')}`;
    } else {
      return format(task.scheduledStart, 'dd/MM à HH:mm', { locale: fr });
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick && !e.defaultPrevented) {
      onClick(task);
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);
    action();
  };

  const isOverdue = taskStatus === 'overdue';
  const isApproaching = taskStatus === 'approaching';

  return (
    <div 
      className={`group relative cursor-pointer rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        task.completed 
          ? 'bg-gray-50 border-gray-200 opacity-70' 
          : `${statusColors.bg} ${statusColors.border} hover:shadow-xl`
      }`}
      onClick={handleCardClick}
    >
      <div className="p-5">
        {/* En-tête avec titre et priorité */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={`font-semibold text-gray-900 leading-tight ${
                task.completed ? 'line-through' : ''
              }`}>
                {task.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.border} border shrink-0`}>
                {config.label}
              </span>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          
          {/* Menu d'actions amélioré */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className={`p-2 rounded-lg transition-all ${
                showActions ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MoreVertical size={16} />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[140px] animate-fade-in">
                <button
                  onClick={(e) => handleActionClick(e, () => onEdit(task))}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <Edit3 size={14} />
                  Modifier
                </button>
                <button
                  onClick={(e) => handleActionClick(e, () => onDelete(task.id))}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informations temporelles améliorées */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar size={14} />
              <span className={isPast(task.deadline) && !task.completed ? 'text-red-600 font-medium' : ''}>
                {format(task.deadline, 'dd MMM', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock size={14} />
              <span>{formatDuration(task.estimatedDuration)}</span>
            </div>
          </div>

          {/* Planification */}
          {task.scheduledStart && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${statusColors.accent}`}>
              <Calendar size={14} />
              <span className="font-medium">
                {formatScheduledTime()}
              </span>
            </div>
          )}
        </div>

        {/* Statuts et actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isOverdue && (
              <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-md border border-red-200 flex items-center gap-1">
                ⚠️ En retard
              </span>
            )}
            {isApproaching && !isOverdue && (
              <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-md border border-orange-200 flex items-center gap-1">
                ⏰ Échéance proche
              </span>
            )}
            {task.projectId && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                📁 Projet
              </span>
            )}
          </div>
          
          {/* Bouton de completion */}
          <button
            onClick={(e) => handleActionClick(e, () => onComplete(task.id))}
            disabled={task.completed}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shrink-0 ${
              task.completed
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 hover:shadow-md'
            }`}
          >
            <CheckCircle2 size={14} className={task.completed ? 'text-white' : ''} />
            <span className="hidden sm:inline">
              {task.completed ? 'Terminée' : 'Terminer'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
