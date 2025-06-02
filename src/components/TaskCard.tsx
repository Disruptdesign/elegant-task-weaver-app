import React, { useState, useRef, useEffect } from 'react';
import { Clock, Calendar, Flag, CheckCircle2, Edit3, Trash2, MoreVertical, RotateCcw } from 'lucide-react';
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
    // Ne pas déclencher le clic de carte si on clique sur un bouton
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (onClick) {
      onClick(task);
    }
  };

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Complete/Restore button clicked for task:', task.id, 'Current status:', task.completed);
    onComplete(task.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit button clicked for task:', task.id);
    setShowActions(false);
    onEdit(task);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked for task:', task.id);
    setShowActions(false);
    onDelete(task.id);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
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
        {/* En-tête avec titre et priorité - amélioré pour mobile */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-start gap-2 mb-1 flex-wrap">
              <h3 className={`font-semibold text-gray-900 leading-tight break-words ${
                task.completed ? 'line-through' : ''
              }`}>
                {task.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.border} border shrink-0 whitespace-nowrap`}>
                {config.label}
              </span>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">{task.description}</p>
            )}
          </div>
          
          {/* Menu d'actions - amélioré pour l'accessibilité */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={handleMenuToggle}
              className={`p-2 rounded-lg transition-all z-10 relative touch-target ${
                showActions ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Menu d'actions"
            >
              <MoreVertical size={16} />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[140px] animate-fade-in">
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="w-full px-3 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors touch-target"
                >
                  <Edit3 size={14} />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="w-full px-3 py-3 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors touch-target"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informations temporelles - améliorées pour la lisibilité */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar size={14} />
              <span className={`${isPast(task.deadline) && !task.completed ? 'text-red-600 font-medium' : ''} whitespace-nowrap`}>
                {format(task.deadline, 'dd MMM', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock size={14} />
              <span className="whitespace-nowrap">{formatDuration(task.estimatedDuration)}</span>
            </div>
          </div>

          {/* Planification */}
          {task.scheduledStart && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${statusColors.accent}`}>
              <Calendar size={14} />
              <span className="font-medium break-words">
                {formatScheduledTime()}
              </span>
            </div>
          )}
        </div>

        {/* Statuts et actions - améliorés pour mobile */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {isOverdue && (
              <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-md border border-red-200 flex items-center gap-1 whitespace-nowrap">
                ⚠️ En retard
              </span>
            )}
            {isApproaching && !isOverdue && (
              <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-md border border-orange-200 flex items-center gap-1 whitespace-nowrap">
                ⏰ Échéance proche
              </span>
            )}
            {task.projectId && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap">
                📁 Projet
              </span>
            )}
          </div>
          
          {/* Bouton de completion/restauration - amélioré pour mobile */}
          <button
            type="button"
            onClick={handleCompleteClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shrink-0 z-10 relative touch-target ${
              task.completed
                ? 'bg-orange-500 text-white hover:bg-orange-600 border border-orange-500 hover:border-orange-600 hover:shadow-md active:scale-95'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 hover:shadow-md active:scale-95'
            }`}
            style={{ minHeight: '44px' }}
          >
            {task.completed ? (
              <>
                <RotateCcw size={14} className="text-white" />
                <span className="hidden sm:inline whitespace-nowrap">Rétablir</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span className="hidden sm:inline whitespace-nowrap">Terminer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
