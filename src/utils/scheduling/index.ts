
// Export des classes principales
export { AlgorithmicScheduler } from './AlgorithmicScheduler';
export { TaskConstraintResolver } from './TaskConstraintResolver';
export { DependencyResolver } from './DependencyResolver';
export { TaskScheduler } from './TaskScheduler';
export { TimeSlotManager } from './TimeSlotManager';
export { DEFAULT_SCHEDULING_OPTIONS, mergeSchedulingOptions } from './SchedulingOptions';

// Export des fonctions utilitaires pour rétrocompatibilité
import { AlgorithmicScheduler } from './AlgorithmicScheduler';
import { mergeSchedulingOptions } from './SchedulingOptions';

export function scheduleTasksAutomatically(
  tasks: any[], 
  events: any[], 
  options?: any,
  projects: any[] = []
): any[] {
  console.log('🔄 scheduleTasksAutomatically appelée avec:', {
    tasks: tasks.length,
    events: events.length,
    projects: projects.length
  });
  
  const mergedOptions = mergeSchedulingOptions(options);
  const scheduler = new AlgorithmicScheduler(events, mergedOptions, projects);
  return scheduler.scheduleTasks(tasks, false);
}

export function rescheduleAfterEventChange(
  tasks: any[], 
  events: any[], 
  options?: any,
  projects: any[] = []
): any[] {
  console.log('🔄 rescheduleAfterEventChange appelée avec:', {
    tasks: tasks.length,
    events: events.length,
    projects: projects.length
  });
  console.log('🔄 REPLANIFICATION BIDIRECTIONNELLE avec préservation ABSOLUE des contraintes canStartFrom');
  
  const mergedOptions = mergeSchedulingOptions(options);
  return AlgorithmicScheduler.rescheduleAll(tasks, events, mergedOptions, projects);
}
