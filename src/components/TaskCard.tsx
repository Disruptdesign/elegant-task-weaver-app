import React, { useState } from 'react';
import { Task, Project } from '../types/task';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Circle,
  Users,
  User,
  Loader2
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserAssignmentDialog } from './UserAssignmentDialog';
import { useUsers } from '../hooks/useUsers';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
  onClick: (task: Task) => void;
  onAssignUser?: (task: Task) => void;
  projects: Project[];
  isLoading?: boolean;
}

export function TaskCard({ 
  task, 
  onComplete, 
  onEdit, 
  onDelete, 
  onClick, 
  onAssignUser,
  projects, 
  isLoading = false 
}: TaskCardProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const { users, assignUserToTask, removeTaskAssignment } = useUsers();

  console.log('🎯 TaskCard render:', {
    taskId: task.id,
    title: task.title,
    assignmentsCount: task.assignments?.length || 0,
    usersCount: users.length,
    isLoading
  });

  const priorityColors: { [key: string]: string } = {
    urgent: 'text-red-700 bg-red-100',
    high: 'text-orange-700 bg-orange-100',
    medium: 'text-yellow-700 bg-yellow-100',
    low: 'text-green-700 bg-green-100',
  };

  const priorityLabels: { [key: string]: string } = {
    urgent: 'Urgent',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
  };

  const priorityEmojis: { [key: string]: string } = {
    urgent: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };

  const projectInfo = projects.find(project => project.id === task.projectId);

  const handleAssignUser = async (userId: string, role: string) => {
    console.log('👤 Assigning user to task:', { taskId: task.id, userId, role });
    await assignUserToTask(task.id, userId, role as 'assignee' | 'reviewer' | 'observer');
  };

  const handleRemoveAssignment = async (userId: string) => {
    console.log('🗑️ Removing user assignment:', { taskId: task.id, userId });
    await removeTaskAssignment(task.id, userId);
  };

  const getAssignedUsersDisplay = () => {
    if (!task.assignments || task.assignments.length === 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <User size={12} />
          <span>Non assignée</span>
        </div>
      );
    }

    const displayCount = 2;
    const assignments = task.assignments.slice(0, displayCount);
    const remaining = task.assignments.length - displayCount;

    return (
      <div className="flex items-center gap-1 text-xs text-gray-700">
        <User size={12} className="text-blue-600" />
        <span className="font-medium">
          {assignments.map(assignment => {
            const user = assignment.user;
            if (!user) return 'Utilisateur inconnu';
            
            // Priorité : username > prénom nom > email
            if (user.username) return user.username;
            if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
            return user.email?.split('@')[0] || 'Utilisateur';
          }).join(', ')}
          {remaining > 0 && ` +${remaining} autre${remaining > 1 ? 's' : ''}`}
        </span>
      </div>
    );
  };

  const isOverdue = isPast(task.deadline) && !task.completed;

  return (
    <>
      <div 
        className={`bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group relative ${
          task.completed ? 'bg-gray-50 opacity-80' : 'hover:border-blue-200'
        } ${isOverdue ? 'border-red-200 bg-red-50' : ''} ${isLoading ? 'pointer-events-none' : ''}`}
        onClick={() => !isLoading && onClick(task)}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        )}

        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLoading) onComplete(task.id);
                  }}
                  className="flex-shrink-0 transition-all duration-200 hover:scale-110"
                  disabled={isLoading}
                  aria-label={task.completed ? "Marquer comme non terminée" : "Marquer comme terminée"}
                >
                  {task.completed ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <Circle className="text-gray-400 hover:text-blue-600" size={20} />
                  )}
                </button>
                <h3 className={`font-semibold text-gray-900 truncate transition-all duration-200 ${
                  task.completed ? 'line-through text-gray-500' : ''
                }`}>
                  {task.title}
                </h3>
                {isOverdue && (
                  <Badge variant="outline" className="border-red-500 text-red-700 text-xs">
                    En retard
                  </Badge>
                )}
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading) {
                    console.log('👥 Opening user assignment dialog for task:', task.id);
                    setShowAssignmentDialog(true);
                  }
                }}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                title="Assigner des utilisateurs"
              >
                <Users size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading) onEdit(task);
                }}
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200"
                title="Modifier la tâche"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading) onDelete(task.id);
                }}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                title="Supprimer la tâche"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Priority */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${priorityColors[task.priority]}`}>
              <span>{priorityEmojis[task.priority]}</span>
              <span className="font-medium">{priorityLabels[task.priority]}</span>
            </div>

            {/* Deadline */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
              isOverdue 
                ? 'text-red-700 bg-red-100' 
                : isToday(task.deadline) 
                  ? 'text-orange-700 bg-orange-100'
                  : 'text-gray-600 bg-gray-100'
            }`}>
              <Calendar size={12} />
              <span className="font-medium">
                {isToday(task.deadline) && 'Aujourd\'hui'}
                {isTomorrow(task.deadline) && 'Demain'}
                {!isToday(task.deadline) && !isTomorrow(task.deadline) && 
                  format(task.deadline, 'dd MMM', { locale: fr })
                }
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700">
              <Clock size={12} />
              <span className="font-medium">{task.estimatedDuration}min</span>
            </div>

            {/* Project */}
            {projectInfo && (
              <Badge 
                variant="outline" 
                style={{ 
                  borderColor: projectInfo.color,
                  color: projectInfo.color 
                }}
                className="bg-white"
              >
                {projectInfo.title}
              </Badge>
            )}
          </div>

          {/* Assigned users */}
          <div className="pt-1 border-t border-gray-100">
            {getAssignedUsersDisplay()}
          </div>
        </div>
      </div>

      <UserAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => {
          console.log('❌ Closing user assignment dialog');
          setShowAssignmentDialog(false);
        }}
        type="task"
        itemId={task.id}
        itemTitle={task.title}
        users={users}
        assignments={task.assignments || []}
        onAssignUser={handleAssignUser}
        onRemoveAssignment={handleRemoveAssignment}
      />
    </>
  );
}
