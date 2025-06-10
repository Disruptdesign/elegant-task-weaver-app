import { Task, Event } from '../types/task';
import { addMinutes, startOfDay, endOfDay, isAfter, isBefore, isWithinInterval, addDays, format } from 'date-fns';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  event?: Event;
}

interface SchedulingOptions {
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  bufferBetweenTasks: number; // minutes
  maxTasksPerDay: number;
  allowWeekends: boolean;
}

const DEFAULT_OPTIONS: SchedulingOptions = {
  workingHours: {
    start: "09:00",
    end: "18:00"
  },
  bufferBetweenTasks: 15,
  maxTasksPerDay: 8,
  allowWeekends: false
};

export class AlgorithmicScheduler {
  private events: Event[];
  private options: SchedulingOptions;
  private projects: any[]; // Will be passed from the calling context

  constructor(events: Event[], options: Partial<SchedulingOptions> = {}, projects: any[] = []) {
    this.events = events;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.projects = projects;
  }

  /**
   * Vérifie si une tâche est actuellement en cours d'exécution
   */
  private isTaskInProgress(task: Task): boolean {
    if (!task.scheduledStart || task.completed) {
      return false;
    }
    
    const now = new Date();
    const taskStart = new Date(task.scheduledStart);
    const taskEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : addMinutes(taskStart, task.estimatedDuration);
    
    // Une tâche est en cours si elle a commencé mais n'est pas finie
    const inProgress = taskStart <= now && taskEnd > now;
    
    if (inProgress) {
      console.log('🔒 Tâche en cours détectée (PROTÉGÉE):', task.title, 
        'démarrée à', format(taskStart, 'dd/MM HH:mm'),
        'fin prévue à', format(taskEnd, 'HH:mm'));
    }
    
    return inProgress;
  }

  /**
   * CORRECTION MAJEURE: Vérifie si une tâche est en retard UNIQUEMENT basé sur sa deadline
   * La date canStartFrom ne doit JAMAIS influencer le statut "en retard"
   */
  private isTaskOverdue(task: Task): boolean {
    if (task.completed || !task.deadline) return false;
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    const isOverdue = deadline < now;
    
    if (isOverdue) {
      console.log('⏰ Tâche en retard détectée (DEADLINE DÉPASSÉE):', task.title, 'deadline était', format(deadline, 'dd/MM HH:mm'));
    } else {
      // Debug pour les tâches qui ne sont PAS en retard
      console.log('✅ Tâche dans les temps:', task.title, 'deadline', format(deadline, 'dd/MM HH:mm'));
      if (task.canStartFrom) {
        console.log('   canStartFrom:', format(task.canStartFrom, 'dd/MM HH:mm'), '(ne détermine PAS le statut en retard)');
      }
    }
    
    return isOverdue;
  }

  /**
   * CORRECTION CRITIQUE: Application ABSOLUE des contraintes de projet
   * La contrainte canStartFrom est maintenant STRICTE et INVIOLABLE
   */
  private applyProjectConstraints(task: Task): Task {
    if (!task.projectId) {
      return task;
    }

    const project = this.projects.find(p => p.id === task.projectId);
    if (!project) {
      console.warn('⚠️ Projet introuvable pour la tâche:', task.title, 'projectId:', task.projectId);
      return task;
    }

    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.deadline);
    const taskDeadline = new Date(task.deadline);
    const now = new Date();

    console.log('🎯 APPLICATION STRICTE des contraintes projet pour:', task.title);
    console.log('   Projet:', project.title, format(projectStart, 'dd/MM'), '-', format(projectEnd, 'dd/MM'));
    console.log('   Tâche deadline originale:', format(taskDeadline, 'dd/MM'));
    
    let updatedTask = { ...task };

    // CONTRAINTE 1: Ajuster la deadline si nécessaire
    if (taskDeadline > projectEnd) {
      updatedTask.deadline = projectEnd;
      console.log('📅 Deadline tâche ajustée à la fin du projet:', format(projectEnd, 'dd/MM'));
    }

