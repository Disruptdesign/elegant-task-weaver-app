
import React, { lazy, Suspense } from 'react';
import { AuthenticatedLayout } from './AuthenticatedLayout';
import { useAppState } from '../hooks/useAppState';
import { useTasks } from '../hooks/useTasks';

// Fix lazy loading for named exports
const Dashboard = lazy(() => import('./Dashboard'));
const TaskListContent = lazy(() => import('./TaskListContent').then(module => ({ default: module.TaskListContent })));
const CalendarView = lazy(() => import('./CalendarView').then(module => ({ default: module.CalendarView })));
const ProjectList = lazy(() => import('./ProjectList').then(module => ({ default: module.ProjectList })));
const Inbox = lazy(() => import('./Inbox'));
const LazyComponents = lazy(() => import('./LazyComponents'));

export function AppContainer() {
  const { 
    currentView, 
    setCurrentView
  } = useAppState();

  // Get tasks data using the existing hook
  const {
    tasks = [],
    events = [],
    projects = [],
    inboxItems = [],
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addInboxItem,
    deleteInboxItem,
    toggleTaskComplete,
    loading
  } = useTasks();

  const renderContent = () => {
    // Show loading state while data is being fetched
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Chargement des données...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            tasks={tasks}
            events={events}
            inboxItems={inboxItems}
            projects={projects}
            onAddTask={addTask}
            onAddEvent={addEvent}
            onAddInboxItem={addInboxItem}
            onToggleComplete={toggleTaskComplete}
            onEditTask={updateTask}
            onEditEvent={updateEvent}
            onDeleteTask={deleteTask}
            onDeleteEvent={deleteEvent}
            onDeleteInboxItem={deleteInboxItem}
            onConvertToTask={(item) => {
              addTask({
                title: item.title,
                description: item.description,
                priority: 'medium',
                status: 'todo',
                dueDate: new Date()
              });
              deleteInboxItem(item.id);
            }}
          />
        );
      case 'tasks':
        return (
          <TaskListContent
            items={[
              ...tasks.map(task => ({ ...task, type: 'task' as const })),
              ...events.map(event => ({ ...event, type: 'event' as const }))
            ]}
            hasActiveFilters={false}
            onToggleComplete={toggleTaskComplete}
            onEditTask={updateTask}
            onEditEvent={updateEvent}
            onDeleteTask={deleteTask}
            onDeleteEvent={deleteEvent}
            onAddNew={() => setCurrentView('dashboard')}
            projects={projects}
          />
        );
      case 'calendar':
        return <CalendarView />;
      case 'projects':
        return <ProjectList />;
      case 'inbox':
        return (
          <Inbox
            inboxItems={inboxItems}
            onAddInboxItem={addInboxItem}
            onDeleteInboxItem={deleteInboxItem}
            onConvertToTask={(item) => {
              addTask({
                title: item.title,
                description: item.description,
                priority: 'medium',
                status: 'todo',
                dueDate: new Date()
              });
              deleteInboxItem(item.id);
            }}
          />
        );
      case 'settings':
        return <LazyComponents />;
      default:
        return (
          <Dashboard 
            tasks={tasks}
            events={events}
            inboxItems={inboxItems}
            projects={projects}
            onAddTask={addTask}
            onAddEvent={addEvent}
            onAddInboxItem={addInboxItem}
            onToggleComplete={toggleTaskComplete}
            onEditTask={updateTask}
            onEditEvent={updateEvent}
            onDeleteTask={deleteTask}
            onDeleteEvent={deleteEvent}
            onDeleteInboxItem={deleteInboxItem}
            onConvertToTask={(item) => {
              addTask({
                title: item.title,
                description: item.description,
                priority: 'medium',
                status: 'todo',
                dueDate: new Date()
              });
              deleteInboxItem(item.id);
            }}
          />
        );
    }
  };

  return (
    <AuthenticatedLayout 
      currentView={currentView} 
      onViewChange={setCurrentView}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        {renderContent()}
      </Suspense>
    </AuthenticatedLayout>
  );
}
