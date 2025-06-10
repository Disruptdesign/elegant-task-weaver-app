
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
   * CORRECTION MAJEURE: Valide les contraintes de projet sans affecter le statut "en retard"
   * Sépare clairement les contraintes de planification et le calcul du retard
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

    console.log('🎯 Application contraintes projet pour:', task.title);
    console.log('   Projet:', project.title, format(projectStart, 'dd/MM'), '-', format(projectEnd, 'dd/MM'));
    console.log('   Tâche deadline originale:', format(taskDeadline, 'dd/MM'));
    
    // CLARIFICATION : Afficher les contraintes existantes
    if (task.canStartFrom) {
      console.log('   Contrainte canStartFrom existante:', format(task.canStartFrom, 'dd/MM HH:mm'));
    }

    let updatedTask = { ...task };

    // CONTRAINTE 1: Ajuster la deadline si nécessaire (mais sans affecter le statut en retard)
    // Note : Cette contrainte ne change que la planification future, pas le calcul du retard
    if (taskDeadline > projectEnd) {
      updatedTask.deadline = projectEnd;
      console.log('📅 Deadline tâche ajustée à la fin du projet:', format(projectEnd, 'dd/MM'));
      console.log('   ⚠️ IMPORTANT: Cet ajustement ne change pas le statut "en retard" de la tâche');
    }

    if (new Date(updatedTask.deadline) < projectStart) {
      updatedTask.deadline = projectStart;
      console.log('📅 Deadline tâche ajustée au début du projet:', format(projectStart, 'dd/MM'));
      console.log('   ⚠️ IMPORTANT: Cet ajustement ne change pas le statut "en retard" de la tâche');
    }

    // CONTRAINTE 2 CORRIGÉE : Calculer la date de début effective pour la PLANIFICATION SEULEMENT
    // Cette contrainte ne doit JAMAIS affecter si une tâche est considérée comme "en retard"
    const constraints = [
      projectStart.getTime(),                           // Contrainte projet
      task.canStartFrom?.getTime() || projectStart.getTime(),  // Contrainte tâche (si elle existe)
      now.getTime()                                     // Contrainte temps (maintenant)
    ];

    // PRENDRE LA DATE LA PLUS RESTRICTIVE (la plus tardive) POUR LA PLANIFICATION
    const effectiveEarliestStart = Math.max(...constraints);
    updatedTask.canStartFrom = new Date(effectiveEarliestStart);

    console.log('🚀 Date de début effective calculée (PLANIFICATION SEULEMENT - ne détermine PAS le retard):', format(updatedTask.canStartFrom, 'dd/MM HH:mm'));
    console.log('   - Contrainte projet (début):', format(projectStart, 'dd/MM HH:mm'));
    console.log('   - Contrainte tâche (canStartFrom):', task.canStartFrom ? format(task.canStartFrom, 'dd/MM HH:mm') : 'aucune');
    console.log('   - Contrainte temps (maintenant):', format(now, 'dd/MM HH:mm'));
    console.log('   - RÉSULTAT FINAL (le plus restrictif pour PLANIFICATION):', format(updatedTask.canStartFrom, 'dd/MM HH:mm'));
    console.log('   ✅ RAPPEL: Le statut "en retard" dépend UNIQUEMENT de la deadline:', format(updatedTask.deadline, 'dd/MM HH:mm'));

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
   * Calcule la date de début la plus tôt possible pour une tâche en fonction de ses dépendances et contraintes
   * CORRECTION MAJEURE: Respecter ABSOLUMENT la contrainte canStartFrom
   */
  private calculateEarliestStart(task: Task, completedTasks: Task[], scheduledTasks: Task[]): Date {
    const now = new Date();
    let earliestStart = now;
    
    // VÉRIFICATION INITIALE de la contrainte canStartFrom
    if (task.canStartFrom) {
      console.log('🔒 CONTRAINTE ABSOLUE détectée pour', task.title, ':', format(task.canStartFrom, 'dd/MM HH:mm'));
      earliestStart = new Date(Math.max(task.canStartFrom.getTime(), now.getTime()));
    }
    
    // CONTRAINTE 2: Vérifier les dépendances - MAIS JAMAIS avant canStartFrom
    if (task.dependencies && task.dependencies.length > 0) {
      console.log('🔗 Calcul de la date de début pour', task.title, 'avec', task.dependencies.length, 'dépendance(s)');
      
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
          
          // CORRECTION MAJEURE: Respecter canStartFrom même pour les dépendances
          const effectiveDepEnd = task.canStartFrom ? 
            new Date(Math.max(depEndWithBuffer.getTime(), task.canStartFrom.getTime())) : 
            depEndWithBuffer;
          
          if (effectiveDepEnd > earliestStart) {
            earliestStart = effectiveDepEnd;
            console.log('   ⏰ Dépendance programmée:', scheduledDep.title, 
              'se termine à', format(depEnd, 'dd/MM HH:mm'),
              'mais contrainte canStartFrom appliquée, début à', format(earliestStart, 'dd/MM HH:mm'));
          }
        } else {
          console.warn('   ⚠️ Dépendance non programmée:', depId);
        }
      }
    }
    
    // VÉRIFICATION FINALE: S'assurer que canStartFrom est TOUJOURS respecté
    if (task.canStartFrom && earliestStart < task.canStartFrom) {
      console.log('🚨 CORRECTION: La date calculée', format(earliestStart, 'dd/MM HH:mm'), 
        'est avant canStartFrom', format(task.canStartFrom, 'dd/MM HH:mm'), '- APPLICATION FORCÉE');
      earliestStart = task.canStartFrom;
    }
    
    console.log('🎯 Date de début FINALE calculée pour', task.title, ':', format(earliestStart, 'dd/MM HH:mm'));
    return earliestStart;
  }

  /**
   * Planifie automatiquement les tâches selon leur priorité, deadline et dépendances
   */
  scheduleTasks(tasks: Task[], isRescheduling: boolean = false): Task[] {
    console.log('🤖 Début de la planification algorithmique pour', tasks.length, 'tâches');
    
    const now = new Date();
    console.log('⏰ Heure actuelle de référence:', format(now, 'dd/MM/yyyy HH:mm:ss'));
    
    // Séparer les tâches selon leur statut avec protection des tâches en cours
    let protectedTasks: Task[] = [];
    let tasksToSchedule: Task[] = [];

    if (isRescheduling) {
      console.log('🔄 MODE REPLANIFICATION AGGRESSIVE avec protection des tâches en cours');
      
      // PROTECTION ABSOLUE : Figer les tâches terminées ET les tâches en cours
      protectedTasks = tasks.filter(task => task.completed || this.isTaskInProgress(task));
      
      // Séparer les tâches en cours pour un traitement spécial
      const completedTasks = protectedTasks.filter(task => task.completed);
      const tasksInProgress = protectedTasks.filter(task => this.isTaskInProgress(task));
      
      // TOUTES les autres tâches seront replanifiées (y compris les tâches en retard)
      const otherTasks = tasks.filter(task => !task.completed && !this.isTaskInProgress(task));
      
      // Appliquer les contraintes de projet AVANT la planification
      tasksToSchedule = otherTasks.map(task => {
        const taskWithProjectConstraints = this.applyProjectConstraints(task);
        return {
          ...taskWithProjectConstraints,
          scheduledStart: undefined,
          scheduledEnd: undefined
        };
      });
      
      console.log('🔒 Tâches protégées (terminées):', completedTasks.length);
      console.log('🔒 Tâches protégées (EN COURS - INTOUCHABLES):', tasksInProgress.length);
      console.log('🔄 Tâches à replanifier (incluant celles en retard):', tasksToSchedule.length);
      
      // CORRECTION : Compter les tâches en retard CORRECTEMENT (deadline dépassée seulement)
      const overdueTasks = tasksToSchedule.filter(task => this.isTaskOverdue(task));
      console.log('⏰ Tâches VRAIMENT en retard à replanifier (deadline dépassée):', overdueTasks.length);
      
      // Afficher les détails des tâches en cours protégées
      tasksInProgress.forEach(task => {
        const taskStart = new Date(task.scheduledStart!);
        const taskEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : addMinutes(taskStart, task.estimatedDuration);
        console.log(`   🔒 "${task.title}" : ${format(taskStart, 'dd/MM HH:mm')} - ${format(taskEnd, 'HH:mm')} (EN COURS)`);
      });
      
    } else {
      // Mode planification normale avec protection des tâches en cours
      // CORRECTION : Inclure SEULEMENT les tâches vraiment en retard (deadline dépassée)
      const tasksNeedingScheduling = tasks.filter(task => (!task.scheduledStart || this.isTaskOverdue(task)) && !task.completed);
      
      // Appliquer les contraintes de projet AVANT la planification
      tasksToSchedule = tasksNeedingScheduling.map(task => {
        const taskWithProjectConstraints = this.applyProjectConstraints(task);
        return {
          ...taskWithProjectConstraints,
          scheduledStart: undefined,
          scheduledEnd: undefined
        };
      });
      
      // Vérifier les tâches déjà programmées pour les conflits ou problèmes
      const alreadyScheduled = tasks.filter(task => task.scheduledStart && !task.completed && !this.isTaskOverdue(task));
      const validScheduledTasks: Task[] = [];
      
      alreadyScheduled.forEach(task => {
        // PROTECTION ABSOLUE : Ne jamais toucher aux tâches en cours
        if (this.isTaskInProgress(task)) {
          console.log('🔒 Tâche en cours PROTÉGÉE (ne sera pas replanifiée):', task.title);
          validScheduledTasks.push(task);
          return;
        }
        
        const taskStart = new Date(task.scheduledStart!);
        
        // RÈGLE 1: Vérifier si la tâche est dans le passé (sauf si en cours)
        if (taskStart < now) {
          console.log('⏰ Tâche dépassée détectée:', task.title, 'était à', format(taskStart, 'dd/MM HH:mm'));
          const taskWithConstraints = this.applyProjectConstraints(task);
          tasksToSchedule.push({
            ...taskWithConstraints,
            scheduledStart: undefined,
            scheduledEnd: undefined
          });
        } else {
          // RÈGLE 2: Vérifier les conflits avec les événements
          const conflictingEvent = this.findConflictingEvent(task, this.events);
          
          if (conflictingEvent) {
            console.log('⚠️ Tâche programmée en conflit avec un événement:', task.title);
            console.log('🔄 La tâche sera replanifiée après l\'événement:', conflictingEvent.title);
            
            // Ajouter la tâche à replanifier avec une contrainte pour commencer après l'événement
            const taskWithConstraints = this.applyProjectConstraints({
              ...task,
              canStartFrom: addMinutes(new Date(conflictingEvent.endDate), this.options.bufferBetweenTasks)
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
      console.log('✅ Tâches protégées (complétées/programmées sans conflit):', protectedTasks.length);
    }

    // Résoudre les dépendances et trier les tâches
    const resolvedTasks = this.resolveDependencies(tasksToSchedule);
    const sortedTasks = this.prioritizeTasks(resolvedTasks);
    
    // Programmer chaque tâche à partir de maintenant
    const newlyScheduledTasks: Task[] = [];
    const startDate = now; // Commencer à partir de maintenant
    const endDate = addDays(startDate, 30); // Planifier sur 30 jours

    console.log(`🎯 Planification de ${sortedTasks.length} tâche(s) par ordre de priorité et dépendances...`);

    for (const task of sortedTasks) {
      // Calculer la date de début la plus tôt possible en fonction des dépendances et contraintes
      const earliestStart = this.calculateEarliestStart(task, protectedTasks, [...protectedTasks, ...newlyScheduledTasks]);
      
      // S'assurer que la contrainte projet est respectée
      const effectiveEarliestStart = Math.max(
        earliestStart.getTime(),
        task.canStartFrom?.getTime() || earliestStart.getTime()
      );
      
      const scheduledTask = this.scheduleTask(
        { ...task, canStartFrom: new Date(effectiveEarliestStart) }, 
        startDate, 
        endDate, 
        [...protectedTasks, ...newlyScheduledTasks]
      );
      
      if (scheduledTask) {
        newlyScheduledTasks.push(scheduledTask);
        // CORRECTION : Affichage plus précis du statut
        const isReallyOverdue = this.isTaskOverdue(task);
        const overdueNote = isReallyOverdue ? ' (était VRAIMENT en retard - deadline dépassée)' : '';
        const projectNote = task.projectId ? ' (contraintes projet appliquées)' : '';
        console.log('✅ Tâche programmée:', task.title, 'à', format(scheduledTask.scheduledStart!, 'dd/MM HH:mm') + overdueNote + projectNote);
      } else {
        console.log('❌ Impossible de programmer:', task.title);
        newlyScheduledTasks.push(task); // Garder la tâche même si non programmée
      }
    }

    const result = [...protectedTasks, ...newlyScheduledTasks];
    
    // CORRECTION : Statistiques plus précises
    const reallyOverdueTasks = result.filter(t => this.isTaskOverdue(t));
    
    console.log('📊 Résumé de la planification avec contraintes projet CORRIGÉES:');
    console.log(`   - Tâches traitées: ${result.length}`);
    console.log(`   - Tâches programmées: ${result.filter(t => t.scheduledStart && !t.completed).length}`);
    console.log(`   - Tâches non programmées: ${result.filter(t => !t.scheduledStart && !t.completed).length}`);
    console.log(`   - Tâches terminées: ${result.filter(t => t.completed).length}`);
    console.log(`   - Tâches en cours (protégées): ${result.filter(t => this.isTaskInProgress(t)).length}`);
    console.log(`   - Tâches VRAIMENT en retard (deadline dépassée): ${reallyOverdueTasks.length}`);
    console.log(`   - Tâches avec dépendances: ${result.filter(t => t.dependencies && t.dependencies.length > 0).length}`);
    console.log(`   - Tâches liées à des projets: ${result.filter(t => t.projectId).length}`);

    return result;
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
   * Programme une tâche spécifique dans le premier créneau disponible
   * CORRECTION ABSOLUE: Respecter strictement la contrainte canStartFrom
   */
  private scheduleTask(task: Task, startDate: Date, endDate: Date, existingTasks: Task[]): Task | null {
    console.log('🔍 Recherche de créneau pour:', task.title, '(durée:', task.estimatedDuration, 'min)');
    
    // VÉRIFICATION PRÉALABLE de la contrainte canStartFrom
    if (task.canStartFrom) {
      console.log('🔒 CONTRAINTE DÉTECTÉE "peut commencer à partir de":', format(task.canStartFrom, 'dd/MM HH:mm'));
    }
    
    const now = new Date();
    
    // CORRECTION ABSOLUE: La contrainte canStartFrom est PRIORITAIRE sur tout
    let effectiveStartTime = Math.max(
      startDate.getTime(),
      now.getTime() // Jamais avant maintenant
    );
    
    // CONTRAINTE ABSOLUE: Si canStartFrom est défini, il est IMPÉRATIF
    if (task.canStartFrom) {
      effectiveStartTime = Math.max(effectiveStartTime, task.canStartFrom.getTime());
      console.log('🔒 CONTRAINTE ABSOLUE APPLIQUÉE "peut commencer à partir de":', format(new Date(effectiveStartTime), 'dd/MM HH:mm'));
    }
    
    let currentDate = new Date(effectiveStartTime);
    
    console.log('⏰ Recherche de créneau à partir de (CONTRAINTE RESPECTÉE):', format(currentDate, 'dd/MM HH:mm'));
    
    // Chercher jour par jour jusqu'à la deadline (avec extension possible si en retard)
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
        // CORRECTION ABSOLUE: Le créneau DOIT respecter la contrainte
        const adjustedSlotStart = new Date(Math.max(slot.start.getTime(), effectiveStartTime));
        
        if (adjustedSlotStart >= slot.end) {
          continue; // Le créneau est entièrement avant notre contrainte
        }
        
        const availableSlotEnd = slot.end;
        const slotDuration = (availableSlotEnd.getTime() - adjustedSlotStart.getTime()) / (1000 * 60);
        
        if (slotDuration >= task.estimatedDuration) {
          // Créneau trouvé !
          const scheduledStart = adjustedSlotStart;
          const scheduledEnd = addMinutes(scheduledStart, task.estimatedDuration);
          
          // VÉRIFICATION FINALE ABSOLUE: La tâche ne commence PAS avant canStartFrom
          if (task.canStartFrom && scheduledStart < task.canStartFrom) {
            console.log('🚨 ERREUR: Tentative de programmer avant canStartFrom - REJET du créneau');
            continue;
          }
          
          // VÉRIFICATION FINALE : S'assurer qu'il n'y a pas de conflit avec les événements
          const testTask: Task = {
            ...task,
            scheduledStart,
            scheduledEnd
          };
          
          if (this.checkEventConflict(testTask, this.events)) {
            console.log('🚫 Créneau trouvé mais en conflit avec un événement, passage au suivant');
            continue;
          }
          
          console.log('✅ Créneau validé (CONTRAINTE RESPECTÉE + sans conflit):', format(scheduledStart, 'dd/MM HH:mm'), '-', format(scheduledEnd, 'HH:mm'));
          
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

    console.log('❌ Aucun créneau valide trouvé pour:', task.title, '(contrainte canStartFrom respectée)');
    return null;
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
