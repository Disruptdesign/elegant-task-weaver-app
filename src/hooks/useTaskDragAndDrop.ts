
import React, { useState, useCallback, useRef } from 'react';
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
      isResizing: currentState.isResizing,
      clientX: e.clientX,
      clientY: e.clientY
    });

    if (!currentState.taskId || !currentState.startTime || !updateTask) {
      console.log('Mouse move: missing required data, skipping');
      return;
    }

    if (currentState.isDragging) {
      // Déplacer la tâche - calcul basé sur la position de la souris
      const deltaY = e.clientY - currentState.startY;
      const deltaX = e.clientX - currentState.startX;
      
      // Calculer le changement de temps basé sur deltaY (64px = 1 heure)
      const minutesDelta = Math.round((deltaY / 64) * 60);
      
      // Calculer le changement de jour basé sur deltaX (environ 200px = 1 jour)
      const daysDelta = Math.round(deltaX / 200);
      
      console.log('Drag calculation:', { deltaY, deltaX, minutesDelta, daysDelta });

      // Calculer la nouvelle heure de début
      let newStartTime = new Date(currentState.startTime.getTime() + minutesDelta * 60000);
      
      // Ajouter le changement de jour
      if (daysDelta !== 0) {
        newStartTime = new Date(newStartTime.getTime() + daysDelta * 24 * 60 * 60 * 1000);
      }
      
      // Arrondir aux créneaux de 15 minutes
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
      // Redimensionner la tâche
      const deltaY = e.clientY - currentState.startY;
      const minutesDelta = Math.round((deltaY / 64) * 60);
      
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
      startX: 0,
      startTime: null,
      originalDuration: 0,
      resizeHandle: null,
      originalDay: null,
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
      hasScheduledStart: !!task.scheduledStart,
      mousePosition: { x: e.clientX, y: e.clientY }
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
      startX: e.clientX,
      startTime: new Date(task.scheduledStart),
      originalDuration: task.estimatedDuration,
      resizeHandle: resizeHandle || null,
      originalDay: new Date(task.scheduledStart),
    };

    console.log('Setting drag state:', newDragState);
    setDragState(newDragState);

    // Ajouter les event listeners sur le document pour capturer les mouvements partout
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    
    // Empêcher la sélection de texte pendant le drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = action === 'move' ? 'grabbing' : (resizeHandle === 'top' ? 'n-resize' : 's-resize');
    
    console.log('Event listeners added');
  }, [handleMouseMove, handleMouseUp]);

  // Nettoyer le style quand le drag se termine
  const cleanupDragStyle = useCallback(() => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  // Nettoyer quand le composant se démonte
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      cleanupDragStyle();
    };
  }, [handleMouseMove, handleMouseUp, cleanupDragStyle]);

  // Nettoyer le style quand le drag se termine
  React.useEffect(() => {
    if (!dragState.isDragging && !dragState.isResizing) {
      cleanupDragStyle();
    }
  }, [dragState.isDragging, dragState.isResizing, cleanupDragStyle]);

  return {
    dragState,
    startDrag,
  };
}
