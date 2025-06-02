
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

// Fonction utilitaire pour normaliser les dates et préserver les timezones
const normalizeEventDate = (date: Date | string): Date => {
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date instanceof Date ? date : new Date(date);
};

// Fonction pour créer une nouvelle date en préservant la timezone originale
const preserveTimezone = (originalDate: Date | string, newTime: number): Date => {
  const original = normalizeEventDate(originalDate);
  const newDate = new Date(newTime);
  
  // Préserver les informations de timezone en gardant le même offset
  const originalOffset = original.getTimezoneOffset();
  const newOffset = newDate.getTimezoneOffset();
  
  if (originalOffset !== newOffset) {
    // Ajuster pour maintenir la même heure locale
    const offsetDiff = (newOffset - originalOffset) * 60 * 1000;
    return new Date(newTime + offsetDiff);
  }
  
  return newDate;
};

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

      // Utiliser preserveTimezone pour maintenir la timezone originale
      let newStartTime = preserveTimezone(
        currentState.startTime, 
        currentState.startTime.getTime() + minutesDelta * 60000
      );
      
      if (daysDelta !== 0) {
        newStartTime = preserveTimezone(
          newStartTime, 
          newStartTime.getTime() + daysDelta * 24 * 60 * 60 * 1000
        );
      }
      
      // Arrondir aux 15 minutes en préservant la timezone
      const minute = newStartTime.getMinutes();
      const roundedMinutes = Math.round(minute / 15) * 15;
      const adjustedTime = new Date(newStartTime);
      adjustedTime.setMinutes(roundedMinutes, 0, 0);
      
      const finalStartTime = preserveTimezone(currentState.startTime, adjustedTime.getTime());
      const newEndTime = preserveTimezone(
        currentState.startTime, 
        finalStartTime.getTime() + currentState.originalDuration * 60000
      );

      console.log('Updating event position (timezone preserved):', { 
        eventId: currentState.eventId, 
        originalStart: currentState.startTime.toISOString(),
        newStartTime: finalStartTime.toISOString(),
        newEndTime: newEndTime.toISOString(),
        minutesDelta,
        daysDelta
      });

      updateEvent(currentState.eventId, {
        startDate: finalStartTime,
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
          const adjustmentMs = (currentState.originalDuration - newDuration) * 60000;
          const newStartTime = preserveTimezone(
            currentState.startTime, 
            currentState.startTime.getTime() + adjustmentMs
          );
          const newEndTime = preserveTimezone(
            currentState.startTime, 
            newStartTime.getTime() + newDuration * 60000
          );
          
          console.log('Resizing event from top (timezone preserved):', {
            eventId: currentState.eventId,
            originalDuration: currentState.originalDuration,
            newDuration,
            newStartTime: newStartTime.toISOString(),
            newEndTime: newEndTime.toISOString()
          });
          
          updateEvent(currentState.eventId, {
            startDate: newStartTime,
            endDate: newEndTime,
          });
          return;
        }
      }

      if (newDuration !== currentState.originalDuration) {
        const newEndTime = preserveTimezone(
          currentState.startTime, 
          currentState.startTime.getTime() + newDuration * 60000
        );
        
        console.log('Resizing event from bottom (timezone preserved):', {
          eventId: currentState.eventId,
          originalDuration: currentState.originalDuration,
          newDuration,
          newEndTime: newEndTime.toISOString()
        });
        
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

    console.log('Starting event drag operation (timezone aware):', { 
      action, 
      eventId: event.id, 
      eventTitle: event.title,
      resizeHandle,
      originalStartDate: event.startDate,
      originalEndDate: event.endDate,
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

    // Normaliser les dates en préservant la timezone
    const startTime = normalizeEventDate(event.startDate);
    const endTime = normalizeEventDate(event.endDate);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    console.log('Event drag setup (normalized):', {
      originalStart: event.startDate,
      originalEnd: event.endDate,
      normalizedStart: startTime.toISOString(),
      normalizedEnd: endTime.toISOString(),
      duration
    });

    const newDragState = {
      isDragging: action === 'move',
      isResizing: action === 'resize',
      eventId: event.id,
      startY: e.clientY,
      startX: e.clientX,
      startTime: startTime,
      originalDuration: duration,
      resizeHandle: resizeHandle || null,
      originalDay: startTime,
    };

    console.log('Setting event drag state (timezone preserved):', newDragState);
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
