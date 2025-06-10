
import { addMinutes, addDays, format } from 'date-fns';
import { Task, Event } from '../../types/task';
import { SchedulingOptions } from '../../types/scheduling';
import { TimeSlotManager } from './TimeSlotManager';
import { TaskConstraintResolver } from './TaskConstraintResolver';

export class TaskScheduler {
  private timeSlotManager: TimeSlotManager;
  private constraintResolver: TaskConstraintResolver;
  private events: Event[];

  constructor(events: Event[], options: SchedulingOptions, projects: any[] = []) {
    this.timeSlotManager = new TimeSlotManager(options);
    this.constraintResolver = new TaskConstraintResolver(projects);
    this.events = events;
  }

  /**
   * CORRECTION DÉFINITIVE: Vérification ABSOLUE et PRÉSERVATION de canStartFrom
   */
  scheduleTask(task: Task, startDate: Date, endDate: Date, existingTasks: Task[]): Task | null {
    console.log('🔍 Recherche de créneau pour:', task.title, '(durée:', task.estimatedDuration, 'min)');
    
    // VÉRIFICATION PRÉLIMINAIRE CRITIQUE
    if (task.canStartFrom) {
      console.log('🚨 CONTRAINTE CRITIQUE DÉTECTÉE "peut commencer à partir de":', format(task.canStartFrom, 'dd/MM HH:mm'));
    }
    
    const now = new Date();
    
    // CORRECTION BIDIRECTIONNELLE: Respecter canStartFrom même s'il est dans le passé
    let effectiveStartTime = startDate.getTime();
    
    // CONTRAINTE BIDIRECTIONNELLE: Si canStartFrom est défini, il est ABSOLUMENT PRIORITAIRE
    if (task.canStartFrom) {
      effectiveStartTime = Math.max(effectiveStartTime, task.canStartFrom.getTime());
      console.log('🔒 CONTRAINTE BIDIRECTIONNELLE APPLIQUÉE:', format(new Date(effectiveStartTime), 'dd/MM HH:mm'));
      
      // VÉRIFICATION CRITIQUE: Ne JAMAIS programmer avant cette date
      if (effectiveStartTime < task.canStartFrom.getTime()) {
        console.log('🚨 ERREUR CRITIQUE: Tentative de violation de canStartFrom - ARRÊT');
        return null;
      }
    }
    
    let currentDate = new Date(effectiveStartTime);
    
    console.log('⏰ Recherche de créneau à partir de (CONTRAINTE BIDIRECTIONNELLE RESPECTÉE):', format(currentDate, 'dd/MM HH:mm'));
    
    // Chercher jour par jour
    const searchEndDate = this.constraintResolver.isTaskOverdue(task) ? endDate : new Date(task.deadline);
    
    while (currentDate <= endDate && currentDate <= searchEndDate) {
      // Vérifier si c'est un jour de travail
      if (!this.timeSlotManager.isWorkingDay(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Obtenir les créneaux disponibles pour ce jour
      const availableSlots = this.timeSlotManager.getAvailableSlots(currentDate, existingTasks, this.events);
      
      // Chercher un créneau assez long
      for (const slot of availableSlots) {
        // CORRECTION BIDIRECTIONNELLE: Le créneau DOIT respecter la contrainte ABSOLUE
        const adjustedSlotStart = new Date(Math.max(slot.start.getTime(), effectiveStartTime));
        
        // VÉRIFICATION CRITIQUE SUPPLÉMENTAIRE
        if (task.canStartFrom && adjustedSlotStart < task.canStartFrom) {
          console.log('🚨 REJET: Créneau avant contrainte canStartFrom');
          continue;
        }
        
        if (adjustedSlotStart >= slot.end) {
          continue; // Le créneau est entièrement avant notre contrainte
        }
        
        const availableSlotEnd = slot.end;
        const slotDuration = (availableSlotEnd.getTime() - adjustedSlotStart.getTime()) / (1000 * 60);
        
        if (slotDuration >= task.estimatedDuration) {
          // Créneau trouvé !
          const scheduledStart = adjustedSlotStart;
          const scheduledEnd = addMinutes(scheduledStart, task.estimatedDuration);
          
          // VÉRIFICATION FINALE CRITIQUE: Triple vérification de la contrainte
          if (task.canStartFrom && scheduledStart < task.canStartFrom) {
            console.log('🚨 ERREUR FINALE: Tentative de programmer avant canStartFrom - REJET ABSOLU');
            continue;
          }
          
          // VÉRIFICATION : S'assurer qu'il n'y a pas de conflit avec les événements
          const testTask: Task = {
            ...task,
            scheduledStart,
            scheduledEnd
          };
          
          if (this.checkEventConflict(testTask, this.events)) {
            console.log('🚫 Créneau trouvé mais en conflit avec un événement, passage au suivant');
            continue;
          }
          
          console.log('✅ Créneau validé (CONTRAINTE BIDIRECTIONNELLE RESPECTÉE):', format(scheduledStart, 'dd/MM HH:mm'), '-', format(scheduledEnd, 'HH:mm'));
          
          // VÉRIFICATION FINALE AVANT RETOUR
          if (task.canStartFrom && scheduledStart < task.canStartFrom) {
            console.log('🚨 DERNIÈRE VÉRIFICATION ÉCHOUÉE - REJET');
            continue;
          }
          
          // CORRECTION DÉFINITIVE: NE PAS SUPPRIMER canStartFrom
          return {
            ...task,
            scheduledStart,
            scheduledEnd
            // canStartFrom PRÉSERVÉ (pas supprimé)
          };
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    console.log('❌ Aucun créneau valide trouvé pour:', task.title, '(contrainte canStartFrom ABSOLUMENT respectée)');
    return null;
  }

  private findConflictingEvent(task: Task, events: Event[]): Event | null {
    if (!task.scheduledStart || !task.scheduledEnd) return null;
    
    const taskStart = new Date(task.scheduledStart);
    const taskEnd = new Date(task.scheduledEnd);
    
    for (const event of events) {
      if (event.allDay) continue; // Ignorer les événements toute la journée
      
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Vérifier le chevauchement : deux créneaux se chevauchent si l'un commence avant que l'autre se termine
      const hasOverlap = taskStart < eventEnd && taskEnd > eventStart;
      
      if (hasOverlap) {
        console.log('🚫 Conflit détecté entre tâche', task.title, 'et événement', event.title);
        console.log('   Tâche:', format(taskStart, 'dd/MM HH:mm'), '-', format(taskEnd, 'HH:mm'));
        console.log('   Événement:', format(eventStart, 'dd/MM HH:mm'), '-', format(eventEnd, 'HH:mm'));
        return event;
      }
    }
    
    return null;
  }

  private checkEventConflict(task: Task, events: Event[]): boolean {
    return this.findConflictingEvent(task, events) !== null;
  }
}
