import { useState, useEffect, useCallback } from 'react';
import { Task, Event, InboxItem, Project, TaskType, ProjectTemplate, TemplateTask } from '../types/task';
import { useAlgorithmicScheduler } from './useAlgorithmicScheduler';

export interface UseTasksReturn {
  tasks: Task[];
  events: Event[];
  inboxItems: InboxItem[];
  projects: Project[];
  taskTypes: TaskType[];
  projectTemplates: ProjectTemplate[];
  filter: string;
  setFilter: (filter: string) => void;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => void;
  deleteInboxItem: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTaskType: (taskType: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskType: (id: string, updates: Partial<TaskType>) => void;
  deleteTaskType: (id: string) => void;
  addProjectTemplate: (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProjectTemplate: (id: string, updates: Partial<ProjectTemplate>) => void;
  deleteProjectTemplate: (id: string) => void;
  createProjectFromTemplate: (templateId: string, projectData: { title: string; description?: string; startDate: Date; deadline: Date }) => void;
}

// Helper function to safely parse JSON from localStorage
const parseStoredData = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    
    // Vérification supplémentaire pour éviter les données corrompues
    if (!Array.isArray(parsed)) {
      console.warn(`❌ Données corrompues détectées pour ${key}, réinitialisation`);
      localStorage.removeItem(key);
      return defaultValue;
    }
    
    // Limiter le nombre d'éléments pour éviter les problèmes de performance
    if (parsed.length > 1000) {
      console.warn(`⚠️ Trop d'éléments dans ${key} (${parsed.length}), nettoyage automatique`);
      localStorage.removeItem(key);
      return defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    localStorage.removeItem(key);
    return defaultValue;
  }
};

// Helper function to safely parse dates
const parseDate = (date: any): Date => {
  if (date instanceof Date) return date;
  try {
    return new Date(date);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

// Helper function to create initial demo data
const createInitialData = () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  
  const demoTasks: Task[] = [
    {
      id: 'demo-task-1',
      title: 'Tâche de démonstration',
      description: 'Cette tâche sert à tester l\'affichage',
      deadline: tomorrow,
      priority: 'medium',
      estimatedDuration: 60,
      scheduledStart: nextHour,
      scheduledEnd: new Date(nextHour.getTime() + 60 * 60 * 1000),
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-task-2',
      title: 'Tâche urgente',
      description: 'Une tâche avec priorité haute',
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      priority: 'high',
      estimatedDuration: 90,
      scheduledStart: new Date(nextHour.getTime() + 2 * 60 * 60 * 1000),
      scheduledEnd: new Date(nextHour.getTime() + 3.5 * 60 * 60 * 1000),
      completed: false,
      createdAt: now,
      updatedAt: now,
    }
  ];

  const demoEvents: Event[] = [
    {
      id: 'demo-event-1',
      title: 'Réunion de démonstration',
      description: 'Événement pour tester l\'affichage',
      startDate: new Date(nextHour.getTime() + 3 * 60 * 60 * 1000),
      endDate: new Date(nextHour.getTime() + 4 * 60 * 60 * 1000),
      allDay: false,
      markAsBusy: true,
      location: 'Bureau',
      createdAt: now,
      updatedAt: now,
    }
  ];

  return { demoTasks, demoEvents };
};

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isInitialized, setIsInitialized] = useState(false);

  // Ajouter le planificateur algorithmique
  const { scheduleAllTasks, rescheduleAllTasks, isScheduling } = useAlgorithmicScheduler();

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('=== DÉBUT DU CHARGEMENT DES DONNÉES (NETTOYÉ) ===');
    
