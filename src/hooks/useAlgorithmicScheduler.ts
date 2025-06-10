
import { useState, useCallback } from 'react';
import { Task, Event } from '../types/task';
import { scheduleTasksAutomatically, rescheduleAfterEventChange } from '../utils/algorithmicScheduler';

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

    console.log('🤖 Démarrage de la planification automatique avec contraintes projet...');
    setIsScheduling(true);

    try {
      const scheduledTasks = scheduleTasksAutomatically(tasks, events, {
        workingHours: settings.workingHours,
        bufferBetweenTasks: settings.bufferBetweenTasks,
        allowWeekends: settings.allowWeekends
      }, projects);

      console.log('✅ Planification terminée avec respect des contraintes projet');
      return scheduledTasks;
    } catch (error) {
      console.error('❌ Erreur lors de la planification:', error);
      return tasks;
    } finally {
      setIsScheduling(false);
    }
  }, [settings]);

  // Version flexible qui accepte des paramètres optionnels pour être utilisée depuis d'autres composants
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

    console.log('🔄 Démarrage de la replanification AGGRESSIVE avec contraintes projet ET préservation des contraintes canStartFrom...');
    setIsScheduling(true);

    try {
      const rescheduledTasks = rescheduleAfterEventChange(tasks, events, {
        workingHours: effectiveSettings.workingHours,
        bufferBetweenTasks: effectiveSettings.bufferBetweenTasks,
        allowWeekends: effectiveSettings.allowWeekends
      }, projects);

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
