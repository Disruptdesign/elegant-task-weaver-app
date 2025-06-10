
import { Task } from '../../types/task';
import { TaskConstraintResolver } from './TaskConstraintResolver';

export class DependencyResolver {
  private constraintResolver: TaskConstraintResolver;

  constructor(constraintResolver: TaskConstraintResolver) {
    this.constraintResolver = constraintResolver;
  }

  /**
   * Résout les dépendances des tâches et retourne un ordre de planification valide
   */
  resolveDependencies(tasks: Task[]): Task[] {
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
      const isOverdue = this.constraintResolver.isTaskOverdue(task);
      const overdueMsg = isOverdue ? ' (EN RETARD - priorité conservée)' : '';
      console.log(`   ${index + 1}. ${task.title} ${deps > 0 ? `(dépend de ${deps} tâche(s))` : '(aucune dépendance)'}${overdueMsg}`);
    });
    
    return resolved;
  }

  /**
   * Priorise les tâches selon leur priorité et deadline
   */
  prioritizeTasks(tasks: Task[]): Task[] {
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
}
