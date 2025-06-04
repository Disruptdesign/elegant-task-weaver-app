
import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { AppContent } from '../components/AppContent';
import { AddItemForm } from '../components/AddItemForm';
import { QuickInbox } from '../components/QuickInbox';
import { AuthWrapper } from '../components/AuthWrapper';
import { useSupabaseTasks } from '../hooks/useSupabaseTasks';
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
    isLoading,
    error,
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
    refreshData,
  } = useSupabaseTasks();

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

  // Optimisation des callbacks avec les nouvelles fonctions async
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

  console.log('Index: Supabase metrics:', {
    tasks: tasks.length,
    events: events.length,
    projects: projects.length,
    taskTypes: taskTypes.length,
    isLoading,
    error,
    isAddFormOpen,
  });

  const handleConvertItem = (item: any) => {
    handleConvertInboxItem(item, openAddForm);
  };

  const handleTaskFormSubmit = async (taskData: any) => {
    await handleTaskSubmit(taskData, taskFormData, closeAddForm);
    // Rafraîchir les données après ajout
    await refreshData();
  };

  // Calculer les statistiques pour l'affichage
  const completedTasksCount = tasks.filter(task => task.completed).length;
  const pendingTasksCount = tasks.filter(task => !task.completed).length;

  if (isLoading) {
    return (
      <AuthWrapper>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos données...</p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  if (error) {
    return (
      <AuthWrapper>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
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
    </AuthWrapper>
  );
};

export default Index;