    if (new Date(updatedTask.deadline) < projectStart) {
      updatedTask.deadline = projectStart;
      console.log('📅 Deadline tâche ajustée au début du projet:', format(projectStart, 'dd/MM'));
    }

    // CONTRAINTE 2 CRITIQUE: Calcul de la date de début ABSOLUE
    // La contrainte canStartFrom est maintenant INVIOLABLE
    const existingCanStartFrom = task.canStartFrom?.getTime() || 0;
    const projectStartTime = projectStart.getTime();
    const nowTime = now.getTime();
    
    // RÈGLE ABSOLUE: Prendre la date la plus restrictive (la plus tardive) 
    // et cette date devient INVIOLABLE
    const absoluteEarliestStart = Math.max(existingCanStartFrom, projectStartTime, nowTime);
    
    updatedTask.canStartFrom = new Date(absoluteEarliestStart);

    console.log('🚨 CONTRAINTE ABSOLUE CALCULÉE (INVIOLABLE):');
    console.log('   - Contrainte existante (canStartFrom):', existingCanStartFrom ? format(new Date(existingCanStartFrom), 'dd/MM HH:mm') : 'aucune');
    console.log('   - Contrainte projet (début):', format(projectStart, 'dd/MM HH:mm'));
    console.log('   - Contrainte temps (maintenant):', format(now, 'dd/MM HH:mm'));
    console.log('   - 🔒 RÉSULTAT FINAL INVIOLABLE:', format(updatedTask.canStartFrom, 'dd/MM HH:mm'));
    console.log('   ⚠️ AUCUNE TÂCHE NE PEUT ÊTRE PROGRAMMÉE AVANT CETTE DATE');