    try {
      // Tasks - avec nettoyage automatique
      const savedTasks = parseStoredData<any>('tasks', []);
      console.log('Tâches sauvegardées trouvées:', savedTasks.length);
      
      if (savedTasks.length > 0 && savedTasks.length < 100) { // Limite raisonnable
        const parsedTasks = savedTasks.map((task: any) => ({
          ...task,
          deadline: parseDate(task.deadline),
          scheduledStart: task.scheduledStart ? parseDate(task.scheduledStart) : undefined,
          scheduledEnd: task.scheduledEnd ? parseDate(task.scheduledEnd) : undefined,
          canStartFrom: task.canStartFrom ? parseDate(task.canStartFrom) : undefined,
          createdAt: parseDate(task.createdAt),
          updatedAt: parseDate(task.updatedAt),
        }));
        setTasks(parsedTasks);
        console.log('✅ Tâches chargées depuis localStorage:', parsedTasks.length);
      } else {
        console.log('❌ Réinitialisation avec données de démo propres');
        const { demoTasks } = createInitialData();
        setTasks(demoTasks);
        localStorage.setItem('tasks', JSON.stringify(demoTasks));
        console.log('✅ Tâches de démo créées et sauvegardées:', demoTasks.length);
      }

      // Events - avec nettoyage automatique
      const savedEvents = parseStoredData<any>('events', []);
      console.log('Événements sauvegardés trouvés:', savedEvents.length);
      
      if (savedEvents.length > 0 && savedEvents.length < 100) { // Limite raisonnable
        const parsedEvents = savedEvents.map((event: any) => ({
          ...event,
          startDate: parseDate(event.startDate),
          endDate: parseDate(event.endDate),
          createdAt: parseDate(event.createdAt),
          updatedAt: parseDate(event.updatedAt),
        }));
        setEvents(parsedEvents);
        console.log('✅ Événements chargés depuis localStorage:', parsedEvents.length);
      } else {
        console.log('❌ Réinitialisation avec données de démo propres');
        const { demoEvents } = createInitialData();
        setEvents(demoEvents);
        localStorage.setItem('events', JSON.stringify(demoEvents));
        console.log('✅ Événements de démo créés et sauvegardés:', demoEvents.length);
      }

      // Inbox Items
      const savedInboxItems = parseStoredData<any>('inboxItems', []);
      if (savedInboxItems.length > 0) {
        const parsedInboxItems = savedInboxItems.map((item: any) => ({
          ...item,
          createdAt: parseDate(item.createdAt),
        }));
        setInboxItems(parsedInboxItems);
        console.log('✅ Éléments inbox chargés:', parsedInboxItems.length);
      }

      // Projects - Enhanced debugging
      const savedProjects = parseStoredData<any>('projects', []);
      console.log('🔍 Projects from localStorage:', {
        found: savedProjects.length,
        rawData: savedProjects
      });
      
      if (savedProjects.length > 0) {
        const parsedProjects = savedProjects.map((project: any) => ({
          ...project,
          startDate: parseDate(project.startDate),
          deadline: parseDate(project.deadline),
          createdAt: parseDate(project.createdAt),
          updatedAt: parseDate(project.updatedAt),
        }));
        setProjects(parsedProjects);
        console.log('✅ Projets chargés et traités:', {
          count: parsedProjects.length,
          projects: parsedProjects.map(p => ({ id: p.id, title: p.title }))
        });
      } else {
        console.log('❌ Aucun projet trouvé dans localStorage');
      }

      // Task Types - Enhanced debugging
      const savedTaskTypes = parseStoredData<any>('taskTypes', []);
      console.log('🔍 TaskTypes from localStorage:', {
        found: savedTaskTypes.length,
        rawData: savedTaskTypes
      });
      
      if (savedTaskTypes.length > 0) {
        setTaskTypes(savedTaskTypes);
        console.log('✅ Types de tâches chargés et traités:', {
          count: savedTaskTypes.length,
          taskTypes: savedTaskTypes.map(t => ({ id: t.id, name: t.name }))
        });
      } else {
        console.log('❌ Aucun type de tâche trouvé dans localStorage');
      }

      // Project Templates
      const savedTemplates = parseStoredData<any>('projectTemplates', []);
      console.log('🔍 ProjectTemplates from localStorage:', {
        found: savedTemplates.length,
        rawData: savedTemplates
      });
      
      if (savedTemplates.length > 0) {
        const parsedTemplates = savedTemplates.map((template: any) => ({
          ...template,
          createdAt: parseDate(template.createdAt),
          updatedAt: parseDate(template.updatedAt),
        }));
        setProjectTemplates(parsedTemplates);
        console.log('✅ Modèles de projets chargés:', {
          count: parsedTemplates.length,
          templates: parsedTemplates.map(t => ({ id: t.id, name: t.name }))
        });
      } else {
        console.log('❌ Aucun modèle de projet trouvé dans localStorage');
      }

      // Filter
      const savedFilter = localStorage.getItem('taskFilter') || 'all';
      setFilter(savedFilter);
      
      setIsInitialized(true);
      console.log('=== FIN DU CHARGEMENT DES DONNÉES (NETTOYÉ) ===');
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      // Nettoyage complet en cas d'erreur
      localStorage.clear();
      const { demoTasks, demoEvents } = createInitialData();
      setTasks(demoTasks);
      setEvents(demoEvents);
      localStorage.setItem('tasks', JSON.stringify(demoTasks));
      localStorage.setItem('events', JSON.stringify(demoEvents));
      console.log('✅ Nettoyage complet et données de démo créées');
      setIsInitialized(true);
    }
  }, []);

  // Save data to localStorage when it changes (but only after initialization)
  useEffect(() => {
    if (isInitialized && tasks.length >= 0) {
      try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('💾 Tâches sauvegardées:', tasks.length);
      } catch (error) {
        console.error('❌ Erreur sauvegarde tâches:', error);
      }
    }
  }, [tasks, isInitialized]);

  useEffect(() => {
    if (isInitialized && events.length >= 0) {
      try {
        localStorage.setItem('events', JSON.stringify(events));
        console.log('💾 Événements sauvegardés:', events.length);
      } catch (error) {
        console.error('❌ Erreur sauvegarde événements:', error);
      }
    }
  }, [events, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('inboxItems', JSON.stringify(inboxItems));
        console.log('💾 Éléments inbox sauvegardés:', inboxItems.length);
      } catch (error) {
        console.error('❌ Erreur sauvegarde inbox:', error);
      }
    }
  }, [inboxItems, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('projects', JSON.stringify(projects));
        console.log('💾 Projets sauvegardés:', projects.length);
      } catch (error) {
        console.error('❌ Erreur sauvegarde projets:', error);
      }
    }
  }, [projects, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
        console.log('💾 Types de tâches sauvegardés:', taskTypes.length);
      } catch (error) {
        console.error('❌ Erreur sauvegarde types:', error);
      }
    }
  }, [taskTypes, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('projectTemplates', JSON.stringify(projectTemplates));
        console.log('💾 Modèles de projets sauvegardés:', projectTemplates.length);
      } catch (error) {
        console.error('❌ Erreur sauvegarde modèles:', error);
      }
    }
  }, [projectTemplates, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('taskFilter', filter);
        console.log('💾 Filtre sauvegardé:', filter);
      } catch (error) {
        console.error('❌ Erreur sauvegarde filtre:', error);
      }
    }
  }, [filter, isInitialized]);

  // Fonction pour déclencher la planification automatique
  const triggerAutoScheduling = useCallback(async () => {
    if (!isInitialized || isScheduling) return;
    
    console.log('🎯 Déclenchement de la planification automatique');
    const scheduledTasks = await scheduleAllTasks(tasks, events);
    
    // Mettre à jour uniquement si il y a des changements
    const hasChanges = scheduledTasks.some((task, index) => {
      const originalTask = tasks[index];
      return originalTask && (
        task.scheduledStart?.getTime() !== originalTask.scheduledStart?.getTime() ||
        task.scheduledEnd?.getTime() !== originalTask.scheduledEnd?.getTime()
      );
    });

    if (hasChanges) {
      console.log('📅 Mise à jour des tâches avec nouvelle planification');
      setTasks(scheduledTasks);
    }
  }, [tasks, events, isInitialized, isScheduling, scheduleAllTasks]);

  // Déclencher la planification quand les tâches ou événements changent
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      triggerAutoScheduling();
    }, 1000); // Délai pour éviter trop d'appels

    return () => clearTimeout(timeoutId);
  }, [triggerAutoScheduling]);

  // Enhanced task creation with automatic scheduling
  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('➕ Ajout nouvelle tâche:', newTask.title, '- Planification automatique va se déclencher');
    setTasks(prev => {
      const updated = [...prev, newTask];
      console.log('📊 Total tâches après ajout:', updated.length);
      return updated;
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    console.log('✏️ Mise à jour tâche:', id, updates);
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    ));
  };

  const deleteTask = (id: string) => {
    console.log('🗑️ Suppression tâche:', id, '- Replanification va se déclencher');
    setTasks(prev => {
      const updated = prev.filter(task => task.id !== id);
      console.log('📊 Total tâches après suppression:', updated.length);
      return updated;
    });
  };

  const addEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('➕ Ajout nouvel événement:', newEvent.title, '- Replanification va se déclencher');
    setEvents(prev => {
      const updated = [...prev, newEvent];
      console.log('📊 Total événements après ajout:', updated.length);
      return updated;
    });
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    console.log('✏️ Mise à jour événement:', id, updates, '- Replanification va se déclencher');
    setEvents(prev => prev.map(event => 
      event.id === id 
        ? { ...event, ...updates, updatedAt: new Date() }
        : event
    ));
  };

  const deleteEvent = (id: string) => {
    console.log('🗑️ Suppression événement:', id, '- Replanification va se déclencher');
    setEvents(prev => {
      const updated = prev.filter(event => event.id !== id);
      console.log('📊 Total événements après suppression:', updated.length);
      return updated;
    });
  };

  const addInboxItem = (itemData: Omit<InboxItem, 'id' | 'createdAt'>) => {
    const newItem: InboxItem = {
      ...itemData,
      id: `inbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    
    console.log('Adding new inbox item:', newItem.title);
    setInboxItems(prev => [...prev, newItem]);
  };

  const deleteInboxItem = (id: string) => {
    console.log('Deleting inbox item:', id);
    setInboxItems(prev => prev.filter(item => item.id !== id));
  };

  const addProject = (projectData: Omit<Project, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Adding new project:', newProject.title);
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    console.log('Updating project:', id, updates);
    setProjects(prev => prev.map(project => 
      project.id === id 
        ? { ...project, ...updates, updatedAt: new Date() }
        : project
    ));
  };

  const deleteProject = (id: string) => {
    console.log('Deleting project:', id);
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const addTaskType = (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTaskType: TaskType = {
      ...taskTypeData,
      id: `tasktype-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Adding new task type:', newTaskType.name);
    setTaskTypes(prev => [...prev, newTaskType]);
  };

  const updateTaskType = (id: string, updates: Partial<TaskType>) => {
    console.log('Updating task type:', id, updates);
    setTaskTypes(prev => prev.map(taskType => 
      taskType.id === id 
        ? { ...taskType, ...updates, updatedAt: new Date() }
        : taskType
    ));
  };

  const deleteTaskType = (id: string) => {
    console.log('Deleting task type:', id);
    setTaskTypes(prev => prev.filter(taskType => taskType.id !== id));
  };

  const addProjectTemplate = (templateData: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: ProjectTemplate = {
      ...templateData,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Adding new project template:', newTemplate.name);
    setProjectTemplates(prev => [...prev, newTemplate]);
  };

  const updateProjectTemplate = (id: string, updates: Partial<ProjectTemplate>) => {
    console.log('Updating project template:', id, updates);
    setProjectTemplates(prev => prev.map(template => 
      template.id === id 
        ? { ...template, ...updates, updatedAt: new Date() }
        : template
    ));
  };

  const deleteProjectTemplate = (id: string) => {
    console.log('Deleting project template:', id);
    setProjectTemplates(prev => prev.filter(template => template.id !== id));
  };

  const createProjectFromTemplate = (
    templateId: string, 
    projectData: { title: string; description?: string; startDate: Date; deadline: Date }
  ) => {
    const template = projectTemplates.find(t => t.id === templateId);
    if (!template) {
      console.error('Template not found:', templateId);
      return;
    }

    console.log('Creating project from template:', template.name);

    // Créer le projet
    const newProject: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: projectData.title,
      description: projectData.description,
      startDate: projectData.startDate,
      deadline: projectData.deadline,
      color: template.color,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProjects(prev => [...prev, newProject]);

    // Créer les tâches du template
    const newTasks: Task[] = template.tasks.map(templateTask => {
      const taskDeadline = new Date(projectData.startDate.getTime() + (templateTask.dayOffset || 0) * 24 * 60 * 60 * 1000);
      
      return {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: templateTask.title,
        description: templateTask.description,
        deadline: taskDeadline,
        priority: templateTask.priority,
        estimatedDuration: templateTask.estimatedDuration,
        completed: false,
        category: templateTask.category,
        bufferBefore: templateTask.bufferBefore,
        bufferAfter: templateTask.bufferAfter,
        allowSplitting: templateTask.allowSplitting,
        splitDuration: templateTask.splitDuration,
        projectId: newProject.id,
        taskTypeId: templateTask.taskTypeId,
        dependencies: [], // Les dépendances seront gérées après
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Mapper les dépendances du template vers les nouvelles tâches
    const taskIdMapping = new Map<string, string>();
    template.tasks.forEach((templateTask, index) => {
      taskIdMapping.set(templateTask.id, newTasks[index].id);
    });

    newTasks.forEach((task, index) => {
      const templateTask = template.tasks[index];
      if (templateTask.dependencies && templateTask.dependencies.length > 0) {
        task.dependencies = templateTask.dependencies
          .map(depId => taskIdMapping.get(depId))
          .filter(Boolean) as string[];
      }
    });

    setTasks(prev => [...prev, ...newTasks]);
    console.log(`Created project "${newProject.title}" with ${newTasks.length} tasks from template`);
  };

  // Enhanced debug final state
  console.log('🔍 État final useTasks (NETTOYÉ):', { 
    tasks: tasks.length, 
    events: events.length,
    projects: {
      count: projects.length,
      details: projects.map(p => ({ id: p.id, title: p.title }))
    },
    taskTypes: {
      count: taskTypes.length,
      details: taskTypes.map(t => ({ id: t.id, name: t.name }))
    },
    tasksWithSchedule: tasks.filter(t => t.scheduledStart).length,
    eventsToday: events.filter(e => new Date(e.startDate).toDateString() === new Date().toDateString()).length,
    isInitialized,
    isScheduling
  });

  return {
    tasks,
    events,
    inboxItems,
    projects,
    taskTypes,
    projectTemplates,
    filter,
    setFilter,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addInboxItem,
    deleteInboxItem,
    addProject,
    updateProject,
    deleteProject,
    addTaskType,
    updateTaskType,
    deleteTaskType,
    addProjectTemplate,
    updateProjectTemplate,
    deleteProjectTemplate,
    createProjectFromTemplate,
  };
}
