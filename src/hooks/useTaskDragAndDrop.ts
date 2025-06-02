
import { useState, useRef, useCallback } from 'react';
import { Task } from '../types/task';

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  taskId: string | null;
  startY: number;
  startTime: Date | null;
  originalDuration: number;
  resizeHandle: 'top' | 'bottom' | null;
}

export function useTaskDragAndDrop(
  onUpdateTask: (id: string, updates: Partial<Task>) => void
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    taskId: null,
    startY: 0,
    startTime: null,
    originalDuration: 0,
    resizeHandle: null,
  });

  const dragRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    console.log('Mouse move event triggered', dragState);
    
    if (!dragState.taskId || !dragState.startTime || !onUpdateTask) {
      console.log('Early return from mousemove - missing data', { 
        taskId: dragState.taskId, 
        startTime: dragState.startTime,
        hasUpdateFunction: !!onUpdateTask 
      });
      return;
    }

    const deltaY = e.clientY - dragState.startY;
    const minutesDelta = Math.round((deltaY / 64) * 60); // 64px = 1 heure
    
    console.log('Delta calculation:', { deltaY, minutesDelta });

    if (dragState.isDragging) {
      console.log('Processing drag movement');
      // Déplacer la tâche
      const newStartTime = new Date(dragState.startTime.getTime() + minutesDelta * 60000);
      
      // Contraindre aux heures de travail (9h-18h)
      const hour = newStartTime.getHours();
      const minute = newStartTime.getMinutes();
      
      if (hour < 9) {
        newStartTime.setHours(9, 0, 0, 0);
      } else if (hour >= 18) {
        newStartTime.setHours(17, 30, 0, 0);
      }

      // Arrondir aux créneaux de 30 minutes
      const roundedMinutes = Math.round(minute / 30) * 30;
      newStartTime.setMinutes(roundedMinutes, 0, 0);

      console.log('Updating task position:', { 
        taskId: dragState.taskId, 
        newStartTime, 
        originalDuration: dragState.originalDuration 
      });

      onUpdateTask(dragState.taskId, {
        scheduledStart: newStartTime,
        scheduledEnd: new Date(newStartTime.getTime() + dragState.originalDuration * 60000),
      });
    } else if (dragState.isResizing) {
      console.log('Processing resize');
      // Redimensionner la tâche
      let newDuration = dragState.originalDuration;
      
      if (dragState.resizeHandle === 'bottom') {
        newDuration = Math.max(15, dragState.originalDuration + minutesDelta);
      } else if (dragState.resizeHandle === 'top') {
        newDuration = Math.max(15, dragState.originalDuration - minutesDelta);
        if (newDuration !== dragState.originalDuration) {
          const newStartTime = new Date(dragState.startTime.getTime() + (dragState.originalDuration - newDuration) * 60000);
          
          console.log('Updating task resize (top):', { 
            taskId: dragState.taskId, 
            newStartTime, 
            newDuration 
          });
          
          onUpdateTask(dragState.taskId, {
            scheduledStart: newStartTime,
            scheduledEnd: new Date(newStartTime.getTime() + newDuration * 60000),
            estimatedDuration: newDuration,
          });
          return;
        }
      }

      if (newDuration !== dragState.originalDuration) {
        console.log('Updating task resize (bottom):', { 
          taskId: dragState.taskId, 
          newDuration 
        });
        
        onUpdateTask(dragState.taskId, {
          estimatedDuration: newDuration,
          scheduledEnd: new Date(dragState.startTime.getTime() + newDuration * 60000),
        });
      }
    }
  }, [dragState, onUpdateTask]);

  const handleMouseUp = useCallback(() => {
    console.log('Mouse up event triggered, cleaning up drag state');
    
    setDragState({
      isDragging: false,
      isResizing: false,
      taskId: null,
      startY: 0,
      startTime: null,
      originalDuration: 0,
      resizeHandle: null,
    });

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    console.log('Event listeners removed');
  }, [handleMouseMove]);

  const startDrag = (
    e: React.MouseEvent,
    task: Task,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Starting drag operation:', { action, taskId: task.id, resizeHandle });

    if (!task.scheduledStart) {
      console.log('Task has no scheduled start time, aborting drag');
      return;
    }

    if (!onUpdateTask) {
      console.log('No update function provided, aborting drag');
      return;
    }

    const newDragState = {
      isDragging: action === 'move',
      isResizing: action === 'resize',
      taskId: task.id,
      startY: e.clientY,
      startTime: new Date(task.scheduledStart),
      originalDuration: task.estimatedDuration,
      resizeHandle: resizeHandle || null,
    };

    console.log('Setting drag state:', newDragState);
    setDragState(newDragState);

    // Ajouter les event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    console.log('Event listeners added');
  };

  // Cleanup sur unmount
  const cleanup = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  return {
    dragState,
    startDrag,
    cleanup,
  };
}
