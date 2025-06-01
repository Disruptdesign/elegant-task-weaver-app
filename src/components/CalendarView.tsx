
import React, { useState } from 'react';
import { Task } from '../types/task';
import { format, startOfWeek, addDays, isSameDay, startOfDay, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
}

export function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const workingHours = Array.from({ length: 10 }, (_, i) => 9 + i); // 9h à 18h

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => 
      task.scheduledStart && isSameDay(new Date(task.scheduledStart), date)
    );
  };

  const getTaskPosition = (task: Task) => {
    if (!task.scheduledStart) return null;
    
    const start = new Date(task.scheduledStart);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    
    // Position en pourcentage depuis 9h
    const top = ((startHour - 9) + startMinute / 60) * 60; // 60px par heure
    const height = (task.estimatedDuration / 60) * 60; // Hauteur basée sur la durée
    
    return { top, height };
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200',
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = addDays(currentDate, direction === 'next' ? 7 : -7);
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="text-blue-600" size={28} />
            Vue calendrier
          </h1>
          <p className="text-gray-600 mt-1">
            Semaine du {format(weekStart, 'dd MMM yyyy', { locale: fr })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
          <div className="p-4 text-center text-sm font-medium text-gray-600">
            Heures
          </div>
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day, new Date());
            const dayTasks = getTasksForDay(day);
            
            return (
              <div
                key={index}
                className={`p-4 text-center border-l border-gray-200 ${
                  isToday ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div className={`text-lg font-bold mt-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {dayTasks.length} tâche{dayTasks.length > 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grille horaire */}
        <div className="relative">
          <div className="grid grid-cols-8">
            {/* Colonne des heures */}
            <div className="bg-gray-50">
              {workingHours.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {hour}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Colonnes des jours */}
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="relative border-l border-gray-200">
                {/* Lignes horaires */}
                {workingHours.map(hour => (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-100"
                  />
                ))}

                {/* Tâches */}
                <div className="absolute inset-0 p-1">
                  {getTasksForDay(day).map(task => {
                    const position = getTaskPosition(task);
                    if (!position) return null;

                    return (
                      <div
                        key={task.id}
                        className={`absolute left-1 right-1 rounded-lg border p-2 ${
                          priorityColors[task.priority]
                        } cursor-pointer hover:shadow-md transition-shadow`}
                        style={{
                          top: `${position.top}px`,
                          height: `${Math.max(position.height, 40)}px`,
                        }}
                      >
                        <div className="text-xs font-medium line-clamp-2">
                          {task.title}
                        </div>
                        {position.height > 40 && (
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                            <Clock size={10} />
                            {task.scheduledStart && format(new Date(task.scheduledStart), 'HH:mm')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Légende des priorités</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(priorityColors).map(([priority, colorClass]) => (
            <div key={priority} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border ${colorClass}`} />
              <span className="text-sm text-gray-600 capitalize">
                {priority === 'low' ? 'Faible' :
                 priority === 'medium' ? 'Moyenne' :
                 priority === 'high' ? 'Haute' : 'Urgente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
