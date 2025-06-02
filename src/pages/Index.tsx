
import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { AppContent } from '../components/AppContent';
import { AddItemForm } from '../components/AddItemForm';
import { QuickInbox } from '../components/QuickInbox';
import { useOptimizedTasks } from '../hooks/useOptimizedTasks';
import { useAppState } from '../hooks/useAppState';
import { useAppHandlers } from '../hooks/useAppHandlers';
import { usePerformanceCache } from '../hooks/usePerformanceCache';
import { useOptimizedCallbacks } from '../hooks/useOptimizedCallbacks';

const Index = () => {
  const {
    currentView,
    setCurrentView,
    isAddFormOpen,
    taskFormData,
    openAddForm,
    closeAddForm,
  } = useAppState();
  
  const {
    tasks,
    events,
    inboxItems,
    projects,
    taskTypes,
    projectTemplates,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addInboxItem,
    deleteInboxItem,
    addProject,
    updateProject,
    deleteProject,
    addTaskType,
    updateTaskType,
    deleteTaskType,
    addProjectTemplate,
    updateProjectTemplate,
    deleteProjectTemplate,
    createProjectFromTemplate,
    tasksByProject,
    completedTasksCount,
    pendingTasksCount,
  } = useOptimizedTasks();

  const {
    handleConvertInboxItem,
    handleCompleteTask,
    handleRescheduleAllTasks,
    handleTaskSubmit,
  } = useAppHandlers();

  const { clearExpiredEntries } = usePerformanceCache();

  // Nettoyage périodique du cache
  useEffect(() => {
    const interval = setInterval(() => {
      clearExpiredEntries();
    }, 60000); // Nettoyage toutes les minutes

    return () => clearInterval(interval);
  }, [clearExpiredEntries]);

  // Optimisation des callbacks
  const optimizedHandlers = useOptimizedCallbacks({
    onEditTask: updateTask,
    onEditEvent: updateEvent,
    onAddTask: addTask,
    onUpdateTask: updateTask,
    onDeleteTask: deleteTask,
    onAddEvent: addEvent,
    onUpdateEvent: updateEvent,
    onAddInboxItem: addInboxItem,
    onDeleteInboxItem: deleteInboxItem,
    onAddProject: addProject,
    onUpdateProject: updateProject,
    onDeleteProject: deleteProject,
    onAddTaskType: addTaskType,
    onUpdateTaskType: updateTaskType,
    onDeleteTaskType: deleteTaskType,
    onAddTemplate: addProjectTemplate,
    onUpdateTemplate: updateProjectTemplate,
    onDeleteTemplate: deleteProjectTemplate,
    onCreateProjectFromTemplate: createProjectFromTemplate,
    onCompleteTask: handleCompleteTask,
    onReschedule: handleRescheduleAllTasks,
  });

  console.log('Index: Performance metrics:', {
    tasks: tasks.length,
    events: events.length,
    projects: projects.length,
    taskTypes: taskTypes.length,
    completedTasks: completedTasksCount,
    pendingTasks: pendingTasksCount,
    isAddFormOpen,
  });

  const handleConvertItem = (item: any) => {
    handleConvertInboxItem(item, openAddForm);
  };

  const handleTaskFormSubmit = (taskData: any) => {
    handleTaskSubmit(taskData, taskFormData, closeAddForm);
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onViewChange={setCurrentView}
        sidebarFooter={<QuickInbox onAddInboxItem={addInboxItem} />}
      >
        <AppContent
          currentView={currentView}
          tasks={tasks}
          events={events}
          inboxItems={inboxItems}
          projects={projects}
          taskTypes={taskTypes}
          projectTemplates={projectTemplates}
          onConvertToTask={handleConvertItem}
          {...optimizedHandlers}
        />
      </Layout>
      
      <AddItemForm
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSubmitTask={handleTaskFormSubmit}
        onSubmitEvent={addEvent}
        initialData={taskFormData}
        projects={projects}
        taskTypes={taskTypes}
      />
    </>
  );
};

export default Index;