    return updatedTask;
  }

  /**
   * Résout les dépendances des tâches et retourne un ordre de planification valide
   */
  private resolveDependencies(tasks: Task[]): Task[] {
    console.log('🔗 Résolution des dépendances pour', tasks.length, 'tâches');
    
    const resolved: Task[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (task: Task): boolean => {
      if (visiting.has(task.id)) {
        console.warn('⚠️ Dépendance circulaire détectée pour la tâche:', task.title);
        return false;
      }
      
      if (visited.has(task.id)) {
        return true;
      }
      
      visiting.add(task.id);
      
      // Traiter les dépendances d'abord
      if (task.dependencies && task.dependencies.length > 0) {
        console.log('📋 Tâche', task.title, 'dépend de', task.dependencies.length, 'autre(s) tâche(s)');
        
        for (const depId of task.dependencies) {
          const dependency = tasks.find(t => t.id === depId);
          if (dependency) {
            console.log('   ➡️ Dépendance:', dependency.title);
            if (!visit(dependency)) {
              console.error('❌ Impossible de résoudre la dépendance:', dependency.title);
              visiting.delete(task.id);
              return false;
            }
          } else {
            console.warn('⚠️ Dépendance introuvable:', depId, 'pour la tâche:', task.title);
          }
        }
      }
      
      visiting.delete(task.id);
      visited.add(task.id);
      resolved.push(task);
      
      return true;
    };
    
    // Visiter toutes les tâches
    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task);
      }
    }
    
    console.log('✅ Ordre de résolution des dépendances:');
    resolved.forEach((task, index) => {
      const deps = task.dependencies?.length || 0;
      const isOverdue = this.isTaskOverdue(task);
      const overdueMsg = isOverdue ? ' (EN RETARD - priorité conservée)' : '';
      console.log(`   ${index + 1}. ${task.title} ${deps > 0 ? `(dépend de ${deps} tâche(s))` : '(aucune dépendance)'}${overdueMsg}`);
    });
    
    return resolved;
  }

  /**
   * CORRECTION ABSOLUE: La contrainte canStartFrom ne peut JAMAIS être violée
   */
  private calculateEarliestStart(task: Task, completedTasks: Task[], scheduledTasks: Task[]): Date {
    const now = new Date();
    
    // RÈGLE ABSOLUE: canStartFrom est PRIORITAIRE sur TOUT
    let absoluteEarliestStart = task.canStartFrom || now;
    
    // JAMAIS avant maintenant ET JAMAIS avant canStartFrom
    absoluteEarliestStart = new Date(Math.max(absoluteEarliestStart.getTime(), now.getTime()));
    
    if (task.canStartFrom) {
      console.log('🔒 CONTRAINTE ABSOLUE pour', task.title, ':', format(task.canStartFrom, 'dd/MM HH:mm'));
      console.log('   Date de début MINIMALE ABSOLUE:', format(absoluteEarliestStart, 'dd/MM HH:mm'));
    }
    
    // CONTRAINTE 2: Vérifier les dépendances - MAIS JAMAIS avant la contrainte absolue
    if (task.dependencies && task.dependencies.length > 0) {
      console.log('🔗 Vérification des dépendances pour', task.title);
      
      for (const depId of task.dependencies) {
        // Chercher dans les tâches terminées
        const completedDep = completedTasks.find(t => t.id === depId && t.completed);
        if (completedDep) {
          console.log('   ✅ Dépendance terminée:', completedDep.title);
          continue;
        }
        
        // Chercher dans les tâches programmées
        const scheduledDep = scheduledTasks.find(t => t.id === depId && t.scheduledEnd);
        if (scheduledDep && scheduledDep.scheduledEnd) {
          const depEnd = new Date(scheduledDep.scheduledEnd);
          const depEndWithBuffer = addMinutes(depEnd, this.options.bufferBetweenTasks);
          
          // RÈGLE CRITIQUE: La contrainte absolue canStartFrom ne peut JAMAIS être violée
          const candidateStart = Math.max(depEndWithBuffer.getTime(), absoluteEarliestStart.getTime());
          
          if (candidateStart > absoluteEarliestStart.getTime()) {
            absoluteEarliestStart = new Date(candidateStart);
            console.log('   ⏰ Dépendance appliquée mais contrainte canStartFrom RESPECTÉE:', format(absoluteEarliestStart, 'dd/MM HH:mm'));
          }
        }
      }
    }
    
    console.log('🎯 Date de début FINALE ABSOLUE pour', task.title, ':', format(absoluteEarliestStart, 'dd/MM HH:mm'));
    return absoluteEarliestStart;
  }

  /**
   * Planifie automatiquement les tâches selon leur priorité, deadline et dépendances
   * CORRECTION CRITIQUE: Préserver ABSOLUMENT les contraintes canStartFrom lors de la replanification
   */
  scheduleTasks(tasks: Task[], isRescheduling: boolean = false): Task[] {
    console.log('🤖 Début de la planification algorithmique pour', tasks.length, 'tâches');
    console.log('🔒 MODE:', isRescheduling ? 'REPLANIFICATION (contraintes canStartFrom ABSOLUMENT PRÉSERVÉES)' : 'PLANIFICATION NORMALE');
    
    const now = new Date();
    console.log('⏰ Heure actuelle de référence:', format(now, 'dd/MM/yyyy HH:mm:ss'));
    
    // Séparer les tâches selon leur statut avec protection des tâches en cours
    let protectedTasks: Task[] = [];
    let tasksToSchedule: Task[] = [];

    if (isRescheduling) {
      console.log('🔄 MODE REPLANIFICATION AGGRESSIVE avec protection ABSOLUE des contraintes canStartFrom');
      
      // PROTECTION ABSOLUE : Figer les tâches terminées ET les tâches en cours
      protectedTasks = tasks.filter(task => task.completed || this.isTaskInProgress(task));
      
      // TOUTES les autres tâches seront replanifiées (y compris les tâches en retard)
      const otherTasks = tasks.filter(task => !task.completed && !this.isTaskInProgress(task));
      
      // CORRECTION ABSOLUE: Préserver ET RENFORCER les contraintes canStartFrom lors de la replanification
      tasksToSchedule = otherTasks.map(task => {
        console.log('🔄 REPLANIFICATION CRITIQUE de la tâche:', task.title);
        
        // SAUVEGARDER la contrainte canStartFrom ORIGINALE avant toute modification
        const originalCanStartFrom = task.canStartFrom;
        if (originalCanStartFrom) {
          console.log('   🔒 SAUVEGARDE contrainte canStartFrom ORIGINALE:', format(originalCanStartFrom, 'dd/MM HH:mm'));
        }
        
        // Appliquer les contraintes de projet en PRÉSERVANT la contrainte originale
        const taskWithProjectConstraints = this.applyProjectConstraints(task);
        
        // GARANTIE ABSOLUE: La contrainte canStartFrom finale ne peut JAMAIS être plus tôt que l'originale
        if (originalCanStartFrom && taskWithProjectConstraints.canStartFrom && taskWithProjectConstraints.canStartFrom < originalCanStartFrom) {
          console.log('🚨 CORRECTION CRITIQUE: Restauration de la contrainte originale plus restrictive');
          taskWithProjectConstraints.canStartFrom = originalCanStartFrom;
        }
        
        // Effacer SEULEMENT la planification, JAMAIS les contraintes
        const replanifiedTask = {
          ...taskWithProjectConstraints,
          scheduledStart: undefined,
          scheduledEnd: undefined
          // canStartFrom est ABSOLUMENT PRÉSERVÉ ET RENFORCÉ
        };
        
        if (replanifiedTask.canStartFrom) {
          console.log('   ✅ Contrainte canStartFrom ABSOLUMENT PRÉSERVÉE ET RENFORCÉE:', format(replanifiedTask.canStartFrom, 'dd/MM HH:mm'));
        }
        
        return replanifiedTask;
      });
      
      console.log('🔒 Tâches protégées:', protectedTasks.length);
      console.log('🔄 Tâches à replanifier (contraintes canStartFrom ABSOLUMENT PRÉSERVÉES):', tasksToSchedule.length);
      
    } else {
      // Mode planification normale avec application STRICTE des contraintes
      const tasksNeedingScheduling = tasks.filter(task => (!task.scheduledStart || this.isTaskOverdue(task)) && !task.completed);
      
      // Appliquer les contraintes de projet AVANT la planification en PRÉSERVANT canStartFrom
      tasksToSchedule = tasksNeedingScheduling.map(task => {
        console.log('📋 Planification normale STRICTE pour:', task.title);
        
        // SAUVEGARDER la contrainte canStartFrom ORIGINALE
        const originalCanStartFrom = task.canStartFrom;
        if (originalCanStartFrom) {
          console.log('   🔒 PRÉSERVATION contrainte canStartFrom originale:', format(originalCanStartFrom, 'dd/MM HH:mm'));
        }
        
        const taskWithProjectConstraints = this.applyProjectConstraints(task);
        
        // GARANTIE ABSOLUE: Vérifier que canStartFrom original est respecté
        if (originalCanStartFrom && taskWithProjectConstraints.canStartFrom && taskWithProjectConstraints.canStartFrom < originalCanStartFrom) {
          console.log('🚨 CORRECTION: Contraintes projet violent canStartFrom - RESTAURATION FORCÉE');
          taskWithProjectConstraints.canStartFrom = originalCanStartFrom;
        }
        
        return {
          ...taskWithProjectConstraints,
          scheduledStart: undefined,
          scheduledEnd: undefined
        };
      });
      
      // Gérer les tâches déjà programmées
      const alreadyScheduled = tasks.filter(task => task.scheduledStart && !task.completed && !this.isTaskOverdue(task));
      const validScheduledTasks: Task[] = [];
      
      alreadyScheduled.forEach(task => {
        // PROTECTION ABSOLUE : Ne jamais toucher aux tâches en cours
        if (this.isTaskInProgress(task)) {
          console.log('🔒 Tâche en cours PROTÉGÉE:', task.title);
          validScheduledTasks.push(task);
          return;
        }
        
        const taskStart = new Date(task.scheduledStart!);
        
        // RÈGLE 1: Vérifier si la tâche est dans le passé
        if (taskStart < now) {
          console.log('⏰ Tâche dépassée détectée:', task.title);
          
          // PRÉSERVER canStartFrom lors de la replanification
          const originalCanStartFrom = task.canStartFrom;
          const taskWithConstraints = this.applyProjectConstraints(task);
          
          if (originalCanStartFrom && taskWithConstraints.canStartFrom && taskWithConstraints.canStartFrom < originalCanStartFrom) {
            taskWithConstraints.canStartFrom = originalCanStartFrom;
          }
          
          tasksToSchedule.push({
            ...taskWithConstraints,
            scheduledStart: undefined,
            scheduledEnd: undefined
          });
        } else {
          // RÈGLE 2: Vérifier les conflits avec les événements
          const conflictingEvent = this.findConflictingEvent(task, this.events);
          
          if (conflictingEvent) {
            console.log('⚠️ Tâche en conflit:', task.title);
            
            // PRÉSERVER canStartFrom même lors de résolution de conflit
            const originalCanStartFrom = task.canStartFrom;
            const conflictResolutionDate = addMinutes(new Date(conflictingEvent.endDate), this.options.bufferBetweenTasks);
            
            const effectiveCanStartFrom = originalCanStartFrom && originalCanStartFrom > conflictResolutionDate 
              ? originalCanStartFrom 
              : conflictResolutionDate;
            
            const taskWithConstraints = this.applyProjectConstraints({
              ...task,
              canStartFrom: effectiveCanStartFrom
            });
            
            tasksToSchedule.push({
              ...taskWithConstraints,
              scheduledStart: undefined,
              scheduledEnd: undefined
            });
          } else {
            validScheduledTasks.push(task);
          }
        }
      });
      
      // Ajouter les tâches déjà terminées
      protectedTasks = [...tasks.filter(task => task.completed), ...validScheduledTasks];
      
      console.log('📋 Tâches à programmer:', tasksToSchedule.length);
      console.log('✅ Tâches protégées:', protectedTasks.length);
    }

    // Résoudre les dépendances et trier les tâches
    const resolvedTasks = this.resolveDependencies(tasksToSchedule);
    const sortedTasks = this.prioritizeTasks(resolvedTasks);
    
    // Programmer chaque tâche à partir de maintenant
    const newlyScheduledTasks: Task[] = [];
    const startDate = now;
    const endDate = addDays(startDate, 30);

    console.log(`🎯 Planification de ${sortedTasks.length} tâche(s) avec contraintes ABSOLUES...`);

    for (const task of sortedTasks) {
      // VÉRIFICATION PRÉALABLE CRITIQUE
      if (task.canStartFrom) {
        console.log('🚨 CONTRAINTE CRITIQUE pour', task.title, ':', format(task.canStartFrom, 'dd/MM HH:mm'));
      }
      
      // Calculer la date de début en respectant ABSOLUMENT toutes les contraintes
      const earliestStart = this.calculateEarliestStart(task, protectedTasks, [...protectedTasks, ...newlyScheduledTasks]);
      
      // TRIPLE VÉRIFICATION: S'assurer que TOUTES les contraintes sont respectées
      const effectiveEarliestStart = Math.max(
        earliestStart.getTime(),
        task.canStartFrom?.getTime() || earliestStart.getTime()
      );
      
      // GARANTIE FINALE ABSOLUE: canStartFrom ne peut JAMAIS être violé
      const finalEarliestStart = task.canStartFrom && effectiveEarliestStart < task.canStartFrom.getTime()
        ? task.canStartFrom
        : new Date(effectiveEarliestStart);
      
      // DERNIÈRE VÉRIFICATION avant programmation
      if (task.canStartFrom && finalEarliestStart < task.canStartFrom) {
        console.log('🚨 ERREUR CRITIQUE: Violation de contrainte détectée - CORRECTION FORCÉE');
        const correctedTask = { ...task, canStartFrom: task.canStartFrom };
        newlyScheduledTasks.push(correctedTask);
        continue;
      }
      
      const scheduledTask = this.scheduleTask(
        { ...task, canStartFrom: finalEarliestStart }, 
        startDate, 
        endDate, 
        [...protectedTasks, ...newlyScheduledTasks]
      );
      
      if (scheduledTask) {
        // VÉRIFICATION POST-PROGRAMMATION CRITIQUE
        if (task.canStartFrom && scheduledTask.scheduledStart && new Date(scheduledTask.scheduledStart) < task.canStartFrom) {
          console.log('🚨 ERREUR POST-PROGRAMMATION: Contrainte violée - REJET DE LA PROGRAMMATION');
          newlyScheduledTasks.push(task); // Garder la tâche non programmée
        } else {
          newlyScheduledTasks.push(scheduledTask);
          const isReallyOverdue = this.isTaskOverdue(task);
          const overdueNote = isReallyOverdue ? ' (était en retard)' : '';
          const constraintNote = task.canStartFrom ? ' (contrainte canStartFrom ABSOLUMENT RESPECTÉE)' : '';
          console.log('✅ Tâche programmée:', task.title, 'à', format(scheduledTask.scheduledStart!, 'dd/MM HH:mm') + overdueNote + constraintNote);
        }
      } else {
        console.log('❌ Impossible de programmer:', task.title);
        newlyScheduledTasks.push(task);
      }
    }

    const result = [...protectedTasks, ...newlyScheduledTasks];
    
    // VÉRIFICATION FINALE GLOBALE: Aucune tâche ne doit violer sa contrainte canStartFrom
    const violatingTasks = result.filter(task => {
      if (!task.canStartFrom || !task.scheduledStart || task.completed) return false;
      return new Date(task.scheduledStart) < task.canStartFrom;
    });
    
    if (violatingTasks.length > 0) {
      console.log('🚨 ERREUR CRITIQUE: Des tâches violent leur contrainte canStartFrom:');
      violatingTasks.forEach(task => {
        console.log('   ❌', task.title, 'programmée à', format(task.scheduledStart!, 'dd/MM HH:mm'), 'mais canStartFrom à', format(task.canStartFrom!, 'dd/MM HH:mm'));
      });
    }
    
    // Statistiques finales
    console.log('📊 Résumé avec contraintes canStartFrom ABSOLUMENT RESPECTÉES:');
    console.log(`   - Tâches traitées: ${result.length}`);
    console.log(`   - Tâches programmées: ${result.filter(t => t.scheduledStart && !t.completed).length}`);
    console.log(`   - Tâches avec contraintes canStartFrom: ${result.filter(t => t.canStartFrom).length}`);
    console.log(`   - Violations détectées: ${violatingTasks.length} (DOIT ÊTRE 0)`);

    return result;
  }

  /**
   * CORRECTION CRITIQUE: Vérification ABSOLUE de la contrainte canStartFrom avant programmation
   */
  private scheduleTask(task: Task, startDate: Date, endDate: Date, existingTasks: Task[]): Task | null {
    console.log('🔍 Recherche de créneau pour:', task.title, '(durée:', task.estimatedDuration, 'min)');
    
    // VÉRIFICATION PRÉLIMINAIRE CRITIQUE
    if (task.canStartFrom) {
      console.log('🚨 CONTRAINTE CRITIQUE DÉTECTÉE "peut commencer à partir de":', format(task.canStartFrom, 'dd/MM HH:mm'));
    }
    
    const now = new Date();
    
    // RÈGLE ABSOLUE: La contrainte canStartFrom ne peut JAMAIS être violée
    let effectiveStartTime = Math.max(startDate.getTime(), now.getTime());
    
    // CONTRAINTE INVIOLABLE: Si canStartFrom est défini, il est ABSOLUMENT PRIORITAIRE
    if (task.canStartFrom) {
      effectiveStartTime = Math.max(effectiveStartTime, task.canStartFrom.getTime());
      console.log('🔒 CONTRAINTE ABSOLUE APPLIQUÉE:', format(new Date(effectiveStartTime), 'dd/MM HH:mm'));
      
      // VÉRIFICATION CRITIQUE: Ne JAMAIS programmer avant cette date
      if (effectiveStartTime < task.canStartFrom.getTime()) {
        console.log('🚨 ERREUR CRITIQUE: Tentative de violation de canStartFrom - ARRÊT');
        return null;
      }
    }
    
    let currentDate = new Date(effectiveStartTime);
    
    console.log('⏰ Recherche de créneau à partir de (CONTRAINTE ABSOLUE RESPECTÉE):', format(currentDate, 'dd/MM HH:mm'));
    
    // Chercher jour par jour
    const searchEndDate = this.isTaskOverdue(task) ? endDate : task.deadline;
    
    while (currentDate <= endDate && currentDate <= searchEndDate) {
      // Vérifier si c'est un jour de travail
      if (!this.isWorkingDay(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Obtenir les créneaux disponibles pour ce jour
      const availableSlots = this.getAvailableSlots(currentDate, existingTasks);
      
      // Chercher un créneau assez long
      for (const slot of availableSlots) {
        // CORRECTION ABSOLUE: Le créneau DOIT respecter la contrainte ABSOLUE
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
          
          console.log('✅ Créneau validé (CONTRAINTE ABSOLUE RESPECTÉE):', format(scheduledStart, 'dd/MM HH:mm'), '-', format(scheduledEnd, 'HH:mm'));
          
          // VÉRIFICATION FINALE AVANT RETOUR
          if (task.canStartFrom && scheduledStart < task.canStartFrom) {
            console.log('🚨 DERNIÈRE VÉRIFICATION ÉCHOUÉE - REJET');
            continue;
          }
          
          return {
            ...task,
            scheduledStart,
            scheduledEnd,
            canStartFrom: undefined // Nettoyer la contrainte une fois la tâche programmée
          };
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    console.log('❌ Aucun créneau valide trouvé pour:', task.title, '(contrainte canStartFrom ABSOLUMENT respectée)');
    return null;
  }

  /**
   * Trouve l'événement qui entre en conflit avec une tâche
   */
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

  /**
   * Vérifie si une tâche est en conflit avec des événements (version simplifiée pour validation)
   */
  private checkEventConflict(task: Task, events: Event[]): boolean {
    return this.findConflictingEvent(task, events) !== null;
  }

  /**
   * Trie les tâches par priorité et proximité de deadline (les tâches en retard conservent leur priorité originale)
   */
  private prioritizeTasks(tasks: Task[]): Task[] {
    const priorityWeight = {
      'urgent': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return tasks.sort((a, b) => {
      // D'abord par priorité (les tâches en retard conservent leur priorité originale)
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Ensuite par deadline (plus proche = plus prioritaire)
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }

  /**
   * Obtient les créneaux disponibles pour un jour donné
   * MODIFICATION: Exclut les tâches terminées du calcul des créneaux occupés
   */
  private getAvailableSlots(date: Date, existingTasks: Task[]): TimeSlot[] {
    const dayStart = this.getWorkingDayStart(date);
    const dayEnd = this.getWorkingDayEnd(date);
    
    // Collecter tous les éléments occupés (événements + tâches programmées NON TERMINÉES)
    const occupiedSlots: TimeSlot[] = [];
    
    // Ajouter les événements
    this.events.forEach(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      if (this.isDateInRange(eventStart, date) || this.isDateInRange(eventEnd, date)) {
        occupiedSlots.push({
          start: eventStart,
          end: eventEnd,
          available: false,
          event
        });
      }
    });
    
    // Ajouter SEULEMENT les tâches NON TERMINÉES déjà programmées
    existingTasks.forEach(task => {
      // 🎯 MODIFICATION CLÉ : Ignorer les tâches terminées lors du calcul des créneaux occupés
      if (task.completed) {
        console.log('✅ Tâche terminée ignorée pour le calcul des créneaux:', task.title);
        return;
      }
      
      if (task.scheduledStart && task.scheduledEnd) {
        const taskStart = new Date(task.scheduledStart);
        const taskEnd = new Date(task.scheduledEnd);
        
        if (this.isDateInRange(taskStart, date)) {
          occupiedSlots.push({
            start: taskStart,
            end: taskEnd,
            available: false
          });
        }
      }
    });

    // Trier par heure de début
    occupiedSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Calculer les créneaux libres
    const availableSlots: TimeSlot[] = [];
    let currentTime = dayStart;
    
    for (const occupied of occupiedSlots) {
      // S'il y a un gap avant cet élément occupé
      if (currentTime < occupied.start) {
        availableSlots.push({
          start: currentTime,
          end: occupied.start,
          available: true
        });
      }
      
      // Avancer après cet élément + buffer
      currentTime = addMinutes(occupied.end, this.options.bufferBetweenTasks);
    }
    
    // Ajouter le créneau final si il reste du temps
    if (currentTime < dayEnd) {
      availableSlots.push({
        start: currentTime,
        end: dayEnd,
        available: true
      });
    }
    
    return availableSlots.filter(slot => {
      const duration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
      return duration >= 30; // Minimum 30 minutes
    });
  }

  /**
   * Vérifie si une date tombe dans un jour donné
   */
  private isDateInRange(dateToCheck: Date, referenceDate: Date): boolean {
    const start = startOfDay(referenceDate);
    const end = endOfDay(referenceDate);
    return isWithinInterval(dateToCheck, { start, end });
  }

  /**
   * Vérifie si c'est un jour de travail
   */
  private isWorkingDay(date: Date): boolean {
    if (this.options.allowWeekends) return true;
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Lundi à vendredi
  }

  /**
   * Obtient l'heure de début de travail pour un jour
   */
  private getWorkingDayStart(date: Date): Date {
    const [hours, minutes] = this.options.workingHours.start.split(':').map(Number);
    const start = startOfDay(date);
    start.setHours(hours, minutes, 0, 0);
    return start;
  }

  /**
   * Obtient l'heure de fin de travail pour un jour
   */
  private getWorkingDayEnd(date: Date): Date {
    const [hours, minutes] = this.options.workingHours.end.split(':').map(Number);
    const end = startOfDay(date);
    end.setHours(hours, minutes, 0, 0);
    return end;
  }

  /**
   * Replanifie toutes les tâches (utile après ajout/suppression d'événement)
   */
  static rescheduleAll(tasks: Task[], events: Event[], options?: Partial<SchedulingOptions>, projects: any[] = []): Task[] {
    console.log('🔄 Replanification complète des tâches avec protection des tâches en cours et contraintes projet');
    const scheduler = new AlgorithmicScheduler(events, options, projects);
    
    // Utiliser le mode replanification pour respecter les contraintes
    return scheduler.scheduleTasks(tasks, true);
  }
}

/**
 * Fonction utilitaire pour programmer automatiquement les tâches
 */
export function scheduleTasksAutomatically(
  tasks: Task[], 
  events: Event[], 
  options?: Partial<SchedulingOptions>,
  projects: any[] = []
): Task[] {
  const scheduler = new AlgorithmicScheduler(events, options, projects);
  return scheduler.scheduleTasks(tasks, false);
}

/**
 * Fonction pour replanifier après changement d'événements
 */
export function rescheduleAfterEventChange(
  tasks: Task[], 
  events: Event[], 
  options?: Partial<SchedulingOptions>,
  projects: any[] = []
): Task[] {
  return AlgorithmicScheduler.rescheduleAll(tasks, events, options, projects);
}
