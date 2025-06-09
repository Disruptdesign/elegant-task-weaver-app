
import React from 'react';
import { 
  LazyDashboard,
  LazyTaskList,
  LazyCalendarView,
  LazyInbox,
  LazyProjectList,
  LazyTaskTypeSettings,
  withLazySuspense
} from './LazyComponents';
import Dashboard from './Dashboard';

interface AppContentProps {
  currentView: string;
  tasks: any[];
  events: any[];
  inboxItems: any[];
  projects: any[];
  taskTypes: any[];
  projectTemplates: any[];
  onEditTask: (id: string, data: any) => void;
  onEditEvent: (id: string, data: any) => void;
  onAddTask: (data: any) => Promise<void>;
  onUpdateTask: (id: string, data: any) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddEvent: (data: any) => Promise<void>;
  onUpdateEvent: (id: string, data: any) => Promise<void>;
  onAddInboxItem: (data: any) => Promise<void>;
  onDeleteInboxItem: (id: string) => Promise<void>;
  onConvertToTask: (item: any) => Promise<void>;
  onAddProject: (data: any) => Promise<void>;
  onUpdateProject: (id: string, data: any) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddTaskType: (data: any) => Promise<void>;
  onUpdateTaskType: (id: string, data: any) => Promise<void>;
  onDeleteTaskType: (id: string) => Promise<void>;
  onAddTemplate: (data: any) => Promise<void>;
  onUpdateTemplate: (id: string, data: any) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onCreateProjectFromTemplate: (templateId: string, projectData: any) => Promise<void>;
  onCompleteTask: (id: string) => void;
  onReschedule: () => Promise<void>;
}

export const AppContent: React.FC<AppContentProps> = ({
  currentView,
  tasks,
  events,
  inboxItems,
  projects,
  taskTypes,
  projectTemplates,
  onEditTask,
  onEditEvent,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddEvent,
  onUpdateEvent,
  onAddInboxItem,
  onDeleteInboxItem,
  onConvertToTask,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTaskType,
  onUpdateTaskType,
  onDeleteTaskType,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onCreateProjectFromTemplate,
  onCompleteTask,
  onReschedule,
}) => {
  // Wrapping des composants avec lazy suspense
  const TaskList = withLazySuspense(LazyTaskList);
  const CalendarView = withLazySuspense(LazyCalendarView);
  const Inbox = withLazySuspense(LazyInbox);
  const ProjectList = withLazySuspense(LazyProjectList);
  const TaskTypeSettings = withLazySuspense(LazyTaskTypeSettings);

  switch (currentView) {
    case 'dashboard':
      return (
        <Dashboard 
          tasks={tasks} 
          events={events} 
          inboxItems={inboxItems}
          projects={projects}
          taskTypes={taskTypes}
          projectTemplates={projectTemplates}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddEvent={onAddEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteTask}
          onAddInboxItem={onAddInboxItem}
          onDeleteInboxItem={onDeleteInboxItem}
          onConvertToTask={onConvertToTask}
          onAddProject={onAddProject}
          onUpdateProject={onUpdateProject}
          onDeleteProject={onDeleteProject}
          onAddTaskType={onAddTaskType}
          onUpdateTaskType={onUpdateTaskType}
          onDeleteTaskType={onDeleteTaskType}
          onAddProjectTemplate={onAddTemplate}
          onUpdateProjectTemplate={onUpdateTemplate}
          onDeleteProjectTemplate={onDeleteTemplate}
          onCreateProjectFromTemplate={onCreateProjectFromTemplate}
          onRefreshData={onReschedule}
        />
      );
    case 'tasks':
      return (
        <TaskList
          tasks={tasks}
          events={events}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddEvent={onAddEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteTask}
          onCompleteTask={onCompleteTask}
          onReschedule={onReschedule}
          projects={projects}
          taskTypes={taskTypes}
        />
      );
    case 'calendar':
      console.log('Rendering calendar with:', { tasks: tasks.length, events: events.length });
      return (
        <CalendarView 
          tasks={tasks} 
          events={events} 
          onUpdateTask={onUpdateTask} 
          onUpdateEvent={onUpdateEvent}
          addTask={onAddTask}
          addEvent={onAddEvent}
          projects={projects}
        />
      );
    case 'inbox':
      return (
        <Inbox
          inboxItems={inboxItems}
          onAddInboxItem={onAddInboxItem}
          onDeleteInboxItem={onDeleteInboxItem}
          onConvertToTask={onConvertToTask}
        />
      );
    case 'projects':
      return (
        <ProjectList
          projects={projects}
          tasks={tasks}
          onAddProject={onAddProject}
          onUpdateProject={onUpdateProject}
          onDeleteProject={onDeleteProject}
          onEditTask={onEditTask}
          projectTemplates={projectTemplates}
          onAddTemplate={onAddTemplate}
          onUpdateTemplate={onUpdateTemplate}
          onDeleteTemplate={onDeleteTemplate}
          onCreateProjectFromTemplate={onCreateProjectFromTemplate}
        />
      );
    case 'settings':
      return (
        <TaskTypeSettings 
          taskTypes={taskTypes}
          onAddTaskType={onAddTaskType}
          onUpdateTaskType={onUpdateTaskType}
          onDeleteTaskType={onDeleteTaskType}
        />
      );
    default:
      return (
        <Dashboard 
          tasks={tasks} 
          events={events} 
          inboxItems={inboxItems}
          projects={projects}
          taskTypes={taskTypes}
          projectTemplates={projectTemplates}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddEvent={onAddEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteTask}
          onAddInboxItem={onAddInboxItem}
          onDeleteInboxItem={onDeleteInboxItem}
          onConvertToTask={onConvertToTask}
          onAddProject={onAddProject}
          onUpdateProject={onUpdateProject}
          onDeleteProject={onDeleteProject}
          onAddTaskType={onAddTaskType}
          onUpdateTaskType={onUpdateTaskType}
          onDeleteTaskType={onDeleteTaskType}
          onAddProjectTemplate={onAddTemplate}
          onUpdateProjectTemplate={onUpdateTemplate}
          onDeleteProjectTemplate={onDeleteTemplate}
          onCreateProjectFromTemplate={onCreateProjectFromTemplate}
          onRefreshData={onReschedule}
        />
      );
  }
};
