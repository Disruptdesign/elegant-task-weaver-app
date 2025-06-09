
import React, { useState, useEffect } from 'react';
import { X, Flag, Plus, FolderOpen, Tag, MapPin, Video, Repeat } from 'lucide-react';
import { Task, Event, Priority, ItemType, Project, TaskType, RepeatType } from '../types/task';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DurationSelector } from './ui/duration-selector';
import { DateTimeSelector } from './ui/datetime-selector';

interface AddItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  onSubmitEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingTask?: Task;
  editingEvent?: Event;
  initialData?: { title: string; description?: string };
  projects?: Project[];
  taskTypes?: TaskType[];
}

export function AddItemForm({ 
  isOpen, 
  onClose, 
  onSubmitTask, 
  onSubmitEvent, 
  editingTask, 
  editingEvent, 
  initialData,
  projects = [],
  taskTypes = []
}: AddItemFormProps) {
  const [itemType, setItemType] = useState<ItemType>('task');
  
  // États communs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);

  // États spécifiques aux tâches
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [projectId, setProjectId] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [canStartFrom, setCanStartFrom] = useState<Date | undefined>();
  const [allowSplitting, setAllowSplitting] = useState(false);
  const [splitDuration, setSplitDuration] = useState(60);

  // États spécifiques aux événements
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [allDay, setAllDay] = useState(false);
  const [markAsBusy, setMarkAsBusy] = useState(true);
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [location, setLocation] = useState('');
  const [repeat, setRepeat] = useState<RepeatType>(null);

  console.log('AddItemForm: Rendering with', { 
    projectsCount: projects.length, 
    taskTypesCount: taskTypes.length,
    isOpen,
    projects: projects.map(p => ({ id: p.id, title: p.title })),
    taskTypes: taskTypes.map(t => ({ id: t.id, name: t.name }))
  });

  // Obtenir le projet sélectionné
  const selectedProject = projects.find(p => p.id === projectId);
  const isProjectSelected = projectId && projectId !== 'no-project';

  // Mettre à jour automatiquement les dates quand un projet est sélectionné
  useEffect(() => {
    if (selectedProject && itemType === 'task') {
      setDeadline(new Date(selectedProject.deadline));
      setCanStartFrom(new Date(selectedProject.startDate));
    }
  }, [selectedProject, itemType]);

  useEffect(() => {
    if (editingTask) {
      setItemType('task');
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDeadline(editingTask.deadline);
      setPriority(editingTask.priority);
      setEstimatedDuration(editingTask.estimatedDuration);
      setProjectId(editingTask.projectId || 'no-project');
      setTaskTypeId(editingTask.taskTypeId || 'no-task-type');
      setCanStartFrom(editingTask.canStartFrom);
      setBufferBefore(editingTask.bufferBefore || 0);
      setBufferAfter(editingTask.bufferAfter || 0);
      setAllowSplitting(editingTask.allowSplitting || false);
      setSplitDuration(editingTask.splitDuration || 60);
    } else if (editingEvent) {
      setItemType('event');
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setStartDate(editingEvent.startDate);
      setEndDate(editingEvent.endDate);
      setAllDay(editingEvent.allDay);
      setMarkAsBusy(editingEvent.markAsBusy);
      setGoogleMeetLink(editingEvent.googleMeetLink || '');
      setLocation(editingEvent.location || '');
      setBufferBefore(editingEvent.bufferBefore || 0);
      setBufferAfter(editingEvent.bufferAfter || 0);
      setRepeat(editingEvent.repeat || null);
    } else if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      resetForm();
    } else {
      resetForm();
    }
  }, [editingTask, editingEvent, initialData, isOpen]);

  const resetForm = () => {
    setItemType('task');
    setTitle('');
    setDescription('');
    setDeadline(undefined);
    setPriority('medium');
    setEstimatedDuration(60);
    setProjectId('no-project');
    setTaskTypeId('no-task-type');
    setCanStartFrom(undefined);
    setBufferBefore(0);
    setBufferAfter(0);
    setAllowSplitting(false);
    setSplitDuration(60);
    setStartDate(undefined);
    setEndDate(undefined);
    setAllDay(false);
    setMarkAsBusy(true);
    setGoogleMeetLink('');
    setLocation('');
    setRepeat(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (itemType === 'task') {
      if (!deadline) return;
      
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        deadline,
        priority,
        estimatedDuration,
        projectId: projectId === 'no-project' ? undefined : projectId,
        taskTypeId: taskTypeId === 'no-task-type' ? undefined : taskTypeId,
        canStartFrom,
        bufferBefore: bufferBefore > 0 ? bufferBefore : undefined,
        bufferAfter: bufferAfter > 0 ? bufferAfter : undefined,
        allowSplitting,
        splitDuration: allowSplitting && splitDuration > 0 ? splitDuration : undefined,
        ...(editingTask && {
          scheduledStart: editingTask.scheduledStart,
          scheduledEnd: editingTask.scheduledEnd,
        }),
      };

      console.log('AddItemForm: Submitting task with data:', taskData);
      onSubmitTask(taskData);
    } else {
      if (!startDate || !endDate) return;

      const eventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        allDay,
        markAsBusy,
        googleMeetLink: googleMeetLink.trim() || undefined,
        location: location.trim() || undefined,
        bufferBefore: bufferBefore > 0 ? bufferBefore : undefined,
        bufferAfter: bufferAfter > 0 ? bufferAfter : undefined,
        repeat,
      };

      onSubmitEvent(eventData);
    }
    
    onClose();
  };

  const priorityOptions = [
    { value: 'low', label: 'Faible', color: 'text-green-600' },
    { value: 'medium', label: 'Moyenne', color: 'text-yellow-600' },
    { value: 'high', label: 'Haute', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-600' },
  ] as const;

  const repeatOptions = [
    { value: null, label: 'Aucune' },
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'yearly', label: 'Annuelle' },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTask || editingEvent ? 'Modifier' : 'Ajouter'} {itemType === 'task' ? 'une tâche' : 'un événement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sélection du type */}
          {!editingTask && !editingEvent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type d'élément
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setItemType('task')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    itemType === 'task'
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  Tâche
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('event')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    itemType === 'event'
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  Événement
                </button>
              </div>
            </div>
          )}

          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Que voulez-vous ${itemType === 'task' ? 'faire' : 'planifier'} ?`}
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

          {/* Propriétés spécifiques aux tâches */}
          {itemType === 'task' && (
            <>
              {/* Projet et type de tâche */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FolderOpen size={16} className="inline mr-2" />
                    Projet
                  </label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <SelectValue placeholder="Choisir un projet" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <SelectItem value="no-project">Aucun projet</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            {project.color && (
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: project.color }}
                              />
                            )}
                            {project.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {projects.length} projet{projects.length > 1 ? 's' : ''} disponible{projects.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag size={16} className="inline mr-2" />
                    Type de tâche
                  </label>
                  <Select value={taskTypeId} onValueChange={setTaskTypeId}>
                    <SelectTrigger className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <SelectItem value="no-task-type">Aucun type</SelectItem>
                      {taskTypes.map(taskType => (
                        <SelectItem key={taskType.id} value={taskType.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: taskType.color }}
                            />
                            {taskType.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {taskTypes.length} type{taskTypes.length > 1 ? 's' : ''} disponible{taskTypes.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Planification</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date limite
                      {isProjectSelected && (
                        <span className="text-xs text-gray-500 ml-2">(définie par le projet)</span>
                      )}
                    </label>
                    <div className={isProjectSelected ? 'opacity-50 pointer-events-none' : ''}>
                      <DateTimeSelector
                        value={deadline}
                        onChange={isProjectSelected ? () => {} : setDeadline}
                        placeholder="Sélectionnez une date limite"
                        includeTime={false}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée estimée
                    </label>
                    <DurationSelector
                      value={estimatedDuration}
                      onChange={setEstimatedDuration}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peut commencer à partir de
                    {isProjectSelected && (
                      <span className="text-xs text-gray-500 ml-2">(définie par le projet)</span>
                    )}
                  </label>
                  <div className={isProjectSelected ? 'opacity-50 pointer-events-none' : ''}>
                    <DateTimeSelector
                      value={canStartFrom}
                      onChange={isProjectSelected ? () => {} : setCanStartFrom}
                      placeholder="Choisir une date"
                      includeTime={false}
                    />
                  </div>
                </div>
              </div>

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
            </>
          )}

          {/* Propriétés spécifiques aux événements */}
          {itemType === 'event' && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Planification</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={allDay}
                      onChange={(e) => setAllDay(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Toute la journée
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date et heure de début
                    </label>
                    <DateTimeSelector
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Début de l'événement"
                      includeTime={!allDay}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date et heure de fin
                    </label>
                    <DateTimeSelector
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="Fin de l'événement"
                      includeTime={!allDay}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Options</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={markAsBusy}
                      onChange={(e) => setMarkAsBusy(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Marquer comme occupé
                    </span>
                  </label>
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Repeat size={16} className="inline mr-2" />
                    Répétition
                  </label>
                  <select
                    value={repeat || ''}
                    onChange={(e) => setRepeat(e.target.value === '' ? null : e.target.value as RepeatType)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {repeatOptions.map((option) => (
                      <option key={option.value || 'none'} value={option.value || ''}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Video size={16} className="inline mr-2" />
                    Lien Google Meet (optionnel)
                  </label>
                  <input
                    type="url"
                    value={googleMeetLink}
                    onChange={(e) => setGoogleMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-2" />
                    Localisation (optionnel)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lieu de l'événement..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}

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
              {editingTask || editingEvent ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
