
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
   * NOUVELLE RÈGLE FONDAMENTALE: Jamais avant MAINTENANT
   */
  scheduleTask(task: Task, startDate: Date, endDate: Date, existingTasks: Task[]): Task | null {
    console.log('🔍 Recherche de créneau pour:', task.title, '(durée:', task.estimatedDuration, 'min)');
    
    // CONTRAINTE FONDAMENTALE NOUVELLE: Jamais avant maintenant
    const now = new Date();
    console.log('🕒 CONTRAINTE FONDAMENTALE: Jamais avant maintenant:', format(now, 'dd/MM HH:mm'));
    
    // VÉRIFICATION PRÉLIMINAIRE CRITIQUE
    if (task.canStartFrom) {
      console.log('🚨 CONTRAINTE CRITIQUE DÉTECTÉE "peut commencer à partir de":', format(task.canStartFrom, 'dd/MM HH:mm'));
    }
    
    // CORRECTION BIDIRECTIONNELLE: Respecter canStartFrom ET maintenant (le plus restrictif)
    let effectiveStartTime = Math.max(startDate.getTime(), now.getTime());
    
    // CONTRAINTE BIDIRECTIONNELLE: Si canStartFrom est défini, il est ABSOLUMENT PRIORITAIRE, mais jamais avant maintenant
    if (task.canStartFrom) {
      effectiveStartTime = Math.max(effectiveStartTime, task.canStartFrom.getTime(), now.getTime());
      console.log('🔒 CONTRAINTE BIDIRECTIONNELLE + FONDAMENTALE APPLIQUÉE:', format(new Date(effectiveStartTime), 'dd/MM HH:mm'));
      
      // VÉRIFICATION CRITIQUE: Ne JAMAIS programmer avant cette date
      if (effectiveStartTime < Math.max(task.canStartFrom.getTime(), now.getTime())) {
        console.log('🚨 ERREUR CRITIQUE: Tentative de violation de contrainte - ARRÊT');
        return null;
      }
    } else {
      console.log('📅 Pas de canStartFrom, mais respect de la contrainte fondamentale (maintenant):', format(new Date(effectiveStartTime), 'dd/MM HH:mm'));
    }
    
    let currentDate = new Date(effectiveStartTime);
    
    console.log('⏰ Recherche de créneau à partir de (CONTRAINTES FONDAMENTALE + BIDIRECTIONNELLE RESPECTÉES):', format(currentDate, 'dd/MM HH:mm'));
    
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
        // CORRECTION BIDIRECTIONNELLE + FONDAMENTALE: Le créneau DOIT respecter TOUTES les contraintes
        const adjustedSlotStart = new Date(Math.max(slot.start.getTime(), effectiveStartTime, now.getTime()));
        
        // VÉRIFICATION CRITIQUE SUPPLÉMENTAIRE - CORRECTION: Comparer les timestamps
        if (task.canStartFrom && adjustedSlotStart.getTime() < Math.max(task.canStartFrom.getTime(), now.getTime())) {
          console.log('🚨 REJET: Créneau avant contrainte canStartFrom ou maintenant');
          continue;
        }
        
        // VÉRIFICATION FONDAMENTALE: Jamais avant maintenant
        if (adjustedSlotStart.getTime() < now.getTime()) {
          console.log('🚨 REJET: Créneau avant maintenant (contrainte fondamentale)');
          continue;
        }
        
        if (adjustedSlotStart >= slot.end) {
          continue; // Le créneau est entièrement avant nos contraintes
        }
        
        const availableSlotEnd = slot.end;
        const slotDuration = (availableSlotEnd.getTime() - adjustedSlotStart.getTime()) / (1000 * 60);
        
        if (slotDuration >= task.estimatedDuration) {
          // Créneau trouvé !
          const scheduledStart = adjustedSlotStart;
          const scheduledEnd = addMinutes(scheduledStart, task.estimatedDuration);
          
          // VÉRIFICATION FINALE CRITIQUE: Triple vérification des contraintes
          if (scheduledStart.getTime() < now.getTime()) {
            console.log('🚨 ERREUR FINALE: Tentative de programmer avant maintenant - REJET ABSOLU');
            continue;
          }
          
          if (task.canStartFrom && scheduledStart.getTime() < task.canStartFrom.getTime()) {
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
          
          console.log('✅ Créneau validé (CONTRAINTES FONDAMENTALE + BIDIRECTIONNELLE RESPECTÉES):', format(scheduledStart, 'dd/MM HH:mm'), '-', format(scheduledEnd, 'HH:mm'));
          
          // VÉRIFICATION FINALE AVANT RETOUR
          if (scheduledStart.getTime() < now.getTime() || (task.canStartFrom && scheduledStart.getTime() < task.canStartFrom.getTime())) {
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

    console.log('❌ Aucun créneau valide trouvé pour:', task.title, '(contraintes fondamentale + canStartFrom ABSOLUMENT respectées)');
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
