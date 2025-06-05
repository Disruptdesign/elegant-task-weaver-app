
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
  action: 'move' | 'resize';
}

interface DragCallbacks {
  onUpdateTask?: (id: string, updates: any) => Promise<void> | void;
  onUpdateEvent?: (id: string, updates: any) => Promise<void> | void;
}

const DRAG_THRESHOLD = 5;
const UPDATE_THROTTLE = 16; // ~60fps

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
    action: 'move',
  });

  const dragStateRef = useRef(dragState);
  const callbacksRef = useRef(callbacks);
  const pendingClickRef = useRef<(() => void) | null>(null);
  const hasDragStartedRef = useRef(false);
  const lastUpdateRef = useRef(0);
  const pendingUpdateRef = useRef<any>(null);

  // Maintenir les refs à jour
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const snapToQuarterHour = useCallback((duration: number): number => {
    return Math.max(15, Math.round(duration / 15) * 15);
  }, []);

  const cleanupDrag = useCallback(() => {
    console.log('🧹 Cleaning up drag state');
    
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
      action: 'move',
    });

    hasDragStartedRef.current = false;
    lastUpdateRef.current = 0;
    pendingUpdateRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  // Fonction throttlée pour les mises à jour
  const throttledUpdate = useCallback(async (updateData: any) => {
    const now = Date.now();
    
    if (now - lastUpdateRef.current < UPDATE_THROTTLE) {
      pendingUpdateRef.current = updateData;
      return;
    }

    lastUpdateRef.current = now;
    const currentState = dragStateRef.current;
    const currentCallbacks = callbacksRef.current;

    if (!currentState.itemId) return;

    try {
      if (currentState.itemType === 'task' && currentCallbacks.onUpdateTask) {
        await currentCallbacks.onUpdateTask(currentState.itemId, updateData);
      } else if (currentState.itemType === 'event' && currentCallbacks.onUpdateEvent) {
        await currentCallbacks.onUpdateEvent(currentState.itemId, updateData);
      }
    } catch (error) {
      console.error('Error updating item during drag:', error);
    }

    // Traiter la mise à jour en attente s'il y en a une
    if (pendingUpdateRef.current) {
      const pending = pendingUpdateRef.current;
      pendingUpdateRef.current = null;
      setTimeout(() => throttledUpdate(pending), UPDATE_THROTTLE);
    }
  }, []);

  const handleMouseMove = useCallback(async (e: MouseEvent) => {
    const currentState = dragStateRef.current;
    
    if (!currentState.itemId || !currentState.startTime) {
      return;
    }

    const deltaY = e.clientY - currentState.startY;
    const deltaX = e.clientX - currentState.startX;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!hasDragStartedRef.current && distance > DRAG_THRESHOLD) {
      console.log('🎯 Starting smooth drag operation:', currentState.action);
      hasDragStartedRef.current = true;
      pendingClickRef.current = null;
      
      setDragState(prev => ({
        ...prev,
        isDragging: prev.action === 'move',
        isResizing: prev.action === 'resize',
      }));

      document.body.style.userSelect = 'none';
      document.body.style.cursor = currentState.action === 'move' ? 'grabbing' : 
        (currentState.resizeHandle === 'top' ? 'n-resize' : 's-resize');
    }

    if (!hasDragStartedRef.current) {
      return;
    }
    
    if (currentState.action === 'move') {
      const minutesDelta = Math.round((deltaY / 64) * 60);
      const daysDelta = Math.round(deltaX / 150);

      let newStartTime = new Date(currentState.startTime.getTime() + minutesDelta * 60000);
      
      if (daysDelta !== 0) {
        newStartTime = new Date(newStartTime.getTime() + daysDelta * 24 * 60 * 60 * 1000);
      }
      
      // Snap to 15-minute intervals
      const minute = newStartTime.getMinutes();
      const roundedMinutes = Math.round(minute / 15) * 15;
      newStartTime.setMinutes(roundedMinutes, 0, 0);

      const updateData = currentState.itemType === 'task' ? {
        scheduledStart: newStartTime,
        scheduledEnd: new Date(newStartTime.getTime() + currentState.originalDuration * 60000),
      } : {
        startDate: newStartTime,
        endDate: new Date(newStartTime.getTime() + currentState.originalDuration * 60000),
      };

      throttledUpdate(updateData);
      
    } else if (currentState.action === 'resize') {
      const minutesDelta = Math.round((deltaY / 64) * 60);
      let newDuration = currentState.originalDuration;
      
      if (currentState.resizeHandle === 'bottom') {
        newDuration = snapToQuarterHour(currentState.originalDuration + minutesDelta);
      } else if (currentState.resizeHandle === 'top') {
        newDuration = snapToQuarterHour(currentState.originalDuration - minutesDelta);
        
        const newStartTime = new Date(currentState.startTime.getTime() + (currentState.originalDuration - newDuration) * 60000);
        
        const updateData = currentState.itemType === 'task' ? {
          scheduledStart: newStartTime,
          scheduledEnd: new Date(newStartTime.getTime() + newDuration * 60000),
          estimatedDuration: newDuration,
        } : {
          startDate: newStartTime,
          endDate: new Date(newStartTime.getTime() + newDuration * 60000),
        };

        throttledUpdate(updateData);
        return;
      }

      const updateData = currentState.itemType === 'task' ? {
        estimatedDuration: newDuration,
        scheduledEnd: new Date(currentState.startTime.getTime() + newDuration * 60000),
      } : {
        endDate: new Date(currentState.startTime.getTime() + newDuration * 60000),
      };

      throttledUpdate(updateData);
    }
  }, [snapToQuarterHour, throttledUpdate]);

  const handleMouseUp = useCallback(() => {
    console.log('🖱️ Mouse up - finalizing smooth drag operation');
    
    if (pendingClickRef.current && !hasDragStartedRef.current) {
      console.log('👆 Executing pending click');
      const clickHandler = pendingClickRef.current;
      pendingClickRef.current = null;
      setTimeout(() => clickHandler(), 0);
    }
    
    // Effectuer la dernière mise à jour en attente
    if (pendingUpdateRef.current) {
      const pending = pendingUpdateRef.current;
      pendingUpdateRef.current = null;
      throttledUpdate(pending);
    }
    
    cleanupDrag();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [cleanupDrag, handleMouseMove, throttledUpdate]);

  const startDrag = useCallback((
    e: React.MouseEvent,
    item: any,
    itemType: 'task' | 'event',
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom',
    onItemClick?: () => void
  ) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🚀 Initializing smooth drag:', { action, itemType, itemId: item.id, resizeHandle });

    if (itemType === 'task' && !item.scheduledStart) {
      console.log('❌ Task has no scheduled start time');
      return;
    }

    if (itemType === 'event' && item.allDay) {
      console.log('❌ All-day event cannot be dragged');
      return;
    }

    const startTime = itemType === 'task' ? new Date(item.scheduledStart) : new Date(item.startDate);
    const duration = itemType === 'task' 
      ? item.estimatedDuration 
      : (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60);

    if (onItemClick && action === 'move') {
      pendingClickRef.current = onItemClick;
    }

    hasDragStartedRef.current = false;
    lastUpdateRef.current = 0;
    pendingUpdateRef.current = null;
    
    setDragState({
      isDragging: false,
      isResizing: false,
      itemId: item.id,
      itemType,
      startY: e.clientY,
      startX: e.clientX,
      startTime,
      originalDuration: duration,
      resizeHandle: resizeHandle || null,
      action,
    });

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    
    console.log('✅ Smooth drag initialization complete');
  }, [handleMouseMove, handleMouseUp]);

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
