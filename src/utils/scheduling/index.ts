
export { AlgorithmicScheduler } from './AlgorithmicScheduler';
export { TaskConstraintResolver } from './TaskConstraintResolver';
export { DependencyResolver } from './DependencyResolver';
export { TaskScheduler } from './TaskScheduler';
export { TimeSlotManager } from './TimeSlotManager';
export { DEFAULT_SCHEDULING_OPTIONS, mergeSchedulingOptions } from './SchedulingOptions';

// Export utility functions for backward compatibility
export function scheduleTasksAutomatically(
  tasks: any[], 
  events: any[], 
  options?: any,
  projects: any[] = []
): any[] {
  const { AlgorithmicScheduler } = require('./AlgorithmicScheduler');
  const scheduler = new AlgorithmicScheduler(events, options, projects);
  return scheduler.scheduleTasks(tasks, false);
}

export function rescheduleAfterEventChange(
  tasks: any[], 
  events: any[], 
  options?: any,
  projects: any[] = []
): any[] {
  console.log('🔄 REPLANIFICATION BIDIRECTIONNELLE avec préservation ABSOLUE des contraintes canStartFrom');
  const { AlgorithmicScheduler } = require('./AlgorithmicScheduler');
  return AlgorithmicScheduler.rescheduleAll(tasks, events, options, projects);
}
