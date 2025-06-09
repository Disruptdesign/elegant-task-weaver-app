import React, { useState } from 'react';
import { Plus, Calendar, Clock, FolderOpen, Users, Edit3, Trash2, BookTemplate, FolderPlus, Link, ChevronDown, ChevronRight } from 'lucide-react';
import { Project, Task, ProjectTemplate, TemplateTask, Priority } from '../types/task';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ProjectTaskManager } from './ProjectTaskManager';
import { ProjectDatePicker } from './ProjectDatePicker';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>, projectTasks?: TemplateTask[]) => void;
  onUpdateProject: (id: string, updates: Partial<Project>, projectTasks?: TemplateTask[]) => void;
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  // États pour les modèles
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | undefined>();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: undefined as Date | undefined,
    deadline: undefined as Date | undefined,
    color: '#3B82F6',
  });

  // Tâches du projet en cours d'édition
  const [projectTasks, setProjectTasks] = useState<TemplateTask[]>([]);

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
    priority: 'medium' as Priority,
    estimatedDuration: 60,
    dayOffset: 0,
    dependencies: [] as string[],
  });

  const [editingTaskId, setEditingTaskId] = useState<string>('');
  const [editingTaskProjectId, setEditingTaskProjectId] = useState<string>('');
  const [editTaskFormData, setEditTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    estimatedDuration: 60,
    dependencies: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startDate || !formData.deadline) return;

    const projectData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startDate: formData.startDate,
      deadline: formData.deadline,
      color: formData.color,
    };

    if (editingProject) {
      onUpdateProject(editingProject.id, projectData, projectTasks);
    } else {
      onAddProject(projectData, projectTasks);
    }

    handleCloseForm();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProject(undefined);
    setProjectTasks([]);
    setFormData({
      title: '',
      description: '',
      startDate: undefined,
      deadline: undefined,
      color: '#3B82F6',
    });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      startDate: project.startDate,
      deadline: project.deadline,
      color: project.color || '#3B82F6',
    });
    
    // Charger les tâches existantes du projet (simulé pour l'instant)
    const existingProjectTasks = tasks
      .filter(task => task.projectId === project.id)
      .map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        dayOffset: 0, // Calculé à partir de la date de début du projet
        dependencies: task.dependencies || [],
      } as TemplateTask));
    
    setProjectTasks(existingProjectTasks);
    setIsFormOpen(true);
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const toggleProjectTasks = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

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
      dependencies: taskFormData.dependencies,
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
      dependencies: [],
    });
  };

  const handleRemoveTask = (taskId: string) => {
    setTemplateFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
    }));
  };

  const handleEditTaskInProject = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskProjectId(task.projectId || '');
    setEditTaskFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      estimatedDuration: task.estimatedDuration,
      dependencies: task.dependencies || [],
    });
  };

  const handleSaveTaskEdit = () => {
    if (!editingTaskId) return;

    onEditTask(editingTaskId, {
      title: editTaskFormData.title,
      description: editTaskFormData.description || undefined,
      priority: editTaskFormData.priority,
      estimatedDuration: editTaskFormData.estimatedDuration,
      dependencies: editTaskFormData.dependencies,
    });

    setEditingTaskId('');
    setEditingTaskProjectId('');
    setEditTaskFormData({
      title: '',
      description: '',
      priority: 'medium',
      estimatedDuration: 60,
      dependencies: [],
    });
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

  const getTaskNameById = (taskId: string, tasksList: (Task | TemplateTask)[]) => {
    const task = tasksList.find(t => t.id === taskId);
    return task ? task.title : `Tâche ${taskId.slice(0, 8)}...`;
  };

  const handleDeleteProject = async (projectId: string) => {
    console.log('🗑️ Tentative de suppression du projet:', projectId);
    try {
      await onDeleteProject(projectId);
      console.log('✅ Projet supprimé avec succès:', projectId);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du projet:', error);
    }
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
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
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
              const isExpanded = expandedProjects.has(project.id);

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
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
                        onClick={() => handleDeleteProject(project.id)}
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

                  {projectTasks.length > 0 && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleProjectTasks(project.id)}>
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors mb-2">
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                          {isExpanded ? 'Masquer les tâches' : 'Afficher les tâches'}
                          <span className="text-gray-500">({projectTasks.length})</span>
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="space-y-2">
                        <div className="mt-2 space-y-2">
                          {projectTasks.map(task => (
                            <div key={task.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                      {task.title}
                                    </span>
                                    {task.dependencies && task.dependencies.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-blue-600">
                                        <Link size={12} />
                                        <span>{task.dependencies.length} dép.</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {task.priority} • {task.estimatedDuration}min
                                    {task.dependencies && task.dependencies.length > 0 && (
                                      <div className="mt-1">
                                        <span className="font-medium">Dépend de:</span> {task.dependencies.map(depId => 
                                          getTaskNameById(depId, projectTasks)
                                        ).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleEditTaskInProject(task)}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <Edit3 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  <div className="text-xs text-gray-500 mt-4">
                    Créé le {format(project.createdAt, 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
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

                {template.tasks.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Tâches du modèle :</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {template.tasks.slice(0, 3).map(task => (
                        <div key={task.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{task.title}</span>
                              {task.dependencies && task.dependencies.length > 0 && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Link size={10} />
                                  <span>({task.dependencies.length})</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              Dépend de: {task.dependencies.map(depId => 
                                getTaskNameById(depId, template.tasks)
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                      {template.tasks.length > 3 && (
                        <div className="text-xs text-gray-500">
                          ... et {template.tasks.length - 3} autres tâches
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

      {/* Formulaire de projet avec gestion des tâches */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informations du projet */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Informations du projet</h3>
                
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
                  <ProjectDatePicker
                    date={formData.startDate || new Date()}
                    onDateChange={(date) => setFormData({ ...formData, startDate: date })}
                    label="Date de début"
                    placeholder="Sélectionner la date de début"
                  />

                  <ProjectDatePicker
                    date={formData.deadline || new Date()}
                    onDateChange={(date) => setFormData({ ...formData, deadline: date })}
                    label="Date limite"
                    placeholder="Sélectionner la date limite"
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

              {/* Gestion des tâches */}
              <ProjectTaskManager
                tasks={projectTasks}
                onTasksChange={setProjectTasks}
              />

              <div className="flex gap-3 pt-4 border-t">
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

      {/* Formulaire de modèle avec dépendances */}
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

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Tâches du modèle</h3>
                
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
                      onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as Priority })}
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

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Dépendances (tâches qui doivent être terminées avant)</label>
                    <div className="space-y-2">
                      {templateFormData.tasks.length > 0 && (
                        <div className="max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-2">
                          {templateFormData.tasks.map(task => (
                            <label key={task.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={taskFormData.dependencies.includes(task.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTaskFormData({
                                      ...taskFormData,
                                      dependencies: [...taskFormData.dependencies, task.id]
                                    });
                                  } else {
                                    setTaskFormData({
                                      ...taskFormData,
                                      dependencies: taskFormData.dependencies.filter(id => id !== task.id)
                                    });
                                  }
                                }}
                                className="rounded"
                              />
                              <span>{task.title}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {templateFormData.tasks.length === 0 && (
                        <p className="text-xs text-gray-500">Ajoutez d'abord une tâche pour pouvoir créer des dépendances</p>
                      )}
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

                {templateFormData.tasks.length > 0 && (
                  <div className="space-y-2">
                    {templateFormData.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                            {task.title}
                            {task.dependencies && task.dependencies.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Link size={12} />
                                <span>{task.dependencies.length}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {task.priority} • {task.estimatedDuration}min • Jour {task.dayOffset}
                            {task.dependencies && task.dependencies.length > 0 && (
                              <div className="mt-1">
                                <span className="font-medium">Dépend de:</span> {task.dependencies.map(depId => 
                                  getTaskNameById(depId, templateFormData.tasks)
                                ).join(', ')}
                              </div>
                            )}
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
                    <li key={task.id} className="flex items-center gap-2">
                      <span>• {task.title}</span>
                      {task.dependencies && task.dependencies.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Link size={10} />
                          <span>({task.dependencies.length} dép.)</span>
                        </div>
                      )}
                    </li>
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

      {/* Formulaire d'édition de tâche de projet */}
      {editingTaskId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                Modifier la tâche
              </h2>
              <button
                onClick={() => setEditingTaskId('')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de la tâche
                </label>
                <input
                  type="text"
                  value={editTaskFormData.title}
                  onChange={(e) => setEditTaskFormData({ ...editTaskFormData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editTaskFormData.description}
                  onChange={(e) => setEditTaskFormData({ ...editTaskFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    value={editTaskFormData.priority}
                    onChange={(e) => setEditTaskFormData({ ...editTaskFormData, priority: e.target.value as Priority })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    value={editTaskFormData.estimatedDuration}
                    onChange={(e) => setEditTaskFormData({ ...editTaskFormData, estimatedDuration: parseInt(e.target.value) || 60 })}
                    min="15"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dépendances (tâches qui doivent être terminées avant)
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {editingTaskProjectId && getProjectTasks(editingTaskProjectId)
                    .filter(task => task.id !== editingTaskId)
                    .map(task => (
                    <label key={task.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editTaskFormData.dependencies.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditTaskFormData({
                              ...editTaskFormData,
                              dependencies: [...editTaskFormData.dependencies, task.id]
                            });
                          } else {
                            setEditTaskFormData({
                              ...editTaskFormData,
                              dependencies: editTaskFormData.dependencies.filter(id => id !== task.id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span>{task.title}</span>
                    </label>
                  ))}
                  {(!editingTaskProjectId || getProjectTasks(editingTaskProjectId).filter(task => task.id !== editingTaskId).length === 0) && (
                    <p className="text-sm text-gray-500">Aucune autre tâche disponible dans ce projet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTaskId('')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveTaskEdit}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
