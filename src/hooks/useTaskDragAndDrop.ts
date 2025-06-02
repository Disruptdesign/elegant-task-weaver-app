
import { useState, useRef, useCallback, useEffect } from 'react';
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

  const currentDragState = useRef(dragState);
  
  // Maintenir une référence à jour du state
  useEffect(() => {
    currentDragState.current = dragState;
  }, [dragState]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const state = currentDragState.current;
    console.log('Mouse move event triggered', state);
    
    if (!state.taskId || !state.startTime || !onUpdateTask) {
      console.log('Early return from mousemove - missing data', { 
        taskId: state.taskId, 
        startTime: state.startTime,
        hasUpdateFunction: !!onUpdateTask 
      });
      return;
    }

    const deltaY = e.clientY - state.startY;
    const minutesDelta = Math.round((deltaY / 64) * 60); // 64px = 1 heure
    
    console.log('Delta calculation:', { deltaY, minutesDelta });

    if (state.isDragging) {
      console.log('Processing drag movement');
      // Déplacer la tâche
      const newStartTime = new Date(state.startTime.getTime() + minutesDelta * 60000);
      
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
        taskId: state.taskId, 
        newStartTime, 
        originalDuration: state.originalDuration 
      });

      onUpdateTask(state.taskId, {
        scheduledStart: newStartTime,
        scheduledEnd: new Date(newStartTime.getTime() + state.originalDuration * 60000),
      });
    } else if (state.isResizing) {
      console.log('Processing resize');
      // Redimensionner la tâche
      let newDuration = state.originalDuration;
      
      if (state.resizeHandle === 'bottom') {
        newDuration = Math.max(15, state.originalDuration + minutesDelta);
      } else if (state.resizeHandle === 'top') {
        newDuration = Math.max(15, state.originalDuration - minutesDelta);
        if (newDuration !== state.originalDuration) {
          const newStartTime = new Date(state.startTime.getTime() + (state.originalDuration - newDuration) * 60000);
          
          console.log('Updating task resize (top):', { 
            taskId: state.taskId, 
            newStartTime, 
            newDuration 
          });
          
          onUpdateTask(state.taskId, {
            scheduledStart: newStartTime,
            scheduledEnd: new Date(newStartTime.getTime() + newDuration * 60000),
            estimatedDuration: newDuration,
          });
          return;
        }
      }

      if (newDuration !== state.originalDuration) {
        console.log('Updating task resize (bottom):', { 
          taskId: state.taskId, 
          newDuration 
        });
        
        onUpdateTask(state.taskId, {
          estimatedDuration: newDuration,
          scheduledEnd: new Date(state.startTime.getTime() + newDuration * 60000),
        });
      }
    }
  }, [onUpdateTask]);

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

    // Supprimer les event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    console.log('Event listeners removed');
  }, [handleMouseMove]);

  const startDrag = useCallback((
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

    // Ajouter les event listeners immédiatement
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    
    console.log('Event listeners added');
  }, [handleMouseMove, handleMouseUp, onUpdateTask]);

  // Cleanup automatique sur unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    dragState,
    startDrag,
  };
}
