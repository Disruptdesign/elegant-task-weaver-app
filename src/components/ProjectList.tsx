import React, { useState } from 'react';
import { Plus, Calendar, Clock, FolderOpen, Users, Edit3, Trash2, BookTemplate, FolderPlus } from 'lucide-react';
import { Project, Task, ProjectTemplate, TemplateTask } from '../types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onEditTask: (id: string, updates: Partial<Task>) => void;
  // Nouvelles props pour les modèles
  projectTemplates?: ProjectTemplate[];
  onAddTemplate?: (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTemplate?: (id: string, updates: Partial<ProjectTemplate>) => void;
  onDeleteTemplate?: (id: string) => void;
  onCreateProjectFromTemplate?: (templateId: string, projectData: { title: string; description?: string; startDate: Date; deadline: Date }) => void;
}

export function ProjectList({ 
  projects, 
  tasks, 
  onAddProject, 
  onUpdateProject, 
  onDeleteProject, 
  onEditTask,
  projectTemplates = [],
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onCreateProjectFromTemplate
}: ProjectListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [activeTab, setActiveTab] = useState<'projects' | 'templates'>('projects');
  
  // États pour les modèles
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | undefined>();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    deadline: '',
    color: '#3B82F6',
  });

  // États pour les modèles
  const [templateFormData, setTemplateFormData] = useState({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const projectData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startDate: new Date(formData.startDate),
      deadline: new Date(formData.deadline),
      color: formData.color,
    };

    if (editingProject) {
      onUpdateProject(editingProject.id, projectData);
    } else {
      onAddProject(projectData);
    }

    handleCloseForm();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProject(undefined);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      deadline: '',
      color: '#3B82F6',
    });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      startDate: project.startDate.toISOString().slice(0, 16),
      deadline: project.deadline.toISOString().slice(0, 16),
      color: project.color || '#3B82F6',
    });
    setIsFormOpen(true);
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  // Fonctions pour les modèles
  const handleSubmitTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFormData.name.trim() || !onAddTemplate || !onUpdateTemplate) return;

    const templateData = {
      name: templateFormData.name.trim(),
      description: templateFormData.description.trim() || undefined,
      color: templateFormData.color,
      defaultDuration: templateFormData.defaultDuration,
      tasks: templateFormData.tasks,
    };

    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, templateData);
    } else {
      onAddTemplate(templateData);
    }

    handleCloseTemplateForm();
  };

  const handleCloseTemplateForm = () => {
    setIsTemplateFormOpen(false);
    setEditingTemplate(undefined);
    setTemplateFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      defaultDuration: 30,
      tasks: [],
    });
  };

  const handleEditTemplate = (template: ProjectTemplate) => {
    setEditingTemplate(template);
    setTemplateFormData({
      name: template.name,
      description: template.description || '',
      color: template.color || '#3B82F6',
      defaultDuration: template.defaultDuration,
      tasks: template.tasks,
    });
    setIsTemplateFormOpen(true);
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

    setTemplateFormData(prev => ({
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
    setTemplateFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
    }));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !projectFormData.title.trim() || !onCreateProjectFromTemplate) return;

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
      {/* En-tête avec onglets */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FolderOpen className="text-blue-600" size={32} />
            Projets
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos projets et leurs modèles
          </p>
        </div>
        
        <button
          onClick={() => activeTab === 'projects' ? setIsFormOpen(true) : setIsTemplateFormOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          {activeTab === 'projects' ? 'Nouveau projet' : 'Nouveau modèle'}
        </button>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderOpen size={16} />
              Projets ({projects.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookTemplate size={16} />
              Modèles ({projectTemplates.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'projects' ? (
        // Liste des projets
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun projet
              </h3>
              <p className="text-gray-600 mb-4">
                Créez votre premier projet pour commencer à organiser vos tâches
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un projet
              </button>
            </div>
          ) : (
            projects.map(project => {
              const projectTasks = getProjectTasks(project.id);
              const completedTasks = projectTasks.filter(task => task.completed);
              const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditProject(project)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteProject(project.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>
                        Échéance: {format(project.deadline, 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={14} />
                      <span>{projectTasks.length} tâche{projectTasks.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progression</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Créé le {format(project.createdAt, 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Liste des modèles
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectTemplates.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <BookTemplate className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun modèle
              </h3>
              <p className="text-gray-600 mb-4">
                Créez votre premier modèle de projet pour gagner du temps
              </p>
              <button
                onClick={() => setIsTemplateFormOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Créer un modèle
              </button>
            </div>
          ) : (
            projectTemplates.map(template => (
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
                      onClick={() => onDeleteTemplate && onDeleteTemplate(template.id)}
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
      )}

      {/* Formulaire de projet */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du projet
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Refonte du site web"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  placeholder="Description du projet"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
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
                  {editingProject ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de modèle */}
      {isTemplateFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}
              </h2>
              <button
                onClick={handleCloseTemplateForm}
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
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
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
                    value={templateFormData.description}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
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
                      value={templateFormData.color}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, color: e.target.value })}
                      className="w-full h-12 border border-gray-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée par défaut (jours)
                    </label>
                    <input
                      type="number"
                      value={templateFormData.defaultDuration}
                      onChange={(e) => setTemplateFormData({ ...templateFormData, defaultDuration: parseInt(e.target.value) || 30 })}
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
                {templateFormData.tasks.length > 0 && (
                  <div className="space-y-2">
                    {templateFormData.tasks.map(task => (
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
                  onClick={handleCloseTemplateForm}
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

      {/* Formulaire de création de projet depuis modèle */}
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
