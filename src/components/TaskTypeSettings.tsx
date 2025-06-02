
import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Clock, Settings, Calendar, Coffee } from 'lucide-react';
import { TaskType } from '../types/task';

interface TaskTypeSettingsProps {
  taskTypes: TaskType[];
  onAddTaskType: (taskType: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTaskType: (id: string, updates: Partial<TaskType>) => void;
  onDeleteTaskType: (id: string) => void;
}

export function TaskTypeSettings({ taskTypes, onAddTaskType, onUpdateTaskType, onDeleteTaskType }: TaskTypeSettingsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | undefined>();
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    timeSlots: [] as Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
    autoSchedule: true,
    allowWeekends: false,
    bufferBetweenTasks: 15,
  });

  const daysOfWeek = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const taskTypeData = {
      name: formData.name.trim(),
      color: formData.color,
      timeSlots: formData.timeSlots.map(slot => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        start: new Date(),
        end: new Date(),
        available: true,
      })),
      autoSchedule: formData.autoSchedule,
      allowWeekends: formData.allowWeekends,
      bufferBetweenTasks: formData.bufferBetweenTasks,
    };

    if (editingTaskType) {
      onUpdateTaskType(editingTaskType.id, taskTypeData);
    } else {
      onAddTaskType(taskTypeData);
    }

    handleCloseForm();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTaskType(undefined);
    setFormData({
      name: '',
      color: '#3B82F6',
      timeSlots: [],
      autoSchedule: true,
      allowWeekends: false,
      bufferBetweenTasks: 15,
    });
  };

  const handleEditTaskType = (taskType: TaskType) => {
    setEditingTaskType(taskType);
    setFormData({
      name: taskType.name,
      color: taskType.color,
      timeSlots: taskType.timeSlots.map(slot => ({
        dayOfWeek: slot.dayOfWeek || 1,
        startTime: slot.startTime || '09:00',
        endTime: slot.endTime || '17:00',
      })),
      autoSchedule: taskType.autoSchedule ?? true,
      allowWeekends: taskType.allowWeekends ?? false,
      bufferBetweenTasks: taskType.bufferBetweenTasks ?? 15,
    });
    setIsFormOpen(true);
  };

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      timeSlots: [...formData.timeSlots, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }],
    });
  };

  const removeTimeSlot = (index: number) => {
    setFormData({
      ...formData,
      timeSlots: formData.timeSlots.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index: number, field: string, value: string | number) => {
    const updatedSlots = [...formData.timeSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setFormData({ ...formData, timeSlots: updatedSlots });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="text-blue-600" size={28} />
            Types de tâches
          </h2>
          <p className="text-gray-600 mt-2">
            Configurez les types de tâches avec leurs créneaux horaires et paramètres de planification
          </p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau type
        </button>
      </div>

      {/* Liste des types de tâches */}
      <div className="grid gap-4">
        {taskTypes.map(taskType => (
          <div
            key={taskType.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: taskType.color }}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {taskType.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {taskType.timeSlots.length} créneau{taskType.timeSlots.length > 1 ? 'x' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coffee size={14} />
                      {taskType.bufferBetweenTasks || 15} min pause
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {taskType.allowWeekends ? 'Week-ends inclus' : 'Semaine uniquement'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditTaskType(taskType)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => onDeleteTaskType(taskType.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Créneaux horaires */}
            {taskType.timeSlots.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock size={14} />
                  Créneaux horaires
                </h4>
                <div className="grid gap-2">
                  {taskType.timeSlots.map((slot, index) => {
                    const dayLabel = daysOfWeek.find(day => day.value === slot.dayOfWeek)?.label || 'Jour inconnu';
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3"
                      >
                        <span className="font-medium">{dayLabel}</span>
                        <span>de {slot.startTime} à {slot.endTime}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Paramètres de planification */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${taskType.autoSchedule ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-600">
                    Planification auto: {taskType.autoSchedule ? 'Activée' : 'Désactivée'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire de type de tâche */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTaskType ? 'Modifier le type de tâche' : 'Nouveau type de tâche'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du type
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Travail, Personnel..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-12 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Paramètres de planification */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Settings size={18} />
                  Paramètres de planification
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="auto-schedule"
                      checked={formData.autoSchedule}
                      onChange={(e) => setFormData({ ...formData, autoSchedule: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="auto-schedule" className="text-sm font-medium text-gray-700">
                      Planification automatique
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="weekends"
                      checked={formData.allowWeekends}
                      onChange={(e) => setFormData({ ...formData, allowWeekends: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="weekends" className="text-sm font-medium text-gray-700">
                      Inclure les week-ends
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pause entre tâches (min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={formData.bufferBetweenTasks}
                      onChange={(e) => setFormData({ ...formData, bufferBetweenTasks: parseInt(e.target.value) || 15 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Créneaux horaires */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock size={16} />
                    Créneaux horaires disponibles
                  </label>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Ajouter
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) => updateTimeSlot(index, 'dayOfWeek', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {daysOfWeek.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      <span className="text-gray-500">à</span>

                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {formData.timeSlots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock size={24} className="mx-auto mb-2 opacity-50" />
                    <p>Aucun créneau défini. Ajoutez au moins un créneau pour ce type de tâche.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  {editingTaskType ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
