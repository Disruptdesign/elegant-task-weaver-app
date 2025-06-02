
import React, { useState } from 'react';
import { Plus, Copy, Edit3, Trash2, FolderPlus, Calendar, Clock, BookTemplate } from 'lucide-react';
import { ProjectTemplate, TemplateTask, Project, Task } from '../types/task';
import { format } from 'date-fns';

interface ProjectTemplatesProps {
  templates: ProjectTemplate[];
  onAddTemplate: (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<ProjectTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onCreateProjectFromTemplate: (templateId: string, projectData: { title: string; description?: string; startDate: Date; deadline: Date }) => void;
}

export function ProjectTemplates({ 
  templates, 
  onAddTemplate, 
  onUpdateTemplate, 
  onDeleteTemplate,
  onCreateProjectFromTemplate 
}: ProjectTemplatesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | undefined>();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    defaultDuration: 30,
    tasks: [] as TemplateTask[],
  });

  const [projectFormData, setProjectFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    deadline: '',
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    estimatedDuration: 60,
    dayOffset: 0,
  });

  const handleSubmitTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const templateData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color,
      defaultDuration: formData.defaultDuration,
      tasks: formData.tasks,
    };

    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, templateData);
    } else {
      onAddTemplate(templateData);
    }

    handleCloseForm();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(undefined);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      defaultDuration: 30,
      tasks: [],
    });
  };

  const handleEditTemplate = (template: ProjectTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      color: template.color || '#3B82F6',
      defaultDuration: template.defaultDuration,
      tasks: template.tasks,
    });
    setIsFormOpen(true);
  };

  const handleAddTask = () => {
    if (!taskFormData.title.trim()) return;

    const newTask: TemplateTask = {
      id: `template-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskFormData.title.trim(),
      description: taskFormData.description.trim() || undefined,
      priority: taskFormData.priority,
      estimatedDuration: taskFormData.estimatedDuration,
      dayOffset: taskFormData.dayOffset,
    };

    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));

    setTaskFormData({
      title: '',
      description: '',
      priority: 'medium',
      estimatedDuration: 60,
      dayOffset: 0,
    });
  };

  const handleRemoveTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
    }));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !projectFormData.title.trim()) return;

    onCreateProjectFromTemplate(selectedTemplate.id, {
      title: projectFormData.title.trim(),
      description: projectFormData.description.trim() || undefined,
      startDate: new Date(projectFormData.startDate),
      deadline: new Date(projectFormData.deadline),
    });

    setIsCreateProjectOpen(false);
    setSelectedTemplate(null);
    setProjectFormData({
      title: '',
      description: '',
      startDate: '',
      deadline: '',
    });
  };

  const openCreateProject = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + template.defaultDuration * 24 * 60 * 60 * 1000);
    
    setProjectFormData({
      title: `Nouveau ${template.name}`,
      description: '',
      startDate: now.toISOString().slice(0, 16),
      deadline: defaultEnd.toISOString().slice(0, 16),
    });
    setIsCreateProjectOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookTemplate className="text-purple-600" size={32} />
            Modèles de projets
          </h1>
          <p className="text-gray-600 mt-2">
            Créez des modèles réutilisables pour vos projets récurrents
          </p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau modèle
        </button>
      </div>

      {/* Liste des modèles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <BookTemplate className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun modèle
            </h3>
            <p className="text-gray-600 mb-4">
              Créez votre premier modèle de projet pour gagner du temps
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Créer un modèle
            </button>
          </div>
        ) : (
          templates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: template.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.name}
                  </h3>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {template.description && (
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>Durée par défaut: {template.defaultDuration} jours</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={14} />
                  <span>{template.tasks.length} tâche{template.tasks.length > 1 ? 's' : ''}</span>
                </div>
              </div>

              <button
                onClick={() => openCreateProject(template)}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <FolderPlus size={16} />
                Créer un projet
              </button>
            </div>
          ))
        )}
      </div>

      {/* Formulaire de modèle */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitTemplate} className="p-6 space-y-6">
              {/* Informations du modèle */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Informations du modèle</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du modèle
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Site web e-commerce"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du modèle"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée par défaut (jours)
                    </label>
                    <input
                      type="number"
                      value={formData.defaultDuration}
                      onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 30 })}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Tâches du modèle */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Tâches du modèle</h3>
                
                {/* Ajouter une tâche */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Ajouter une tâche</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={taskFormData.title}
                      onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                      placeholder="Titre de la tâche"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    
                    <select
                      value={taskFormData.priority}
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Durée (minutes)</label>
                      <input
                        type="number"
                        value={taskFormData.estimatedDuration}
                        onChange={(e) => setTaskFormData({ ...taskFormData, estimatedDuration: parseInt(e.target.value) || 60 })}
                        min="15"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Jour de début (après début projet)</label>
                      <input
                        type="number"
                        value={taskFormData.dayOffset}
                        onChange={(e) => setTaskFormData({ ...taskFormData, dayOffset: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Ajouter la tâche
                  </button>
                </div>

                {/* Liste des tâches */}
                {formData.tasks.length > 0 && (
                  <div className="space-y-2">
                    {formData.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{task.title}</div>
                          <div className="text-xs text-gray-500">
                            {task.priority} • {task.estimatedDuration}min • Jour {task.dayOffset}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  {editingTemplate ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de création de projet */}
      {isCreateProjectOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                Créer un projet à partir du modèle "{selectedTemplate.name}"
              </h2>
              <button
                onClick={() => setIsCreateProjectOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du projet
                </label>
                <input
                  type="text"
                  value={projectFormData.title}
                  onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                  placeholder="Nom du nouveau projet"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  placeholder="Description du projet"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    value={projectFormData.startDate}
                    onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite
                  </label>
                  <input
                    type="datetime-local"
                    value={projectFormData.deadline}
                    onChange={(e) => setProjectFormData({ ...projectFormData, deadline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-purple-900 mb-2">
                  Ce projet sera créé avec {selectedTemplate.tasks.length} tâches
                </h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  {selectedTemplate.tasks.slice(0, 3).map(task => (
                    <li key={task.id}>• {task.title}</li>
                  ))}
                  {selectedTemplate.tasks.length > 3 && (
                    <li>... et {selectedTemplate.tasks.length - 3} autres tâches</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Créer le projet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
