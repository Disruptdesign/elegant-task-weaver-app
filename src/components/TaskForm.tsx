
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flag, Plus, CalendarIcon, FolderOpen } from 'lucide-react';
import { Task, Priority, Project, TaskType } from '../types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from './ui/button';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '../lib/utils';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  editingTask?: Task;
  initialData?: { title: string; description?: string };
  projects?: Project[];
  taskTypes?: TaskType[];
}

export function TaskForm({ isOpen, onClose, onSubmit, editingTask, initialData, projects = [], taskTypes = [] }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [projectId, setProjectId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [canStartFrom, setCanStartFrom] = useState<Date | undefined>();
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [allowSplitting, setAllowSplitting] = useState(false);
  const [splitDuration, setSplitDuration] = useState(60);
  const [dependencies, setDependencies] = useState<string[]>([]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDeadline(editingTask.deadline.toISOString().slice(0, 16));
      setPriority(editingTask.priority);
      setEstimatedDuration(editingTask.estimatedDuration);
      setProjectId(editingTask.projectId || '');
      setTaskTypeId(editingTask.taskTypeId || '');
      setCanStartFrom(editingTask.canStartFrom);
      setBufferBefore(editingTask.bufferBefore || 0);
      setBufferAfter(editingTask.bufferAfter || 0);
      setAllowSplitting(editingTask.allowSplitting || false);
      setSplitDuration(editingTask.splitDuration || 60);
      setDependencies(editingTask.dependencies || []);
    } else if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setDeadline('');
      setPriority('medium');
      setEstimatedDuration(60);
      setProjectId('');
      setTaskTypeId('');
      setCanStartFrom(undefined);
      setBufferBefore(0);
      setBufferAfter(0);
      setAllowSplitting(false);
      setSplitDuration(60);
      setDependencies([]);
    } else {
      // Réinitialiser le formulaire pour une nouvelle tâche
      setTitle('');
      setDescription('');
      setDeadline('');
      setPriority('medium');
      setEstimatedDuration(60);
      setProjectId('');
      setTaskTypeId('');
      setCanStartFrom(undefined);
      setBufferBefore(0);
      setBufferAfter(0);
      setAllowSplitting(false);
      setSplitDuration(60);
      setDependencies([]);
    }
  }, [editingTask, initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: new Date(deadline),
      priority,
      estimatedDuration,
      projectId: projectId || undefined,
      taskTypeId: taskTypeId || undefined,
      canStartFrom,
      bufferBefore: bufferBefore > 0 ? bufferBefore : undefined,
      bufferAfter: bufferAfter > 0 ? bufferAfter : undefined,
      allowSplitting,
      splitDuration: allowSplitting && splitDuration > 0 ? splitDuration : undefined,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const durationPresets = [30, 60, 90, 120, 180, 240, 360, 480];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
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
          </div>

          {/* Projet et type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FolderOpen size={16} className="inline mr-2" />
                Projet (optionnel)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Aucun projet</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de tâche
              </label>
              <select
                value={taskTypeId}
                onChange={(e) => setTaskTypeId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choisir un type</option>
                {taskTypes.map(taskType => (
                  <option key={taskType.id} value={taskType.id}>
                    <span style={{ backgroundColor: taskType.color }} className="inline-block w-3 h-3 rounded-full mr-2" />
                    {taskType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Planification */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Planification</h3>
            
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
                <div className="space-y-3">
                  {/* Préréglages rapides */}
                  <div className="grid grid-cols-4 gap-2">
                    {durationPresets.map(duration => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setEstimatedDuration(duration)}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          estimatedDuration === duration
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {formatDuration(duration)}
                      </button>
                    ))}
                  </div>
                  
                  {/* Contrôle précis */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEstimatedDuration(Math.max(15, estimatedDuration - 15))}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      -15min
                    </button>
                    <div className="flex-1 text-center py-2 px-3 border border-gray-200 rounded-lg bg-gray-50">
                      <span className="font-medium">{formatDuration(estimatedDuration)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEstimatedDuration(estimatedDuration + 15)}
                      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      +15min
                    </button>
                  </div>
                  
                  {/* Input manuel pour les valeurs personnalisées */}
                  <input
                    type="range"
                    min="15"
                    max="480"
                    step="15"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peut commencer à partir de
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !canStartFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {canStartFrom ? format(canStartFrom, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={canStartFrom}
                    onSelect={setCanStartFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Options avancées */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Options avancées</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps de pause avant (min)
                </label>
                <input
                  type="number"
                  value={bufferBefore}
                  onChange={(e) => setBufferBefore(Number(e.target.value))}
                  min="0"
                  max="60"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps de pause après (min)
                </label>
                <input
                  type="number"
                  value={bufferAfter}
                  onChange={(e) => setBufferAfter(Number(e.target.value))}
                  min="0"
                  max="60"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={allowSplitting}
                  onChange={(e) => setAllowSplitting(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Autoriser le découpage de cette tâche
                </span>
              </label>

              {allowSplitting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée minimum pour le découpage (min)
                  </label>
                  <select
                    value={splitDuration}
                    onChange={(e) => setSplitDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 heure</option>
                    <option value={90}>1h 30</option>
                    <option value={120}>2 heures</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Priorité */}
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
