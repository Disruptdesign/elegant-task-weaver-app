
import React from 'react';
import { Dashboard } from './Dashboard';
import { TaskList } from './TaskList';
import { CalendarView } from './CalendarView';
import { Inbox } from './Inbox';
import { ProjectList } from './ProjectList';
import { TaskTypeSettings } from './TaskTypeSettings';

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
  onAddTask: (data: any) => void;
  onUpdateTask: (id: string, data: any) => void;
  onDeleteTask: (id: string) => void;
  onAddEvent: (data: any) => void;
  onUpdateEvent: (id: string, data: any) => void;
  onAddInboxItem: (data: any) => void;
  onDeleteInboxItem: (id: string) => void;
  onConvertToTask: (item: any) => void;
  onAddProject: (data: any) => void;
  onUpdateProject: (id: string, data: any) => void;
  onDeleteProject: (id: string) => void;
  onAddTaskType: (data: any) => void;
  onUpdateTaskType: (id: string, data: any) => void;
  onDeleteTaskType: (id: string) => void;
  onAddTemplate: (data: any) => void;
  onUpdateTemplate: (id: string, data: any) => void;
  onDeleteTemplate: (id: string) => void;
  onCreateProjectFromTemplate: (templateId: string, projectData: any) => void;
  onCompleteTask: (id: string) => void;
  onReschedule: () => void;
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
  switch (currentView) {
    case 'dashboard':
      return (
        <Dashboard 
          tasks={tasks} 
          events={events} 
          onEditTask={onEditTask} 
          onEditEvent={onEditEvent}
          projects={projects}
        />
      );
    case 'tasks':
      return (
        <TaskList
          tasks={tasks}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
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
          onEditTask={onEditTask} 
          onEditEvent={onEditEvent} 
          projects={projects} 
        />
      );
  }
};
