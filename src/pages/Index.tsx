
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { TaskList } from '../components/TaskList';
import { CalendarView } from '../components/CalendarView';
import { useTasks } from '../hooks/useTasks';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    rescheduleAllTasks,
  } = useTasks();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} />;
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
        return <Dashboard tasks={tasks} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
