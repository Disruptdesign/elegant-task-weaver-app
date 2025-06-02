
import { useState, useCallback, useRef, useEffect } from 'react';

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  itemId: string | null;
  itemType: 'task' | 'event' | null;
  startY: number;
  startX: number;
  startTime: Date | null;
  originalDuration: number;
  resizeHandle: 'top' | 'bottom' | null;
}

interface DragCallbacks {
  onUpdateTask?: (id: string, updates: any) => void;
  onUpdateEvent?: (id: string, updates: any) => void;
}

export function useDragAndDrop(callbacks: DragCallbacks) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    itemId: null,
    itemType: null,
    startY: 0,
    startX: 0,
    startTime: null,
    originalDuration: 0,
    resizeHandle: null,
  });

  const dragStateRef = useRef(dragState);
  const callbacksRef = useRef(callbacks);

  // Garder les refs à jour
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const snapToQuarterHour = useCallback((duration: number): number => {
    return Math.round(duration / 15) * 15;
  }, []);

  const cleanupDrag = useCallback(() => {
    console.log('Cleaning up drag state');
    setDragState({
      isDragging: false,
      isResizing: false,
      itemId: null,
      itemType: null,
      startY: 0,
      startX: 0,
      startTime: null,
      originalDuration: 0,
      resizeHandle: null,
    });

    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    const currentCallbacks = callbacksRef.current;
    
    if (!currentState.itemId || !currentState.startTime) {
      return;
    }

    const deltaY = e.clientY - currentState.startY;
    const deltaX = e.clientX - currentState.startX;
    
    if (currentState.isDragging) {
      // Déplacement
      const minutesDelta = Math.round((deltaY / 64) * 60);
      const daysDelta = Math.round(deltaX / 150);

      let newStartTime = new Date(currentState.startTime.getTime() + minutesDelta * 60000);
      
      if (daysDelta !== 0) {
        newStartTime = new Date(newStartTime.getTime() + daysDelta * 24 * 60 * 60 * 1000);
      }
      
      const minute = newStartTime.getMinutes();
      const roundedMinutes = Math.round(minute / 15) * 15;
      newStartTime.setMinutes(roundedMinutes, 0, 0);

      if (currentState.itemType === 'task' && currentCallbacks.onUpdateTask) {
        currentCallbacks.onUpdateTask(currentState.itemId, {
          scheduledStart: newStartTime,
          scheduledEnd: new Date(newStartTime.getTime() + currentState.originalDuration * 60000),
        });
      } else if (currentState.itemType === 'event' && currentCallbacks.onUpdateEvent) {
        const newEndTime = new Date(newStartTime.getTime() + currentState.originalDuration * 60000);
        currentCallbacks.onUpdateEvent(currentState.itemId, {
          startDate: newStartTime,
          endDate: newEndTime,
        });
      }
      
    } else if (currentState.isResizing) {
      // Redimensionnement
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
          
          if (currentState.itemType === 'task' && currentCallbacks.onUpdateTask) {
            currentCallbacks.onUpdateTask(currentState.itemId, {
              scheduledStart: newStartTime,
              scheduledEnd: new Date(newStartTime.getTime() + newDuration * 60000),
              estimatedDuration: newDuration,
            });
          } else if (currentState.itemType === 'event' && currentCallbacks.onUpdateEvent) {
            const newEndTime = new Date(newStartTime.getTime() + newDuration * 60000);
            currentCallbacks.onUpdateEvent(currentState.itemId, {
              startDate: newStartTime,
              endDate: newEndTime,
            });
          }
          return;
        }
      }

      if (newDuration !== currentState.originalDuration) {
        if (currentState.itemType === 'task' && currentCallbacks.onUpdateTask) {
          currentCallbacks.onUpdateTask(currentState.itemId, {
            estimatedDuration: newDuration,
            scheduledEnd: new Date(currentState.startTime.getTime() + newDuration * 60000),
          });
        } else if (currentState.itemType === 'event' && currentCallbacks.onUpdateEvent) {
          const newEndTime = new Date(currentState.startTime.getTime() + newDuration * 60000);
          currentCallbacks.onUpdateEvent(currentState.itemId, {
            endDate: newEndTime,
          });
        }
      }
    }
  }, [snapToQuarterHour]);

  const handleMouseUp = useCallback(() => {
    console.log('Mouse up - cleaning up');
    cleanupDrag();
    
    // Nettoyer les event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [cleanupDrag, handleMouseMove]);

  const startDrag = useCallback((
    e: React.MouseEvent,
    item: any,
    itemType: 'task' | 'event',
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Starting drag:', { action, itemType, itemId: item.id });

    // Vérifications
    if (itemType === 'task' && !item.scheduledStart) {
      console.log('Task has no scheduled start time, aborting');
      return;
    }

    if (itemType === 'event' && item.allDay) {
      console.log('All-day event cannot be dragged, aborting');
      return;
    }

    const startTime = itemType === 'task' ? new Date(item.scheduledStart) : new Date(item.startDate);
    const duration = itemType === 'task' 
      ? item.estimatedDuration 
      : (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60);

    const newDragState = {
      isDragging: action === 'move',
      isResizing: action === 'resize',
      itemId: item.id,
      itemType,
      startY: e.clientY,
      startX: e.clientX,
      startTime,
      originalDuration: duration,
      resizeHandle: resizeHandle || null,
    };

    console.log('Setting drag state:', newDragState);
    setDragState(newDragState);

    // Nettoyer les anciens event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Ajouter les nouveaux event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = action === 'move' ? 'grabbing' : (resizeHandle === 'top' ? 'n-resize' : 's-resize');
    
    console.log('Event listeners added');
  }, [handleMouseMove, handleMouseUp]);

  // Nettoyage lors du démontage
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
