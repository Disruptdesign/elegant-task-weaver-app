
import React from 'react';
import { Event } from '../types/task';
import { Calendar, Clock, MapPin, Edit3, Trash2, Users } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onClick: (event: Event) => void;
}

export function EventCard({ event, onEdit, onDelete, onClick }: EventCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(event);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      onDelete(event.id);
    }
  };

  const formatEventDate = () => {
    if (event.allDay) {
      if (isToday(event.startDate)) {
        return "Aujourd'hui - Toute la journée";
      } else if (isTomorrow(event.startDate)) {
        return "Demain - Toute la journée";
      } else {
        return format(event.startDate, 'EEEE dd MMMM yyyy', { locale: fr }) + " - Toute la journée";
      }
    } else {
      if (isToday(event.startDate)) {
        return `Aujourd'hui de ${format(event.startDate, 'HH:mm')} à ${format(event.endDate, 'HH:mm')}`;
      } else if (isTomorrow(event.startDate)) {
        return `Demain de ${format(event.startDate, 'HH:mm')} à ${format(event.endDate, 'HH:mm')}`;
      } else {
        return `${format(event.startDate, 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })} - ${format(event.endDate, 'HH:mm')}`;
      }
    }
  };

  const getStatusColor = () => {
    if (isPast(event.endDate)) {
      return 'border-gray-300 bg-gray-50';
    } else if (isToday(event.startDate)) {
      return 'border-purple-200 bg-purple-50';
    } else {
      return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div
      onClick={() => onClick(event)}
      className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg cursor-pointer group ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={18} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <Clock size={14} />
                <span>{formatEventDate()}</span>
              </div>
            </div>
          </div>

          {event.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            {event.googleMeetLink && (
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>Visioconférence</span>
              </div>
            )}

            {event.markAsBusy && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Occupé</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifier l'événement"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer l'événement"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isPast(event.endDate) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            Événement passé
          </span>
        </div>
      )}
    </div>
  );
}
