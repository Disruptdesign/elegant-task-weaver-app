import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Users } from 'lucide-react';
import { Project, TemplateTask, Task } from '../types/task';
import { ProjectDatePicker } from './ProjectDatePicker';
import { ProjectTaskManager } from './ProjectTaskManager';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (task: Omit<import('../types/task').Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
}

export function ProjectList({ 
  projects, 
  tasks,
  onAddProject, 
  onUpdateProject, 
  onDeleteProject,
  onAddTask 
}: ProjectListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    color: '#3B82F6',
  });
  const [projectTasks, setProjectTasks] = useState<TemplateTask[]>([]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: new Date(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: '#3B82F6',
    });
    setProjectTasks([]);
    setEditingProject(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    if (editingProject) {
      // Mise à jour du projet existant
      onUpdateProject(editingProject.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate,
        deadline: formData.deadline,
        color: formData.color,
      });

      // Créer les tâches du projet avec l'ID du projet existant
      projectTasks.forEach(templateTask => {
        const taskDeadline = new Date(formData.startDate.getTime() + (templateTask.dayOffset || 0) * 24 * 60 * 60 * 1000);
        
        onAddTask({
          title: templateTask.title,
          description: templateTask.description,
          deadline: taskDeadline,
          priority: templateTask.priority,
          estimatedDuration: templateTask.estimatedDuration,
          category: templateTask.category,
          bufferBefore: templateTask.bufferBefore,
          bufferAfter: templateTask.bufferAfter,
          allowSplitting: templateTask.allowSplitting,
          splitDuration: templateTask.splitDuration,
          projectId: editingProject.id,
          taskTypeId: templateTask.taskTypeId,
          dependencies: templateTask.dependencies || [],
        });
      });
    } else {
      // Création d'un nouveau projet
      const tempProjectId = `temp-project-${Date.now()}`;
      
      onAddProject({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate,
        deadline: formData.deadline,
        color: formData.color,
      });

      // Créer les tâches du projet (l'ID sera assigné automatiquement par useTasks)
      setTimeout(() => {
        const newProject = projects.find(p => p.title === formData.title.trim());
        if (newProject) {
          projectTasks.forEach(templateTask => {
            const taskDeadline = new Date(formData.startDate.getTime() + (templateTask.dayOffset || 0) * 24 * 60 * 60 * 1000);
            
            onAddTask({
              title: templateTask.title,
              description: templateTask.description,
              deadline: taskDeadline,
              priority: templateTask.priority,
              estimatedDuration: templateTask.estimatedDuration,
              category: templateTask.category,
              bufferBefore: templateTask.bufferBefore,
              bufferAfter: templateTask.bufferAfter,
              allowSplitting: templateTask.allowSplitting,
              splitDuration: templateTask.splitDuration,
              projectId: newProject.id,
              taskTypeId: templateTask.taskTypeId,
              dependencies: templateTask.dependencies || [],
            });
          });
        }
      }, 100);
    }

    resetForm();
    setIsFormOpen(false);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      startDate: project.startDate,
      deadline: project.deadline,
      color: project.color || '#3B82F6',
    });
    setProjectTasks([]);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Projets</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nouveau projet
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingProject ? 'Modifier le projet' : 'Créer un nouveau projet'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du projet *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nom du projet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du projet"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProjectDatePicker
                date={formData.startDate}
                onDateChange={(date) => date && setFormData({ ...formData, startDate: date })}
                label="Date de début"
                placeholder="Sélectionner la date de début"
              />

              <ProjectDatePicker
                date={formData.deadline}
                onDateChange={(date) => date && setFormData({ ...formData, deadline: date })}
                label="Date de fin"
                placeholder="Sélectionner la date de fin"
              />
            </div>

            <ProjectTaskManager
              tasks={projectTasks}
              onTasksChange={setProjectTasks}
            />

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={!formData.title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingProject ? 'Mettre à jour' : 'Créer le projet'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Aucun projet pour le moment</p>
            <p className="text-sm">Créez votre premier projet pour commencer</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                    {project.completed && (
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Terminé
                      </span>
                    )}
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 mb-3">{project.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>Début: {formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>Fin: {formatDate(project.deadline)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifier le projet"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer le projet"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
