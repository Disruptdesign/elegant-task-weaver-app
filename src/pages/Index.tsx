
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { TaskList } from '../components/TaskList';
import { CalendarView } from '../components/CalendarView';
import { Inbox } from '../components/Inbox';
import { TaskForm } from '../components/TaskForm';
import { useTasks } from '../hooks/useTasks';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<{ title: string; description?: string } | undefined>();
  
  const {
    tasks,
    inboxItems,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    rescheduleAllTasks,
    addInboxItem,
    deleteInboxItem,
    convertInboxItemToTask,
  } = useTasks();

  const handleConvertInboxItem = (item: any) => {
    const initialData = convertInboxItemToTask(item);
    setTaskFormData(initialData);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setTaskFormData(undefined);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} onEditTask={updateTask} />;
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
        return <CalendarView tasks={tasks} onUpdateTask={updateTask} />;
      case 'inbox':
        return (
          <Inbox
            inboxItems={inboxItems}
            onAddInboxItem={addInboxItem}
            onDeleteInboxItem={deleteInboxItem}
            onConvertToTask={handleConvertInboxItem}
          />
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Paramètres</h1>
            <p className="text-gray-600">
              Cette section sera développée dans une prochaine version.
            </p>
          </div>
        );
      default:
        return <Dashboard tasks={tasks} onEditTask={updateTask} />;
    }
  };

  return (
    <>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderContent()}
      </Layout>
      
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={handleTaskFormClose}
        onSubmit={addTask}
        initialData={taskFormData}
      />
    </>
  );
};

export default Index;
