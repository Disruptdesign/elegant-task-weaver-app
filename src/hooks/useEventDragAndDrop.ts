
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Event } from '../types/task';

interface EventDragState {
  isDragging: boolean;
  isResizing: boolean;
  eventId: string | null;
  startY: number;
  startX: number;
  startTime: Date | null;
  originalDuration: number;
  resizeHandle: 'top' | 'bottom' | null;
  originalDay: Date | null;
}

export function useEventDragAndDrop(
  onUpdateEvent: (id: string, updates: Partial<Event>) => void
) {
  const [dragState, setDragState] = useState<EventDragState>({
    isDragging: false,
    isResizing: false,
    eventId: null,
    startY: 0,
    startX: 0,
    startTime: null,
    originalDuration: 0,
    resizeHandle: null,
    originalDay: null,
  });

  const dragStateRef = useRef(dragState);
  const onUpdateEventRef = useRef(onUpdateEvent);

  // Garder les refs à jour
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    onUpdateEventRef.current = onUpdateEvent;
  }, [onUpdateEvent]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    const updateEvent = onUpdateEventRef.current;
    
    if (!currentState.eventId || !currentState.startTime || !updateEvent) {
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

      const newEndTime = new Date(newStartTime.getTime() + currentState.originalDuration * 60000);

      console.log('Updating event position:', { 
        eventId: currentState.eventId, 
        newStartTime: newStartTime.toISOString(),
        newEndTime: newEndTime.toISOString()
      });

      updateEvent(currentState.eventId, {
        startDate: newStartTime,
        endDate: newEndTime,
      });
      
    } else if (currentState.isResizing) {
      const deltaY = e.clientY - currentState.startY;
      const minutesDelta = Math.round((deltaY / 64) * 60);
      
      let newDuration = currentState.originalDuration;
      
      if (currentState.resizeHandle === 'bottom') {
        const rawDuration = currentState.originalDuration + minutesDelta;
        newDuration = Math.max(15, Math.round(rawDuration / 15) * 15);
      } else if (currentState.resizeHandle === 'top') {
        const rawDuration = currentState.originalDuration - minutesDelta;
        newDuration = Math.max(15, Math.round(rawDuration / 15) * 15);
        if (newDuration !== currentState.originalDuration) {
          const newStartTime = new Date(currentState.startTime.getTime() + (currentState.originalDuration - newDuration) * 60000);
          const newEndTime = new Date(newStartTime.getTime() + newDuration * 60000);
          
          updateEvent(currentState.eventId, {
            startDate: newStartTime,
            endDate: newEndTime,
          });
          return;
        }
      }

      if (newDuration !== currentState.originalDuration) {
        const newEndTime = new Date(currentState.startTime.getTime() + newDuration * 60000);
        
        updateEvent(currentState.eventId, {
          endDate: newEndTime,
        });
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    console.log('Event mouse up: cleaning up drag state');
    
    setDragState({
      isDragging: false,
      isResizing: false,
      eventId: null,
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
    event: Event,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Starting event drag operation:', { 
      action, 
      eventId: event.id, 
      eventTitle: event.title,
      resizeHandle,
      mousePosition: { x: e.clientX, y: e.clientY }
    });

    if (event.allDay) {
      console.log('All-day event cannot be dragged, aborting');
      return;
    }

    if (!onUpdateEvent) {
      console.log('No update function provided, aborting drag');
      return;
    }

    const duration = (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60);

    const newDragState = {
      isDragging: action === 'move',
      isResizing: action === 'resize',
      eventId: event.id,
      startY: e.clientY,
      startX: e.clientX,
      startTime: new Date(event.startDate),
      originalDuration: duration,
      resizeHandle: resizeHandle || null,
      originalDay: new Date(event.startDate),
    };

    console.log('Setting event drag state:', newDragState);
    setDragState(newDragState);

    // Nettoyer les anciens listeners avant d'ajouter les nouveaux
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = action === 'move' ? 'grabbing' : (resizeHandle === 'top' ? 'n-resize' : 's-resize');
    
    console.log('Event listeners added');
  }, [handleMouseMove, handleMouseUp, onUpdateEvent]);

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
