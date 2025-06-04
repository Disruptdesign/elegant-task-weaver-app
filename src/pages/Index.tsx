
import React, { Suspense } from 'react';
import { AuthWrapper } from '../components/AuthWrapper';
import { useSupabaseTasks } from '../hooks/useSupabaseTasks';
import Dashboard from '../components/Dashboard';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

function TaskManager() {
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
    <Dashboard
      tasks={tasks}
      events={events}
      inboxItems={inboxItems}
      projects={projects}
      taskTypes={taskTypes}
      projectTemplates={projectTemplates}
      onAddTask={addTask}
      onUpdateTask={updateTask}
      onDeleteTask={deleteTask}
      onAddEvent={addEvent}
      onUpdateEvent={updateEvent}
      onDeleteEvent={deleteEvent}
      onAddInboxItem={addInboxItem}
      onDeleteInboxItem={deleteInboxItem}
      onAddProject={addProject}
      onUpdateProject={updateProject}
      onDeleteProject={deleteProject}
      onAddTaskType={addTaskType}
      onUpdateTaskType={updateTaskType}
      onDeleteTaskType={deleteTaskType}
      onAddProjectTemplate={addProjectTemplate}
      onUpdateProjectTemplate={updateProjectTemplate}
      onDeleteProjectTemplate={deleteProjectTemplate}
      onCreateProjectFromTemplate={createProjectFromTemplate}
      onRefreshData={refreshData}
    />
  );
}

export default function Index() {
  return (
    <AuthWrapper>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }>
        <TaskManager />
      </Suspense>
    </AuthWrapper>
  );
}
