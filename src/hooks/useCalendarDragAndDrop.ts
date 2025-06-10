
import { useDragAndDrop } from './useDragAndDrop';
import { useUnifiedRescheduler } from './useUnifiedRescheduler';
import { Task, Event } from '../types/task';

export function useCalendarDragAndDrop(
  onUpdateTask: (id: string, updates: Partial<Task>) => void,
  onUpdateEvent: (id: string, updates: Partial<Event>) => void,
  tasks: Task[] = [],
  events: Event[] = [],
  projects: any[] = []
) {
  const { dragState, startDrag } = useDragAndDrop({
    onUpdateTask,
    onUpdateEvent,
  });

  const { performUnifiedReschedule, isScheduling } = useUnifiedRescheduler();

  console.log('📅 CalendarDragAndDrop: Hook initialized with unified rescheduler', {
    dragState: {
      isDragging: dragState.isDragging,
      isResizing: dragState.isResizing,
      itemId: dragState.itemId,
      action: dragState.action
    },
    hasCallbacks: { 
      onUpdateTask: !!onUpdateTask, 
      onUpdateEvent: !!onUpdateEvent 
    },
    tasksCount: tasks.length,
    eventsCount: events.length,
    projectsCount: projects.length
  });

  // Fonction de replanification unifiée qui respecte ABSOLUMENT les contraintes canStartFrom
  const rescheduleAllTasksWithConstraints = async () => {
    console.log('🔄 CALENDRIER: Replanification UNIFIÉE avec contraintes canStartFrom STRICTEMENT PRÉSERVÉES');
    console.log('📊 Données pour replanification calendrier:', {
      tasks: tasks.length,
      events: events.length,
      projects: projects.length
    });

    const onTasksUpdateForCalendar = (updatedTasks: Task[]) => {
      console.log('📅 CALENDRIER: Application des mises à jour depuis le calendrier');
      
      updatedTasks.forEach(task => {
        const originalTask = tasks.find(t => t.id === task.id);
        if (originalTask) {
          // Vérifier s'il y a des changements dans la planification
          const hasSchedulingChanges = 
            task.scheduledStart !== originalTask.scheduledStart ||
            task.scheduledEnd !== originalTask.scheduledEnd;
          
          if (hasSchedulingChanges) {
            console.log('🔄 CALENDRIER: Mise à jour tâche:', task.title, {
              avant: originalTask.scheduledStart ? new Date(originalTask.scheduledStart).toLocaleString() : 'non programmée',
              après: task.scheduledStart ? new Date(task.scheduledStart).toLocaleString() : 'non programmée',
              constraintRespected: task.canStartFrom ? 'contrainte canStartFrom VÉRIFIÉE' : 'aucune contrainte'
            });
            
            // VÉRIFICATION FINALE avant mise à jour
            if (task.canStartFrom && task.scheduledStart && new Date(task.scheduledStart) < new Date(task.canStartFrom)) {
              console.log('🚨 CALENDRIER: Violation détectée, correction forcée');
              const correctedStart = new Date(task.canStartFrom);
              const correctedEnd = new Date(correctedStart.getTime() + task.estimatedDuration * 60000);
              
              onUpdateTask(task.id, {
                scheduledStart: correctedStart,
                scheduledEnd: correctedEnd,
                canStartFrom: task.canStartFrom
              });
            } else {
              onUpdateTask(task.id, {
                scheduledStart: task.scheduledStart,
                scheduledEnd: task.scheduledEnd,
                canStartFrom: task.canStartFrom
              });
            }
          }
        }
      });
    };

    await performUnifiedReschedule(tasks, events, projects, onTasksUpdateForCalendar);
  };

  const startTaskDrag = (
    e: React.MouseEvent,
    task: Task,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom',
    onTaskClick?: () => void
  ) => {
    console.log('📋 Starting task drag:', { 
      taskId: task.id, 
      title: task.title,
      action, 
      resizeHandle,
      hasScheduledStart: !!task.scheduledStart,
      projectId: task.projectId || 'none',
      canStartFrom: task.canStartFrom ? new Date(task.canStartFrom).toLocaleString() : 'aucune contrainte'
    });
    
    if (!task.scheduledStart) {
      console.warn('⚠️ Cannot drag task without scheduled start time');
      return;
    }
    
    startDrag(e, task, 'task', action, resizeHandle, onTaskClick);
  };

  const startEventDrag = (
    e: React.MouseEvent,
    event: Event,
    action: 'move' | 'resize',
    resizeHandle?: 'top' | 'bottom',
    onEventClick?: () => void
  ) => {
    console.log('📅 Starting event drag:', { 
      eventId: event.id, 
      title: event.title,
      action, 
      resizeHandle,
      isAllDay: event.allDay
    });
    
    if (event.allDay) {
      console.warn('⚠️ Cannot drag all-day event');
      return;
    }
    
    startDrag(e, event, 'event', action, resizeHandle, onEventClick);
  };

  return {
    dragState,
    startTaskDrag,
    startEventDrag,
    rescheduleAllTasksWithConstraints,
    isRescheduling: isScheduling,
  };
}
