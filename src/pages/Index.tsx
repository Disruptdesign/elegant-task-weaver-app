
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { TaskList } from '../components/TaskList';
import { CalendarView } from '../components/CalendarView';
import { Inbox } from '../components/Inbox';
import { ProjectList } from '../components/ProjectList';
import { TaskTypeSettings } from '../components/TaskTypeSettings';
import { AddItemForm } from '../components/AddItemForm';
import { QuickInbox } from '../components/QuickInbox';
import { useTasks } from '../hooks/useTasks';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<{ title: string; description?: string } | undefined>();
  
  const {
    tasks,
    events,
    inboxItems,
    projects,
    taskTypes,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    rescheduleAllTasks,
    addEvent,
    updateEvent,
    deleteEvent,
    addInboxItem,
    deleteInboxItem,
    convertInboxItemToTask,
    addProject,
    updateProject,
    deleteProject,
    addTaskType,
    updateTaskType,
    deleteTaskType,
  } = useTasks();

  const handleConvertInboxItem = (item: any) => {
    const initialData = convertInboxItemToTask(item, false); // Ne pas supprimer automatiquement
    setTaskFormData(initialData);
    setIsAddFormOpen(true);
  };

  const handleAddFormClose = () => {
    setIsAddFormOpen(false);
    setTaskFormData(undefined);
  };

  const handleTaskSubmit = (taskData: any) => {
    addTask(taskData);
    // Si c'était une conversion d'inbox, supprimer l'item maintenant
    if (taskFormData) {
      const inboxItem = inboxItems.find(item => 
        item.title === taskFormData.title && item.description === taskFormData.description
      );
      if (inboxItem) {
        deleteInboxItem(inboxItem.id);
      }
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} events={events} onEditTask={updateTask} />;
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onCompleteTask={completeTask}
            onReschedule={rescheduleAllTasks}
          />
        );
      case 'calendar':
        return <CalendarView tasks={tasks} events={events} onUpdateTask={updateTask} />;
      case 'inbox':
        return (
          <Inbox
            inboxItems={inboxItems}
            onAddInboxItem={addInboxItem}
            onDeleteInboxItem={deleteInboxItem}
            onConvertToTask={handleConvertInboxItem}
          />
        );
      case 'projects':
        return (
          <ProjectList
            projects={projects}
            tasks={tasks}
            onAddProject={addProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onEditTask={updateTask}
          />
        );
      case 'settings':
        return <TaskTypeSettings 
          taskTypes={taskTypes}
          onAddTaskType={addTaskType}
          onUpdateTaskType={updateTaskType}
          onDeleteTaskType={deleteTaskType}
        />;
      default:
        return <Dashboard tasks={tasks} events={events} onEditTask={updateTask} />;
    }
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onViewChange={setCurrentView}
        sidebarFooter={<QuickInbox onAddInboxItem={addInboxItem} />}
      >
        {renderContent()}
      </Layout>
      
      <AddItemForm
        isOpen={isAddFormOpen}
        onClose={handleAddFormClose}
        onSubmitTask={handleTaskSubmit}
        onSubmitEvent={addEvent}
        initialData={taskFormData}
        projects={projects}
        taskTypes={taskTypes}
      />
    </>
  );
};

export default Index;
