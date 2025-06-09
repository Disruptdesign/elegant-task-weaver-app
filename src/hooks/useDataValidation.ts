
import { Task, Event, Project } from '../types/task';

export function useDataValidation() {
  const validateAndLogData = (tasks: Task[], events: Event[], projects: Project[]) => {
    const tasksWithProjects = tasks.filter(t => t.projectId);
    const tasksWithDependencies = tasks.filter(t => t.dependencies?.length);
    const scheduledTasks = tasks.filter(t => t.scheduledStart);
    
    console.log('📊 État détaillé des données de l\'application:', {
      tasks: tasks.length,
      events: events.length,
      projects: projects.length,
      tasksWithProjects: tasksWithProjects.length,
      tasksWithDependencies: tasksWithDependencies.length,
      scheduledTasks: scheduledTasks.length,
      taskTitles: tasks.map(t => t.title),
      projectTitles: projects.map(p => p.title),
      eventTitles: events.map(e => e.title)
    });

    if (tasksWithProjects.length > 0) {
      console.log('📋 Tâches avec projets:', tasksWithProjects.map(t => ({
        taskTitle: t.title,
        projectId: t.projectId,
        hasScheduledStart: !!t.scheduledStart
      })));
    }

    // Vérifier les références de projet invalides
    const projectIds = new Set(projects.map(p => p.id));
    const tasksWithInvalidProject = tasks.filter(t => t.projectId && !projectIds.has(t.projectId));
    
    if (tasksWithInvalidProject.length > 0) {
      console.warn('⚠️ Tâches avec projet invalide:', tasksWithInvalidProject.map(t => ({ 
        id: t.id, 
        title: t.title, 
        invalidProjectId: t.projectId 
      })));
    }

    // Vérifier les dépendances invalides
    const taskIds = new Set(tasks.map(t => t.id));
    tasks.forEach(task => {
      if (task.dependencies) {
        const invalidDeps = task.dependencies.filter(depId => !taskIds.has(depId));
        if (invalidDeps.length > 0) {
          console.warn(`⚠️ Dépendances invalides dans ${task.title}:`, invalidDeps);
        }
      }
    });

    return {
      isValid: tasksWithInvalidProject.length === 0,
      issues: {
        invalidProjectReferences: tasksWithInvalidProject.length,
        totalTasks: tasks.length,
        totalProjects: projects.length
      }
    };
  };

  return { validateAndLogData };
}
