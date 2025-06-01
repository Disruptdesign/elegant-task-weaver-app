
import React, { useState } from 'react';
import { Task } from '../types/task';
import { format, startOfWeek, addDays, isSameDay, startOfDay, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { getTaskStatus, getTaskStatusColors } from '../utils/taskStatus';
import { TaskForm } from './TaskForm';

interface CalendarViewProps {
  tasks: Task[];
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
}

export function CalendarView({ tasks, onUpdateTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTask && onUpdateTask) {
      onUpdateTask(selectedTask.id, taskData);
    }
    setSelectedTask(undefined);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTask(undefined);
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="text-blue-600" size={32} />
            Vue calendrier
          </h1>
          <p className="text-gray-600 mt-2">
            Semaine du {format(weekStart, 'dd MMM yyyy', { locale: fr })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

                    const taskStatus = getTaskStatus(task);
                    const statusColors = getTaskStatusColors(taskStatus);

                    return (
                      <div
                        key={task.id}
                        className={`absolute left-1 right-1 rounded-lg border p-2 cursor-pointer hover:shadow-md transition-all ${
                          statusColors.bg
                        } ${statusColors.border} hover:scale-105`}
                        style={{
                          top: `${position.top}px`,
                          height: `${Math.max(position.height, 40)}px`,
                        }}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="text-xs font-medium line-clamp-2 text-gray-900">
                          {task.title}
                        </div>
                        {position.height > 40 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Légende des échéances</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-green-50 border-green-200" />
            <span className="text-sm text-gray-600">Dans les temps</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-orange-50 border-orange-200" />
            <span className="text-sm text-gray-600">Échéance proche</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-red-50 border-red-200" />
            <span className="text-sm text-gray-600">En retard</span>
          </div>
        </div>
      </div>

      {/* Formulaire de modification */}
      {onUpdateTask && (
        <TaskForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          editingTask={selectedTask}
        />
      )}
    </div>
  );
}
