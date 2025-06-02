import React, { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle2, Edit3, Trash2, FolderOpen, Link, Settings } from 'lucide-react';
import { Project, Task } from '../types/task';
import { format, isPast, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onEditTask?: (id: string, updates: Partial<Task>) => void;
}

export function ProjectList({ projects, tasks, onAddProject, onUpdateProject, onDeleteProject, onEditTask }: ProjectListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [managingDependencies, setManagingDependencies] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    deadline: '',
    color: '#3B82F6',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startDate || !formData.deadline) return;

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

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getProjectProgress = (project: Project) => {
    const projectTasks = getProjectTasks(project.id);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(task => task.completed);
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  const getProjectStatus = (project: Project) => {
    if (project.completed) return 'completed';
    if (isPast(project.deadline)) return 'overdue';
    const daysLeft = differenceInDays(project.deadline, new Date());
    if (daysLeft <= 3) return 'urgent';
    if (daysLeft <= 7) return 'warning';
    return 'normal';
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'urgent':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleTaskDependencyChange = (taskId: string, dependencies: string[]) => {
    if (onEditTask) {
      onEditTask(taskId, { dependencies });
    }
  };

  const getTaskDependencyName = (dependencyId: string): string => {
    const task = tasks.find(t => t.id === dependencyId);
    return task ? task.title : 'Tâche inconnue';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FolderOpen className="text-blue-600" size={32} />
            Projets
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos projets et leurs tâches associées
          </p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau projet
        </button>
      </div>

      {/* Liste des projets */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun projet
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par créer votre premier projet
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
            const progress = getProjectProgress(project);
            const status = getProjectStatus(project);
            const projectTasks = getProjectTasks(project.id);
            const isExpanded = expandedProjects.has(project.id);

            return (
              <div
                key={project.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all ${getStatusColors(status)}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <h3 className="text-xl font-semibold text-gray-900">
                          {project.title}
                        </h3>
                        {project.completed && (
                          <CheckCircle2 className="text-green-600" size={20} />
                        )}
                      </div>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          Début: {format(project.startDate, 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          Échéance: {format(project.deadline, 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{projectTasks.length} tâche{projectTasks.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setManagingDependencies(managingDependencies === project.id ? null : project.id)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Gérer les dépendances"
                      >
                        <Link size={16} />
                      </button>
                      <button
                        onClick={() => toggleProjectExpansion(project.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                      <button
                        onClick={() => handleEditProject(project)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteProject(project.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progression</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Gestion des dépendances */}
                  {managingDependencies === project.id && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Settings size={16} />
                        Gestion des dépendances du projet
                      </h4>
                      <div className="space-y-3">
                        {projectTasks.map(task => (
                          <div key={task.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{task.title}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.completed ? 'Terminée' : 'En cours'}
                              </span>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Dépendances (cette tâche dépend de):
                              </label>
                              <div className="space-y-2">
                                {projectTasks
                                  .filter(t => t.id !== task.id)
                                  .map(potentialDep => (
                                    <label key={potentialDep.id} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={task.dependencies?.includes(potentialDep.id) || false}
                                        onChange={(e) => {
                                          const currentDeps = task.dependencies || [];
                                          let newDeps;
                                          
                                          if (e.target.checked) {
                                            newDeps = [...currentDeps, potentialDep.id];
                                          } else {
                                            newDeps = currentDeps.filter(id => id !== potentialDep.id);
                                          }
                                          
                                          handleTaskDependencyChange(task.id, newDeps);
                                        }}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                      <span className="text-sm text-gray-700">{potentialDep.title}</span>
                                      {potentialDep.completed && (
                                        <CheckCircle2 className="text-green-500" size={14} />
                                      )}
                                    </label>
                                  ))}
                                
                                {/* Dépendances vers des tâches d'autres projets */}
                                <div className="border-t pt-2 mt-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Tâches d'autres projets:
                                  </label>
                                  {tasks
                                    .filter(t => t.projectId !== project.id && t.projectId)
                                    .map(externalTask => (
                                      <label key={externalTask.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={task.dependencies?.includes(externalTask.id) || false}
                                          onChange={(e) => {
                                            const currentDeps = task.dependencies || [];
                                            let newDeps;
                                            
                                            if (e.target.checked) {
                                              newDeps = [...currentDeps, externalTask.id];
                                            } else {
                                              newDeps = currentDeps.filter(id => id !== externalTask.id);
                                            }
                                            
                                            handleTaskDependencyChange(task.id, newDeps);
                                          }}
                                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                          {externalTask.title}
                                          <span className="text-xs text-gray-500 ml-1">
                                            ({projects.find(p => p.id === externalTask.projectId)?.title})
                                          </span>
                                        </span>
                                        {externalTask.completed && (
                                          <CheckCircle2 className="text-green-500" size={14} />
                                        )}
                                      </label>
                                    ))}
                                </div>
                              </div>
                              
                              {/* Afficher les dépendances actuelles */}
                              {task.dependencies && task.dependencies.length > 0 && (
                                <div className="mt-2 p-2 bg-blue-50 rounded">
                                  <span className="text-xs font-medium text-blue-800">Dépendances actives:</span>
                                  <ul className="text-xs text-blue-700 mt-1">
                                    {task.dependencies.map(depId => (
                                      <li key={depId}>• {getTaskDependencyName(depId)}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tâches du projet (si étendu) */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Tâches du projet
                      </h4>
                      {projectTasks.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          Aucune tâche associée à ce projet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {projectTasks.map(task => (
                            <div
                              key={task.id}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                task.completed ? 'bg-green-50' : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => onEditTask?.(task.id, { completed: !task.completed })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex flex-col">
                                  <span className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {task.title}
                                  </span>
                                  {task.dependencies && task.dependencies.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Link size={12} className="text-purple-500" />
                                      <span className="text-xs text-purple-600">
                                        {task.dependencies.length} dépendance{task.dependencies.length > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(task.deadline, 'dd/MM')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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
                  placeholder="Nom du projet"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
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
    </div>
  );
}
