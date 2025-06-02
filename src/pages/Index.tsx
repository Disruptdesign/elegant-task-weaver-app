
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { TaskList } from '../components/TaskList';
import { CalendarView } from '../components/CalendarView';
import { Inbox } from '../components/Inbox';
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
  } = useTasks();

  const handleConvertInboxItem = (item: any) => {
    const initialData = convertInboxItemToTask(item);
    setTaskFormData(initialData);
    setIsAddFormOpen(true);
  };

  const handleAddFormClose = () => {
    setIsAddFormOpen(false);
    setTaskFormData(undefined);
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
        onSubmitTask={addTask}
        onSubmitEvent={addEvent}
        initialData={taskFormData}
      />
    </>
  );
};

export default Index;
