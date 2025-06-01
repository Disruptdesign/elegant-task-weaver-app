
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flag, Plus } from 'lucide-react';
import { Task, Priority } from '../types/task';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  editingTask?: Task;
}

export function TaskForm({ isOpen, onClose, onSubmit, editingTask }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [category, setCategory] = useState('');

  // Mettre à jour les valeurs du formulaire quand editingTask change
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDeadline(editingTask.deadline.toISOString().slice(0, 16));
      setPriority(editingTask.priority);
      setEstimatedDuration(editingTask.estimatedDuration);
      setCategory(editingTask.category || '');
    } else {
      // Réinitialiser le formulaire pour une nouvelle tâche
      setTitle('');
      setDescription('');
      setDeadline('');
      setPriority('medium');
      setEstimatedDuration(60);
      setCategory('');
    }
  }, [editingTask, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    // Préserver les propriétés existantes lors de la modification
    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: new Date(deadline),
      priority,
      estimatedDuration,
      category: category.trim() || undefined,
      // Préserver les dates de planification existantes
      ...(editingTask && {
        scheduledStart: editingTask.scheduledStart,
        scheduledEnd: editingTask.scheduledEnd,
      }),
    };

    onSubmit(taskData);
    onClose();
  };

  const priorityOptions = [
    { value: 'low', label: 'Faible', color: 'text-green-600' },
    { value: 'medium', label: 'Moyenne', color: 'text-yellow-600' },
    { value: 'high', label: 'Haute', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-600' },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la tâche
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Que devez-vous faire ?"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajoutez des détails..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Date limite
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-2" />
                Durée estimée
              </label>
              <select
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h 30</option>
                <option value={120}>2 heures</option>
                <option value={180}>3 heures</option>
                <option value={240}>4 heures</option>
                <option value={480}>8 heures</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Flag size={16} className="inline mr-2" />
              Priorité
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === option.value
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie (optionnel)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Travail, Personnel, Santé..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {editingTask ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
