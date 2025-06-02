
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading des composants principaux
export const LazyDashboard = lazy(() => import('./Dashboard'));
export const LazyTaskList = lazy(() => import('./TaskList').then(module => ({ default: module.TaskList })));
export const LazyCalendarView = lazy(() => import('./CalendarView').then(module => ({ default: module.CalendarView })));
export const LazyInbox = lazy(() => import('./Inbox'));
export const LazyProjectList = lazy(() => import('./ProjectList').then(module => ({ default: module.ProjectList })));
export const LazyTaskTypeSettings = lazy(() => import('./TaskTypeSettings').then(module => ({ default: module.TaskTypeSettings })));

// Composant de chargement pour les composants lazy
export const ComponentSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-1/3" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// HOC pour wrapper les composants lazy avec Suspense
export const withLazySuspense = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Suspense fallback={<ComponentSkeleton />}>
      <Component {...props} />
    </Suspense>
  );
};
