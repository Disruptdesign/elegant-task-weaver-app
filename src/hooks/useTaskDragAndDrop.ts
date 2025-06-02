
import { useState, useRef } from 'react';
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

  const startDrag = (
    e: React.MouseEvent,
    task: Task,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!task.scheduledStart) return;

    setDragState({
      isDragging: action === 'move',
      isResizing: action === 'resize',
      taskId: task.id,
      startY: e.clientY,
      startTime: new Date(task.scheduledStart),
      originalDuration: task.estimatedDuration,
      resizeHandle: resizeHandle || null,
    });

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.taskId || !dragState.startTime) return;

    const deltaY = e.clientY - dragState.startY;
    const minutesDelta = Math.round((deltaY / 64) * 60); // 64px = 1 heure

    if (dragState.isDragging) {
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

      onUpdateTask(dragState.taskId, {
        scheduledStart: newStartTime,
        scheduledEnd: new Date(newStartTime.getTime() + dragState.originalDuration * 60000),
      });
    } else if (dragState.isResizing) {
      // Redimensionner la tâche
      let newDuration = dragState.originalDuration;
      
      if (dragState.resizeHandle === 'bottom') {
        newDuration = Math.max(15, dragState.originalDuration + minutesDelta);
      } else if (dragState.resizeHandle === 'top') {
        newDuration = Math.max(15, dragState.originalDuration - minutesDelta);
        if (newDuration !== dragState.originalDuration) {
          const newStartTime = new Date(dragState.startTime.getTime() + (dragState.originalDuration - newDuration) * 60000);
          onUpdateTask(dragState.taskId, {
            scheduledStart: newStartTime,
            scheduledEnd: new Date(newStartTime.getTime() + newDuration * 60000),
            estimatedDuration: newDuration,
          });
          return;
        }
      }

      if (newDuration !== dragState.originalDuration) {
        onUpdateTask(dragState.taskId, {
          estimatedDuration: newDuration,
          scheduledEnd: new Date(dragState.startTime.getTime() + newDuration * 60000),
        });
      }
    }
  };

  const handleMouseUp = () => {
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
  };

  return {
    dragState,
    startDrag,
  };
}
