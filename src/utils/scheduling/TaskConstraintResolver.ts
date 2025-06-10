
import { addMinutes, format } from 'date-fns';
import { Task } from '../../types/task';

export class TaskConstraintResolver {
  private projects: any[];

  constructor(projects: any[] = []) {
    this.projects = projects;
  }

  /**
   * CORRECTION CRITIQUE POUR MOUVEMENT BIDIRECTIONNEL: Application des contraintes de projet
   * PERMETTRE LE RECUL quand le projet recule, tout en respectant les contraintes existantes
   */
  applyProjectConstraints(task: Task, preserveExistingCanStartFrom: boolean = true): Task {
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

    console.log('🎯 APPLICATION BIDIRECTIONNELLE des contraintes projet pour:', task.title);
    console.log('   Projet:', project.title, format(projectStart, 'dd/MM'), '-', format(projectEnd, 'dd/MM'));
    console.log('   Tâche deadline originale:', format(taskDeadline, 'dd/MM'));
    console.log('   Mode préservation canStartFrom:', preserveExistingCanStartFrom);
    
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

    // CONTRAINTE 2 CRITIQUE - CORRECTION BIDIRECTIONNELLE:
    // Permettre le mouvement dans les DEUX directions (avant ET arrière)
    const existingCanStartFrom = task.canStartFrom?.getTime() || 0;
    const projectStartTime = projectStart.getTime();
    const nowTime = now.getTime();
    
    console.log('🔍 ANALYSE BIDIRECTIONNELLE des contraintes:');
    console.log('   - Contrainte existante (canStartFrom):', existingCanStartFrom ? format(new Date(existingCanStartFrom), 'dd/MM HH:mm') : 'aucune');
    console.log('   - Contrainte projet (début):', format(projectStart, 'dd/MM HH:mm'));
    console.log('   - Contrainte temps (maintenant):', format(now, 'dd/MM HH:mm'));

    let absoluteEarliestStart: number;
    
    if (preserveExistingCanStartFrom && existingCanStartFrom > 0) {
      // CORRECTION CLÉE: En mode replanification, PERMETTRE le recul si le projet a reculé
      // Ne plus bloquer avec Math.max(existingCanStartFrom, nowTime)
      
      // Si le projet a reculé et que la contrainte existante était basée sur l'ancien projet,
      // nous devons permettre à la tâche de reculer aussi
      if (projectStartTime < existingCanStartFrom) {
        console.log('🔄 DÉTECTION RECUL PROJET: Le projet a reculé, autorisation du recul de la tâche');
        // Prendre la nouvelle date projet comme référence, en respectant "maintenant" comme minimum
        absoluteEarliestStart = Math.max(projectStartTime, nowTime);
      } else {
        // Le projet n'a pas reculé ou a avancé, garder la contrainte existante
        absoluteEarliestStart = Math.max(existingCanStartFrom, projectStartTime, nowTime);
      }
    } else {
      // Mode normal: prendre la plus restrictive en respectant maintenant
      absoluteEarliestStart = Math.max(projectStartTime, nowTime);
    }
    
    updatedTask.canStartFrom = new Date(absoluteEarliestStart);

    console.log('🔒 CONTRAINTE FINALE BIDIRECTIONNELLE CALCULÉE:');
    console.log('   - 🎯 RÉSULTAT FINAL (mouvement bidirectionnel autorisé):', format(updatedTask.canStartFrom, 'dd/MM HH:mm'));
    
    return updatedTask;
  }

  /**
   * CORRECTION MAJEURE: Vérifie si une tâche est en retard UNIQUEMENT basé sur sa deadline
   * La date canStartFrom ne doit JAMAIS influencer le statut "en retard"
   */
  isTaskOverdue(task: Task): boolean {
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
   * Vérifie si une tâche est actuellement en cours d'exécution
   */
  isTaskInProgress(task: Task): boolean {
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
   * CORRECTION ABSOLUE POUR REPLANIFICATION: La contrainte canStartFrom ne peut JAMAIS être violée
   */
  calculateEarliestStart(task: Task, completedTasks: Task[], scheduledTasks: Task[]): Date {
    const now = new Date();
    
    // RÈGLE ABSOLUE: canStartFrom est PRIORITAIRE sur TOUT
    let absoluteEarliestStart = task.canStartFrom || now;
    
    // CORRECTION BIDIRECTIONNELLE: Permettre le recul si canStartFrom est dans le passé
    // mais au minimum maintenant pour les nouvelles planifications
    if (!task.canStartFrom) {
      absoluteEarliestStart = new Date(Math.max(absoluteEarliestStart.getTime(), now.getTime()));
    } else {
      // Si canStartFrom existe, le respecter même s'il est dans le passé (cas du recul de projet)
      console.log('🔒 CONTRAINTE BIDIRECTIONNELLE pour', task.title, ':', format(task.canStartFrom, 'dd/MM HH:mm'));
      console.log('   AUTORISATION mouvement bidirectionnel (peut reculer si projet a reculé)');
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
          const depEndWithBuffer = addMinutes(depEnd, 15); // Use default buffer
          
          // RÈGLE CRITIQUE: La contrainte absolue canStartFrom ne peut JAMAIS être violée
          const candidateStart = Math.max(depEndWithBuffer.getTime(), absoluteEarliestStart.getTime());
          
          if (candidateStart > absoluteEarliestStart.getTime()) {
            absoluteEarliestStart = new Date(candidateStart);
            console.log('   ⏰ Dépendance appliquée mais contrainte canStartFrom RESPECTÉE:', format(absoluteEarliestStart, 'dd/MM HH:mm'));
          }
        }
      }
    }
    
    // VÉRIFICATION FINALE CRITIQUE
    if (task.canStartFrom && absoluteEarliestStart < task.canStartFrom) {
      console.log('🚨 ERREUR FINALE DÉTECTÉE: Correction forcée de la contrainte');
      absoluteEarliestStart = task.canStartFrom;
    }
    
    console.log('🎯 Date de début FINALE BIDIRECTIONNELLE pour', task.title, ':', format(absoluteEarliestStart, 'dd/MM HH:mm'));
    return absoluteEarliestStart;
  }
}
