
import { useCallback } from 'react';
import { useTasks } from './useTasks';

export const useAppHandlers = () => {
  const {
    tasks,
    events,
    projects,
    inboxItems,
    addTask,
    updateTask,
    deleteInboxItem,
    rescheduleAllTasks,
  } = useTasks();

  const handleConvertInboxItem = useCallback((item: any, openAddForm: (data: any) => void) => {
    const initialData = {
      title: item.title,
      description: item.description || '',
    };
    openAddForm(initialData);
  }, []);

  const handleCompleteTask = useCallback((id: string) => {
    console.log('Completing task:', id);
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  }, [tasks, updateTask]);

  const handleRescheduleAllTasks = useCallback(() => {
    console.log('🔄 Reschedule all tasks requested - CORRECTION avec projets');
    console.log('📊 Données disponibles:', {
      tasks: tasks.length,
      events: events.length,
      projects: projects.length,
      projectsDetails: projects.map(p => ({ id: p.id, title: p.title }))
    });
    
    // CORRECTION CRITIQUE: Passer TOUS les projets à la replanification
    rescheduleAllTasks(projects);
  }, [rescheduleAllTasks, tasks, events, projects]);

  const handleTaskSubmit = useCallback((taskData: any, taskFormData: any, closeAddForm: () => void) => {
    console.log('Submitting task with dependencies:', taskData);
    addTask(taskData);
    
    if (taskFormData) {
      const inboxItem = inboxItems.find(item => 
        item.title === taskFormData.title && item.description === taskFormData.description
      );
      if (inboxItem) {
        deleteInboxItem(inboxItem.id);
      }
    }
    closeAddForm();
  }, [addTask, inboxItems, deleteInboxItem]);

  return {
    handleConvertInboxItem,
    handleCompleteTask,
    handleRescheduleAllTasks,
    handleTaskSubmit,
  };
};
