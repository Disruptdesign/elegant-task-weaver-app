
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

  console.log('📅 CalendarDragAndDrop: Hook initialized', {
    dragState: {
      isDragging: dragState.isDragging,
      isResizing: dragState.isResizing,
      itemId: dragState.itemId,
      action: dragState.action
    },
    hasCallbacks: { 
      onUpdateTask: !!onUpdateTask, 
      onUpdateEvent: !!onUpdateEvent 
    }
  });

  const startTaskDrag = (
    e: React.MouseEvent,
    task: Task,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom',
    onTaskClick?: () => void
  ) => {
    console.log('📋 Starting task drag:', { 
      taskId: task.id, 
      title: task.title,
      action, 
      resizeHandle,
      hasScheduledStart: !!task.scheduledStart,
      projectId: task.projectId || 'none'
    });
    
    if (!task.scheduledStart) {
      console.warn('⚠️ Cannot drag task without scheduled start time');
      return;
    }
    
    startDrag(e, task, 'task', action, resizeHandle, onTaskClick);
  };

  const startEventDrag = (
    e: React.MouseEvent,
    event: Event,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom',
    onEventClick?: () => void
  ) => {
    console.log('📅 Starting event drag:', { 
      eventId: event.id, 
      title: event.title,
      action, 
      resizeHandle,
      isAllDay: event.allDay
    });
    
    if (event.allDay) {
      console.warn('⚠️ Cannot drag all-day event');
      return;
    }
    
    startDrag(e, event, 'event', action, resizeHandle, onEventClick);
  };

  return {
    dragState,
    startTaskDrag,
    startEventDrag,
  };
}
