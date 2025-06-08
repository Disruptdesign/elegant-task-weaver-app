
import React, { lazy, Suspense } from 'react';
import { AuthenticatedLayout } from './AuthenticatedLayout';
import { useAppState } from '../hooks/useAppState';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./Dashboard'));
const TaskListContent = lazy(() => import('./TaskListContent'));
const CalendarView = lazy(() => import('./CalendarView'));
const ProjectList = lazy(() => import('./ProjectList'));
const Inbox = lazy(() => import('./Inbox'));
const LazyComponents = lazy(() => import('./LazyComponents'));

export function AppContainer() {
  const { 
    currentView, 
    setCurrentView
  } = useAppState();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TaskListContent />;
      case 'calendar':
        return <CalendarView />;
      case 'projects':
        return <ProjectList />;
      case 'inbox':
        return <Inbox />;
      case 'settings':
        return <LazyComponents />;
      default:
        return <Dashboard />;
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
