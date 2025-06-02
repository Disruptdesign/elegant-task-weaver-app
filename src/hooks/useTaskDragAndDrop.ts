
import { useState, useCallback, useRef } from 'react';
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

  // Utiliser useRef pour éviter la recréation des fonctions
  const dragStateRef = useRef(dragState);
  const onUpdateTaskRef = useRef(onUpdateTask);

  // Mettre à jour les refs à chaque render
  dragStateRef.current = dragState;
  onUpdateTaskRef.current = onUpdateTask;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    const updateTask = onUpdateTaskRef.current;
    
    console.log('Mouse move event triggered', { 
      taskId: currentState.taskId, 
      isDragging: currentState.isDragging,
      isResizing: currentState.isResizing 
    });

    if (!currentState.taskId || !currentState.startTime || !updateTask) {
      console.log('Mouse move: missing required data, skipping');
      return;
    }

    const deltaY = e.clientY - currentState.startY;
    const minutesDelta = Math.round((deltaY / 64) * 60); // 64px = 1 heure
    
    console.log('Mouse move calculation:', { deltaY, minutesDelta });

    if (currentState.isDragging) {
      // Déplacer la tâche
      const newStartTime = new Date(currentState.startTime.getTime() + minutesDelta * 60000);
      
      // Contraindre aux heures de travail (9h-18h)
      const hour = newStartTime.getHours();
      
      if (hour < 9) {
        newStartTime.setHours(9, 0, 0, 0);
      } else if (hour >= 18) {
        newStartTime.setHours(17, 30, 0, 0);
      }

      // Arrondir aux créneaux de 30 minutes
      const minute = newStartTime.getMinutes();
      const roundedMinutes = Math.round(minute / 30) * 30;
      newStartTime.setMinutes(roundedMinutes, 0, 0);

      console.log('Updating task position:', { 
        taskId: currentState.taskId, 
        newStartTime: newStartTime.toISOString() 
      });

      updateTask(currentState.taskId, {
        scheduledStart: newStartTime,
        scheduledEnd: new Date(newStartTime.getTime() + currentState.originalDuration * 60000),
      });
    } else if (currentState.isResizing) {
      // Redimensionner la tâche
      let newDuration = currentState.originalDuration;
      
      if (currentState.resizeHandle === 'bottom') {
        newDuration = Math.max(15, currentState.originalDuration + minutesDelta);
      } else if (currentState.resizeHandle === 'top') {
        newDuration = Math.max(15, currentState.originalDuration - minutesDelta);
        if (newDuration !== currentState.originalDuration) {
          const newStartTime = new Date(currentState.startTime.getTime() + (currentState.originalDuration - newDuration) * 60000);
          
          console.log('Updating task resize (top):', { 
            taskId: currentState.taskId, 
            newStartTime: newStartTime.toISOString(),
            newDuration 
          });
          
          updateTask(currentState.taskId, {
            scheduledStart: newStartTime,
            scheduledEnd: new Date(newStartTime.getTime() + newDuration * 60000),
            estimatedDuration: newDuration,
          });
          return;
        }
      }

      if (newDuration !== currentState.originalDuration) {
        console.log('Updating task resize (bottom):', { 
          taskId: currentState.taskId, 
          newDuration 
        });
        
        updateTask(currentState.taskId, {
          estimatedDuration: newDuration,
          scheduledEnd: new Date(currentState.startTime.getTime() + newDuration * 60000),
        });
      }
    }
  }, []); // Pas de dépendances pour éviter la recréation

  const handleMouseUp = useCallback(() => {
    console.log('Mouse up: cleaning up drag state');
    
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
  }, [handleMouseMove]); // Dépendance stable

  const startDrag = useCallback((
    e: React.MouseEvent,
    task: Task,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Starting drag operation:', { 
      action, 
      taskId: task.id, 
      taskTitle: task.title,
      resizeHandle,
      hasScheduledStart: !!task.scheduledStart 
    });

    if (!task.scheduledStart) {
      console.log('Task has no scheduled start time, aborting drag');
      return;
    }

    if (!onUpdateTaskRef.current) {
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
  }, [handleMouseMove, handleMouseUp]);

  return {
    dragState,
    startDrag,
  };
}
