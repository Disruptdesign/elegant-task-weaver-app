
import { useMemo } from 'react';
import { useTasks } from './useTasks';
import { usePerformanceCache } from './usePerformanceCache';

// Hook optimisé pour les tâches avec mise en cache
export const useOptimizedTasks = () => {
  const originalHook = useTasks();
  const { getCachedData } = usePerformanceCache();

  // Mémorisation des calculs coûteux
  const optimizedTasks = useMemo(() => {
    return getCachedData('tasks', () => originalHook.tasks);
  }, [originalHook.tasks, getCachedData]);

  const tasksByProject = useMemo(() => {
    return getCachedData('tasksByProject', () => {
      return optimizedTasks.reduce((acc: any, task: any) => {
        const projectId = task.projectId || 'no-project';
        if (!acc[projectId]) acc[projectId] = [];
        acc[projectId].push(task);
        return acc;
      }, {});
    });
  }, [optimizedTasks, getCachedData]);

  const completedTasksCount = useMemo(() => {
    return getCachedData('completedCount', () => {
      return optimizedTasks.filter((task: any) => task.completed).length;
    });
  }, [optimizedTasks, getCachedData]);

  const pendingTasksCount = useMemo(() => {
    return getCachedData('pendingCount', () => {
      return optimizedTasks.filter((task: any) => !task.completed).length;
    });
  }, [optimizedTasks, getCachedData]);

  return {
    ...originalHook,
    tasks: optimizedTasks,
    tasksByProject,
    completedTasksCount,
    pendingTasksCount
  };
};
