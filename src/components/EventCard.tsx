
import React, { useState } from 'react';
import { Event } from '../types/task';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Clock, Edit, Trash2, MapPin, Loader2, Users, User } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserAssignmentDialog } from './UserAssignmentDialog';
import { useUsers } from '../hooks/useUsers';
import { useAssignments } from '../hooks/useAssignments';

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => Promise<void>;
  onClick: (event: Event) => void;
  onAssignUser?: (event: Event) => void;
  isLoading?: boolean;
}

export function EventCard({ 
  event, 
  onEdit, 
  onDelete, 
  onClick, 
  onAssignUser,
  isLoading = false 
}: EventCardProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const { users, assignUserToEvent, removeEventAssignment } = useUsers();
  const { assignments } = useAssignments(event.id, 'event');

  console.log('🎯 EventCard render:', {
    eventId: event.id,
    title: event.title,
    assignmentsCount: assignments?.length || 0,
    usersCount: users.length,
    isLoading
  });

  const handleAssignUser = async (userId: string, role: string) => {
    console.log('👤 Assigning user to event:', { eventId: event.id, userId, role });
    await assignUserToEvent(event.id, userId, role as 'organizer' | 'attendee' | 'optional');
  };

  const handleRemoveAssignment = async (userId: string) => {
    console.log('🗑️ Removing user assignment from event:', { eventId: event.id, userId });
    await removeEventAssignment(event.id, userId);
  };

  const getAssignedUsersDisplay = () => {
    if (!assignments || assignments.length === 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <User size={12} />
          <span>Non assigné</span>
        </div>
      );
    }

    const displayCount = 2;
    const assignmentsList = assignments.slice(0, displayCount);
    const remaining = assignments.length - displayCount;

    return (
      <div className="flex items-center gap-1 text-xs text-gray-700">
        <User size={12} className="text-purple-600" />
        <span className="font-medium">
          {assignmentsList.map(assignment => {
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

  return (
    <>
      <div 
        className={`bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group relative ${
          isLoading ? 'pointer-events-none' : 'hover:border-purple-200'
        }`}
        onClick={() => !isLoading && onClick(event)}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-purple-600" size={24} />
          </div>
        )}

        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {event.title}
                </h3>
              </div>
              
              {event.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                  {event.description}
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
                    console.log('👥 Opening user assignment dialog for event:', event.id);
                    setShowAssignmentDialog(true);
                  }
                }}
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                title="Assigner des utilisateurs"
              >
                <Users size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading) onEdit(event);
                }}
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200"
                title="Modifier l'événement"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading) onDelete(event.id);
                }}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                title="Supprimer l'événement"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Date */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 text-purple-700">
              <Calendar size={12} />
              <span className="font-medium">
                {isToday(event.startDate) && 'Aujourd\'hui'}
                {isTomorrow(event.startDate) && 'Demain'}
                {!isToday(event.startDate) && !isTomorrow(event.startDate) && 
                  format(event.startDate, 'dd MMM', { locale: fr })
                }
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700">
              <Clock size={12} />
              <span className="font-medium">
                {event.allDay ? 'Toute la journée' : 
                  `${format(event.startDate, 'HH:mm')} - ${format(event.endDate, 'HH:mm')}`
                }
              </span>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700">
                <MapPin size={12} />
                <span className="font-medium truncate max-w-32">{event.location}</span>
              </div>
            )}

            {/* All day badge */}
            {event.allDay && (
              <Badge variant="outline" className="border-purple-500 text-purple-700">
                Journée complète
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
        type="event"
        itemId={event.id}
        itemTitle={event.title}
        users={users}
        assignments={assignments || []}
        onAssignUser={handleAssignUser}
        onRemoveAssignment={handleRemoveAssignment}
      />
    </>
  );
}
