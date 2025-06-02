
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Task } from '../types/task';

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  taskId: string | null;
  startY: number;
  startX: number;
  startTime: Date | null;
  originalDuration: number;
  resizeHandle: 'top' | 'bottom' | null;
  originalDay: Date | null;
}

export function useTaskDragAndDrop(
  onUpdateTask: (id: string, updates: Partial<Task>) => void
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    taskId: null,
    startY: 0,
    startX: 0,
    startTime: null,
    originalDuration: 0,
    resizeHandle: null,
    originalDay: null,
  });

  const dragStateRef = useRef(dragState);
  const onUpdateTaskRef = useRef(onUpdateTask);

  // Garder les refs à jour
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    onUpdateTaskRef.current = onUpdateTask;
  }, [onUpdateTask]);

  const snapToQuarterHour = (duration: number): number => {
    return Math.round(duration / 15) * 15;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    const updateTask = onUpdateTaskRef.current;
    
    if (!currentState.taskId || !currentState.startTime || !updateTask) {
      return;
    }

    if (currentState.isDragging) {
      const deltaY = e.clientY - currentState.startY;
      const deltaX = e.clientX - currentState.startX;
      
      const minutesDelta = Math.round((deltaY / 64) * 60);
      const daysDelta = Math.round(deltaX / 150);

      let newStartTime = new Date(currentState.startTime.getTime() + minutesDelta * 60000);
      
      if (daysDelta !== 0) {
        newStartTime = new Date(newStartTime.getTime() + daysDelta * 24 * 60 * 60 * 1000);
      }
      
      const minute = newStartTime.getMinutes();
      const roundedMinutes = Math.round(minute / 15) * 15;
      newStartTime.setMinutes(roundedMinutes, 0, 0);

      console.log('Updating task position:', { 
        taskId: currentState.taskId, 
        newStartTime: newStartTime.toISOString(),
        daysDelta
      });

      updateTask(currentState.taskId, {
        scheduledStart: newStartTime,
        scheduledEnd: new Date(newStartTime.getTime() + currentState.originalDuration * 60000),
      });
      
    } else if (currentState.isResizing) {
      const deltaY = e.clientY - currentState.startY;
      const minutesDelta = Math.round((deltaY / 64) * 60);
      
      let newDuration = currentState.originalDuration;
      
      if (currentState.resizeHandle === 'bottom') {
        const rawDuration = currentState.originalDuration + minutesDelta;
        newDuration = Math.max(15, snapToQuarterHour(rawDuration));
      } else if (currentState.resizeHandle === 'top') {
        const rawDuration = currentState.originalDuration - minutesDelta;
        newDuration = Math.max(15, snapToQuarterHour(rawDuration));
        if (newDuration !== currentState.originalDuration) {
          const newStartTime = new Date(currentState.startTime.getTime() + (currentState.originalDuration - newDuration) * 60000);
          
          updateTask(currentState.taskId, {
            scheduledStart: newStartTime,
            scheduledEnd: new Date(newStartTime.getTime() + newDuration * 60000),
            estimatedDuration: newDuration,
          });
          return;
        }
      }

      if (newDuration !== currentState.originalDuration) {
        updateTask(currentState.taskId, {
          estimatedDuration: newDuration,
          scheduledEnd: new Date(currentState.startTime.getTime() + newDuration * 60000),
        });
      }
    }
  }, [snapToQuarterHour]);

  const handleMouseUp = useCallback(() => {
    console.log('Mouse up: cleaning up drag state');
    
    setDragState({
      isDragging: false,
      isResizing: false,
      taskId: null,
      startY: 0,
      startX: 0,
      startTime: null,
      originalDuration: 0,
      resizeHandle: null,
      originalDay: null,
    });

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
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

    console.log('Starting drag operation:', { 
      action, 
      taskId: task.id, 
      taskTitle: task.title,
      resizeHandle,
      hasScheduledStart: !!task.scheduledStart,
      mousePosition: { x: e.clientX, y: e.clientY }
    });

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
      startX: e.clientX,
      startTime: new Date(task.scheduledStart),
      originalDuration: task.estimatedDuration,
      resizeHandle: resizeHandle || null,
      originalDay: new Date(task.scheduledStart),
    };

    console.log('Setting drag state:', newDragState);
    setDragState(newDragState);

    // Nettoyer les anciens listeners avant d'ajouter les nouveaux
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = action === 'move' ? 'grabbing' : (resizeHandle === 'top' ? 'n-resize' : 's-resize');
    
    console.log('Event listeners added');
  }, [handleMouseMove, handleMouseUp, onUpdateTask]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    dragState,
    startDrag,
  };
}
