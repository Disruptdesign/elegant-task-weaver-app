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
  User
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
  projects: Project[];
}

export function TaskCard({ task, onComplete, onEdit, onDelete, onClick, projects }: TaskCardProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const { users, assignUserToTask, removeTaskAssignment } = useUsers();

  const priorityColors: { [key: string]: string } = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const projectInfo = projects.find(project => project.id === task.projectId);

  const handleAssignUser = async (userId: string, role: string) => {
    await assignUserToTask(task.id, userId, role as 'assignee' | 'reviewer' | 'observer');
  };

  const handleRemoveAssignment = async (userId: string) => {
    await removeTaskAssignment(task.id, userId);
  };

  const getAssignedUsersDisplay = () => {
    if (!task.assignments || task.assignments.length === 0) {
      return null;
    }

    const displayCount = 2;
    const assignments = task.assignments.slice(0, displayCount);
    const remaining = task.assignments.length - displayCount;

    return (
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <User size={12} />
        <span>
          {assignments.map(assignment => {
            const user = assignment.user;
            const displayName = user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email?.split('@')[0] || 'Utilisateur';
            return displayName;
          }).join(', ')}
          {remaining > 0 && ` +${remaining}`}
        </span>
      </div>
    );
  };

  return (
    <>
      <div 
        className={`bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer group ${
          task.completed ? 'opacity-75' : ''
        }`}
        onClick={() => onClick(task)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task.id);
                  }}
                  className="flex-shrink-0 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <Circle className="text-gray-400 hover:text-blue-600" size={20} />
                  )}
                </button>
                <h3 className={`font-medium text-gray-900 truncate ${
                  task.completed ? 'line-through text-gray-500' : ''
                }`}>
                  {task.title}
                </h3>
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignmentDialog(true);
                }}
                className="h-8 w-8 p-0"
              >
                <Users size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="h-8 w-8 p-0"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            {/* Priority */}
            <Badge className={`${priorityColors[task.priority]} text-white`}>
              {task.priority === 'urgent' && '🔴'}
              {task.priority === 'high' && '🟠'}
              {task.priority === 'medium' && '🟡'}
              {task.priority === 'low' && '🟢'}
              {task.priority}
            </Badge>

            {/* Deadline */}
            <div className={`flex items-center gap-1 ${
              isPast(task.deadline) && !task.completed ? 'text-red-600' : ''
            }`}>
              <Calendar size={12} />
              <span>
                {isToday(task.deadline) && 'Aujourd\'hui'}
                {isTomorrow(task.deadline) && 'Demain'}
                {!isToday(task.deadline) && !isTomorrow(task.deadline) && 
                  format(task.deadline, 'dd MMM', { locale: fr })
                }
              </span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{task.estimatedDuration}min</span>
            </div>

            {/* Project */}
            {projectInfo && (
              <Badge variant="outline" style={{ borderColor: projectInfo.color }}>
                {projectInfo.title}
              </Badge>
            )}
          </div>

          {/* Assigned users */}
          {getAssignedUsersDisplay()}
        </div>
      </div>

      <UserAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
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
