
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

  const scheduleAllTasks = useCallback(async (tasks: Task[], events: Event[]): Promise<Task[]> => {
    if (!settings.autoSchedule) {
      console.log('📴 Planification automatique désactivée');
      return tasks;
    }

    console.log('🤖 Démarrage de la planification automatique...');
    setIsScheduling(true);

    try {
      const scheduledTasks = scheduleTasksAutomatically(tasks, events, {
        workingHours: settings.workingHours,
        bufferBetweenTasks: settings.bufferBetweenTasks,
        allowWeekends: settings.allowWeekends
      });

      console.log('✅ Planification terminée');
      return scheduledTasks;
    } catch (error) {
      console.error('❌ Erreur lors de la planification:', error);
      return tasks;
    } finally {
      setIsScheduling(false);
    }
  }, [settings]);

  const rescheduleAllTasks = useCallback(async (tasks: Task[], events: Event[]): Promise<Task[]> => {
    if (!settings.autoSchedule) {
      console.log('📴 Replanification automatique désactivée');
      return tasks;
    }

    console.log('🔄 Démarrage de la replanification AMÉLIORÉE pour tâches en retard/du jour...');
    setIsScheduling(true);

    try {
      // Séparer les tâches par statut
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const tasksToReschedule = tasks.filter(task => {
        if (task.completed) return false;
        
        // Détecter les tâches en cours (démarrées mais pas terminées)
        if (task.scheduledStart && task.scheduledEnd) {
          const taskStart = new Date(task.scheduledStart);
          const taskEnd = new Date(task.scheduledEnd);
          const isInProgress = now >= taskStart && now <= taskEnd;
          if (isInProgress) {
            console.log(`🔒 Tâche en cours protégée: ${task.title}`);
            return false; // Ne pas replanifier les tâches en cours
          }
        }
        
        return true;
      });

      console.log(`📊 Analyse des tâches à replanifier:`, {
        total: tasks.length,
        toReschedule: tasksToReschedule.length,
        completed: tasks.filter(t => t.completed).length,
        inProgress: tasks.length - tasksToReschedule.length - tasks.filter(t => t.completed).length
      });

      // Utiliser des paramètres plus flexibles pour la replanification
      const flexibleSettings = {
        workingHours: {
          start: "08:00", // Commencer plus tôt
          end: "20:00"    // Finir plus tard
        },
        bufferBetweenTasks: 10, // Réduire le buffer
        allowWeekends: true     // Autoriser les weekends
      };

      console.log('⚙️ Utilisation de paramètres flexibles pour la replanification:', flexibleSettings);

      const rescheduledTasks = rescheduleAfterEventChange(tasksToReschedule, events, flexibleSettings);

      // Fusionner avec les tâches non modifiées
      const finalTasks = tasks.map(originalTask => {
        const rescheduledTask = rescheduledTasks.find(rt => rt.id === originalTask.id);
        return rescheduledTask || originalTask;
      });

      const updatedCount = rescheduledTasks.filter(rt => {
        const original = tasks.find(t => t.id === rt.id);
        return original && (
          original.scheduledStart !== rt.scheduledStart ||
          original.scheduledEnd !== rt.scheduledEnd
        );
      }).length;

      console.log(`✅ Replanification flexible terminée - ${updatedCount} tâche(s) replanifiée(s)`);
      return finalTasks;

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
