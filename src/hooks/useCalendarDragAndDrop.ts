
import { useDragAndDrop } from './useDragAndDrop';
import { Task, Event } from '../types/task';

export function useCalendarDragAndDrop(
  onUpdateTask: (id: string, updates: Partial<Task>) => void,
  onUpdateEvent: (id: string, updates: Partial<Event>) => void
) {
  const { dragState, startDrag } = useDragAndDrop({
    onUpdateTask,
    onUpdateEvent,
  });

  console.log('CalendarDragAndDrop: Hook initialized', {
    dragState,
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
    startDrag(e, task, 'task', action, resizeHandle);
  };

  const startEventDrag = (
    e: React.MouseEvent,
    event: Event,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom'
  ) => {
    console.log('Starting event drag:', { eventId: event.id, action, resizeHandle });
    startDrag(e, event, 'event', action, resizeHandle);
  };

  return {
    dragState,
    startTaskDrag,
    startEventDrag,
  };
}
