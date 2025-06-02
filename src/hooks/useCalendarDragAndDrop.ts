
import { useTaskDragAndDrop } from './useTaskDragAndDrop';
import { useEventDragAndDrop } from './useEventDragAndDrop';
import { Task, Event } from '../types/task';

export function useCalendarDragAndDrop(
  onUpdateTask: (id: string, updates: Partial<Task>) => void,
  onUpdateEvent: (id: string, updates: Partial<Event>) => void
) {
  const taskDragDrop = useTaskDragAndDrop(onUpdateTask);
  const eventDragDrop = useEventDragAndDrop(onUpdateEvent);

  console.log('CalendarDragAndDrop: Hooks initialized', {
    taskDragState: taskDragDrop.dragState,
    eventDragState: eventDragDrop.dragState,
    onUpdateTask: !!onUpdateTask,
    onUpdateEvent: !!onUpdateEvent
  });

  const startTaskDrag = (
    e: React.MouseEvent,
    task: Task,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom'
  ) => {
    console.log('Starting task drag:', { taskId: task.id, action, resizeHandle });
    taskDragDrop.startDrag(e, task, action, resizeHandle);
  };

  const startEventDrag = (
    e: React.MouseEvent,
    event: Event,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom'
  ) => {
    console.log('Starting event drag:', { eventId: event.id, action, resizeHandle });
    eventDragDrop.startDrag(e, event, action, resizeHandle);
  };

  return {
    taskDragState: taskDragDrop.dragState,
    eventDragState: eventDragDrop.dragState,
    startTaskDrag,
    startEventDrag,
  };
}
