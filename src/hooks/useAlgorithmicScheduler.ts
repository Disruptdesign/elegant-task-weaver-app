
import { useState, useCallback } from 'react';
import { Task, Event } from '../types/task';
import { AlgorithmicScheduler } from '../utils/scheduling/AlgorithmicScheduler';
import { mergeSchedulingOptions } from '../utils/scheduling/SchedulingOptions';

interface SchedulerSettings {
  autoSchedule: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  bufferBetweenTasks: number;
  allowWeekends: boolean;
}

const DEFAULT_SETTINGS: SchedulerSettings = {
  autoSchedule: true,
  workingHours: {
    start: "09:00",
    end: "18:00"
  },
  bufferBetweenTasks: 15,
  allowWeekends: false
};

export function useAlgorithmicScheduler() {
  const [settings, setSettings] = useState<SchedulerSettings>(DEFAULT_SETTINGS);
  const [isScheduling, setIsScheduling] = useState(false);

  const scheduleAllTasks = useCallback(async (tasks: Task[], events: Event[], projects: any[] = []): Promise<Task[]> => {
    if (!settings.autoSchedule) {
      console.log('📴 Planification automatique désactivée');
      return tasks;
    }

    console.log('🤖 Démarrage de la planification automatique avec contraintes projet...', {
      tasksCount: tasks.length,
      eventsCount: events.length,
      projectsCount: projects.length
    });
    setIsScheduling(true);

    try {
      const options = mergeSchedulingOptions({
        workingHours: settings.workingHours,
        bufferBetweenTasks: settings.bufferBetweenTasks,
        allowWeekends: settings.allowWeekends
      });

      const scheduler = new AlgorithmicScheduler(events, options, projects);
      const scheduledTasks = scheduler.scheduleTasks(tasks, false);

      console.log('✅ Planification terminée avec respect des contraintes projet');
      return scheduledTasks;
    } catch (error) {
      console.error('❌ Erreur lors de la planification:', error);
      return tasks;
    } finally {
      setIsScheduling(false);
    }
  }, [settings]);

  const rescheduleAllTasks = useCallback(async (
    tasks: Task[], 
    events: Event[], 
    projects: any[] = [],
    customSettings?: Partial<SchedulerSettings>
  ): Promise<Task[]> => {
    const effectiveSettings = customSettings ? { ...settings, ...customSettings } : settings;
    
    if (!effectiveSettings.autoSchedule) {
      console.log('📴 Replanification automatique désactivée');
      return tasks;
    }

    console.log('🔄 Démarrage de la replanification AGGRESSIVE avec contraintes projet ET préservation des contraintes canStartFrom...', {
      tasksCount: tasks.length,
      eventsCount: events.length,
      projectsCount: projects.length
    });
    setIsScheduling(true);

    try {
      const options = mergeSchedulingOptions({
        workingHours: effectiveSettings.workingHours,
        bufferBetweenTasks: effectiveSettings.bufferBetweenTasks,
        allowWeekends: effectiveSettings.allowWeekends
      });

      const rescheduledTasks = AlgorithmicScheduler.rescheduleAll(tasks, events, options, projects);

      console.log('✅ Replanification aggressive terminée - contraintes canStartFrom PRÉSERVÉES et contraintes projet appliquées');
      return rescheduledTasks;
    } catch (error) {
      console.error('❌ Erreur lors de la replanification:', error);
      return tasks;
    } finally {
      setIsScheduling(false);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<SchedulerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    console.log('⚙️ Paramètres du planificateur mis à jour:', newSettings);
  }, []);

  return {
    settings,
    isScheduling,
    scheduleAllTasks,
    rescheduleAllTasks,
    updateSettings
  };
}
