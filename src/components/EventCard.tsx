
import React, { useState } from 'react';
import { Event } from '../types/task';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2,
  MapPin,
  Video,
  Users,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserAssignmentDialog } from './UserAssignmentDialog';
import { useUsers } from '../hooks/useUsers';

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => Promise<void>;
  onClick: (event: Event) => void;
}

export function EventCard({ event, onEdit, onDelete, onClick }: EventCardProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const { users, assignUserToEvent, removeEventAssignment } = useUsers();

  console.log('📅 EventCard render:', {
    eventId: event.id,
    title: event.title,
    assignmentsCount: event.assignments?.length || 0,
    usersCount: users.length
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
    if (!event.assignments || event.assignments.length === 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <User size={12} />
          <span>Aucun participant</span>
        </div>
      );
    }

    const displayCount = 2;
    const assignments = event.assignments.slice(0, displayCount);
    const remaining = event.assignments.length - displayCount;

    return (
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <User size={12} />
        <span>
          {assignments.map(assignment => {
            const user = assignment.user;
            const displayName = user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.email?.split('@')[0] || 'Participant';
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
        className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => onClick(event)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                <h3 className="font-medium text-gray-900 truncate">
                  {event.title}
                </h3>
              </div>
              
              {event.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('👥 Opening user assignment dialog for event:', event.id);
                  setShowAssignmentDialog(true);
                }}
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                title="Gérer les participants"
              >
                <Users size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event);
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
                  onDelete(event.id);
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          {/* Event Details */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            {/* Date and Time */}
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>
                {format(event.startDate, 'dd MMM', { locale: fr })}
              </span>
            </div>

            {!event.allDay && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>
                  {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                </span>
              </div>
            )}

            {event.allDay && (
              <Badge variant="outline">
                Journée entière
              </Badge>
            )}

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span className="truncate max-w-[100px]">{event.location}</span>
              </div>
            )}

            {/* Google Meet */}
            {event.googleMeetLink && (
              <div className="flex items-center gap-1">
                <Video size={12} />
                <span>Meet</span>
              </div>
            )}
          </div>

          {/* Assigned users - Always visible */}
          {getAssignedUsersDisplay()}
        </div>
      </div>

      <UserAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => {
          console.log('❌ Closing user assignment dialog for event');
          setShowAssignmentDialog(false);
        }}
        type="event"
        itemId={event.id}
        itemTitle={event.title}
        users={users}
        assignments={event.assignments || []}
        onAssignUser={handleAssignUser}
        onRemoveAssignment={handleRemoveAssignment}
      />
    </>
  );
}
