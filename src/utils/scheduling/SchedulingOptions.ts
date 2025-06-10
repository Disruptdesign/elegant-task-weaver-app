
import { SchedulingOptions } from '../../types/scheduling';

export const DEFAULT_SCHEDULING_OPTIONS: SchedulingOptions = {
  workingHours: {
    start: "09:00",
    end: "18:00"
  },
  bufferBetweenTasks: 15,
  maxTasksPerDay: 8,
  allowWeekends: false
};

export function mergeSchedulingOptions(
  options: Partial<SchedulingOptions> = {}
): SchedulingOptions {
  return { ...DEFAULT_SCHEDULING_OPTIONS, ...options };
}
