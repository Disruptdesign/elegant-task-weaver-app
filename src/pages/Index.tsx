
import React from 'react';
import { Layout } from '../components/Layout';
import { AppContent } from '../components/AppContent';
import { AddItemForm } from '../components/AddItemForm';
import { QuickInbox } from '../components/QuickInbox';
import { useTasks } from '../hooks/useTasks';
import { useAppState } from '../hooks/useAppState';
import { useAppHandlers } from '../hooks/useAppHandlers';

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
  } = useTasks();

  const {
    handleConvertInboxItem,
    handleCompleteTask,
    handleRescheduleAllTasks,
    handleTaskSubmit,
  } = useAppHandlers();

  console.log('Index: Current data state:', {
    tasks: tasks.length,
    events: events.length,
    projects: projects.length,
    taskTypes: taskTypes.length,
    isAddFormOpen,
    projectsDetailed: projects.map(p => ({ id: p.id, title: p.title })),
    taskTypesDetailed: taskTypes.map(t => ({ id: t.id, name: t.name }))
  });

  const handleConvertItem = (item: any) => {
    handleConvertInboxItem(item, openAddForm);
  };

  const handleTaskFormSubmit = (taskData: any) => {
    handleTaskSubmit(taskData, taskFormData, closeAddForm);
  };

  console.log('Index: Before rendering AddItemForm with props:', {
    projects: projects.length,
    taskTypes: taskTypes.length,
    isAddFormOpen
  });

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
          onEditTask={updateTask}
          onEditEvent={updateEvent}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onAddEvent={addEvent}
          onUpdateEvent={updateEvent}
          onAddInboxItem={addInboxItem}
          onDeleteInboxItem={deleteInboxItem}
          onConvertToTask={handleConvertItem}
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
          onReschedule={handleRescheduleAllTasks}
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
