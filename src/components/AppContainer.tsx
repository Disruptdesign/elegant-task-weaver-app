import React, { useState } from 'react';
import { Layout } from './Layout';
import { AppContent } from './AppContent';
import { useSupabaseTasks } from '../hooks/useSupabaseTasks';
import { useUsers } from '../hooks/useUsers';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

export function AppContainer() {
  const [currentView, setCurrentView] = useState('dashboard');
  
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

  const { users } = useUsers();

  const handleTaskEdit = (id: string, data: any) => {
    updateTask(id, data);
  };

  const handleEventEdit = (id: string, data: any) => {
    updateEvent(id, data);
  };

  const handleConvertToTask = (item: any) => {
    addTask({
      title: item.content,
      description: '',
      priority: 'medium',
      estimatedDuration: 60,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    deleteInboxItem(item.id);
  };

  const handleCompleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  };

  const handleReschedule = async () => {
    await refreshData();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Erreur de connexion :</strong><br />
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView}
    >
      <AppContent
        currentView={currentView}
        tasks={tasks}
        events={events}
        inboxItems={inboxItems}
        projects={projects}
        taskTypes={taskTypes}
        projectTemplates={projectTemplates}
        onEditTask={handleTaskEdit}
        onEditEvent={handleEventEdit}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onAddEvent={addEvent}
        onUpdateEvent={updateEvent}
        onAddInboxItem={addInboxItem}
        onDeleteInboxItem={deleteInboxItem}
        onConvertToTask={handleConvertToTask}
        onAddProject={addProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
        onAddTaskType={addTaskType}
        onUpdateTaskType={updateTaskType}
        onDeleteTaskType={deleteTaskType}
        onAddTemplate={addProjectTemplate}
        onUpdateTemplate={updateProjectTemplate}
        onDeleteTemplate={deleteProjectTemplate}
        onCreateProjectFromTemplate={createProjectFromTemplate}
        onCompleteTask={handleCompleteTask}
        onReschedule={handleReschedule}
      />
    </Layout>
  );
}
