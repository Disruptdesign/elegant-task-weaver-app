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
import { SchedulerControls } from '../components/SchedulerControls';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';

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
  } = useTasks();

  console.log('Index: Tasks loaded:', tasks.length);
  console.log('Index: Events loaded:', events.length);
  console.log('Index: Update functions available:', {
    addTask: !!addTask,
    updateTask: !!updateTask,
    addEvent: !!addEvent,
    updateEvent: !!updateEvent
  });

  const handleConvertInboxItem = (item: any) => {
    // Create task data from inbox item
    const initialData = {
      title: item.title,
      description: item.description || '',
    };
    setTaskFormData(initialData);
    setIsAddFormOpen(true);
  };

  const handleCompleteTask = (id: string) => {
    console.log('Completing task:', id);
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  };

  const handleRescheduleAllTasks = () => {
    // Simple rescheduling logic - could be enhanced
    console.log('Reschedule all tasks requested');
  };

  const handleAddFormClose = () => {
    setIsAddFormOpen(false);
    setTaskFormData(undefined);
  };

  const handleTaskSubmit = (taskData: any) => {
    console.log('Submitting task:', taskData);
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

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    console.log('🔄 Mise à jour des tâches depuis le planificateur');
    updatedTasks.forEach(task => {
      const existingTask = tasks.find(t => t.id === task.id);
      if (existingTask && (
        task.scheduledStart?.getTime() !== existingTask.scheduledStart?.getTime() ||
        task.scheduledEnd?.getTime() !== existingTask.scheduledEnd?.getTime()
      )) {
        updateTask(task.id, {
          scheduledStart: task.scheduledStart,
          scheduledEnd: task.scheduledEnd
        });
      }
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <SchedulerControls 
              tasks={tasks} 
              events={events} 
              onTasksUpdate={handleTasksUpdate}
            />
            <Dashboard tasks={tasks} events={events} onEditTask={updateTask} onEditEvent={updateEvent} />
          </div>
        );
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onCompleteTask={handleCompleteTask}
            onReschedule={handleRescheduleAllTasks}
          />
        );
      case 'calendar':
        console.log('Rendering calendar with:', { tasks: tasks.length, events: events.length });
        return (
          <CalendarView 
            tasks={tasks} 
            events={events} 
            onUpdateTask={updateTask} 
            onUpdateEvent={updateEvent}
            addTask={addTask}
            addEvent={addEvent}
          />
        );
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
        return <Dashboard tasks={tasks} events={events} onEditTask={updateTask} onEditEvent={updateEvent} />;
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
