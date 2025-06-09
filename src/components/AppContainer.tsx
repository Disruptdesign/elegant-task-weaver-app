import React, { lazy, Suspense } from 'react';
import { AuthenticatedLayout } from './AuthenticatedLayout';
import { useAppState } from '../hooks/useAppState';
import { useTasks } from '../hooks/useTasks';
import { useAlgorithmicScheduler } from '../hooks/useAlgorithmicScheduler';

// Fix lazy loading for named exports
const Dashboard = lazy(() => import('./Dashboard'));
const TaskList = lazy(() => import('./TaskList').then(module => ({ default: module.TaskList })));
const CalendarView = lazy(() => import('./CalendarView').then(module => ({ default: module.CalendarView })));
const ProjectList = lazy(() => import('./ProjectList').then(module => ({ default: module.ProjectList })));
const Inbox = lazy(() => import('./Inbox'));
const LazyTaskTypeSettings = lazy(() => import('./TaskTypeSettings').then(module => ({ default: module.TaskTypeSettings })));

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
    taskTypes = [],
    projectTemplates = [],
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
    addProjectTemplate,
    updateProjectTemplate,
    deleteProjectTemplate,
    createProjectFromTemplate
  } = useTasks();

  // Add the algorithmic scheduler for manual reschedule
  const { rescheduleAllTasks } = useAlgorithmicScheduler();

  const handleToggleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
    }
  };

  const handleReschedule = async () => {
    console.log('🔄 Replanification manuelle déclenchée avec contraintes projet');
    const rescheduledTasks = await rescheduleAllTasks(tasks, events, projects);
    
    // Update tasks with the rescheduled versions
    rescheduledTasks.forEach(task => {
      const originalTask = tasks.find(t => t.id === task.id);
      if (originalTask && (
        task.scheduledStart?.getTime() !== originalTask.scheduledStart?.getTime() ||
        task.scheduledEnd?.getTime() !== originalTask.scheduledEnd?.getTime()
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
          <Dashboard 
            tasks={tasks}
            events={events}
            inboxItems={inboxItems}
            projects={projects}
            taskTypes={taskTypes}
            projectTemplates={projectTemplates}
            onAddTask={async (task) => addTask(task)}
            onUpdateTask={async (id, updates) => updateTask(id, updates)}
            onDeleteTask={async (id) => deleteTask(id)}
            onAddEvent={async (event) => addEvent(event)}
            onUpdateEvent={async (id, updates) => updateEvent(id, updates)}
            onDeleteEvent={async (id) => deleteEvent(id)}
            onAddInboxItem={async (item) => addInboxItem(item)}
            onDeleteInboxItem={async (id) => deleteInboxItem(id)}
            onAddProject={async (project) => addProject(project)}
            onUpdateProject={async (id, updates) => updateProject(id, updates)}
            onDeleteProject={async (id) => deleteProject(id)}
            onAddTaskType={async (taskType) => addTaskType(taskType)}
            onUpdateTaskType={async (id, updates) => updateTaskType(id, updates)}
            onDeleteTaskType={async (id) => deleteTaskType(id)}
            onAddProjectTemplate={async (template) => addProjectTemplate(template)}
            onUpdateProjectTemplate={async (id, updates) => updateProjectTemplate(id, updates)}
            onDeleteProjectTemplate={async (id) => deleteProjectTemplate(id)}
            onCreateProjectFromTemplate={async (templateId, projectData) => createProjectFromTemplate(templateId, projectData)}
            onRefreshData={async () => {}}
            onConvertToTask={async (item) => {
              await addTask({
                title: item.title,
                description: item.description,
                priority: 'medium',
                estimatedDuration: 30,
                deadline: new Date()
              });
              await deleteInboxItem(item.id);
            }}
          />
        );
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            events={events}
            onUpdateTask={async (id, updates) => updateTask(id, updates)}
            onDeleteTask={async (id) => deleteTask(id)}
            onUpdateEvent={async (id, updates) => updateEvent(id, updates)}
            onDeleteEvent={async (id) => deleteEvent(id)}
            onCompleteTask={handleToggleTaskComplete}
            onAddTask={async (task) => addTask(task)}
            onAddEvent={async (event) => addEvent(event)}
            onReschedule={handleReschedule}
            projects={projects}
            taskTypes={taskTypes}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            tasks={tasks} 
            events={events} 
            projects={projects}
            onUpdateTask={async (id, updates) => updateTask(id, updates)}
            onUpdateEvent={async (id, updates) => updateEvent(id, updates)}
            addTask={async (task) => addTask(task)}
            addEvent={async (event) => addEvent(event)}
          />
        );
      case 'projects':
        return <ProjectList 
          projects={projects} 
          tasks={tasks}
          onAddProject={async (project) => addProject(project)}
          onUpdateProject={async (id, updates) => updateProject(id, updates)}
          onDeleteProject={async (id) => deleteProject(id)}
          onAddTask={async (task) => addTask(task)}
        />;
      case 'inbox':
        return (
          <Inbox
            inboxItems={inboxItems}
            onAddInboxItem={addInboxItem}
            onDeleteInboxItem={deleteInboxItem}
            onConvertToTask={async (item) => {
              await addTask({
                title: item.title,
                description: item.description,
                priority: 'medium',
                estimatedDuration: 30,
                deadline: new Date()
              });
              await deleteInboxItem(item.id);
            }}
          />
        );
      case 'settings':
        return <LazyTaskTypeSettings 
          taskTypes={taskTypes}
          onAddTaskType={addTaskType}
          onUpdateTaskType={updateTaskType}
          onDeleteTaskType={deleteTaskType}
        />;
      default:
        return (
          <Dashboard 
            tasks={tasks}
            events={events}
            inboxItems={inboxItems}
            projects={projects}
            taskTypes={taskTypes}
            projectTemplates={projectTemplates}
            onAddTask={async (task) => addTask(task)}
            onUpdateTask={async (id, updates) => updateTask(id, updates)}
            onDeleteTask={async (id) => deleteTask(id)}
            onAddEvent={async (event) => addEvent(event)}
            onUpdateEvent={async (id, updates) => updateEvent(id, updates)}
            onDeleteEvent={async (id) => deleteEvent(id)}
            onAddInboxItem={async (item) => addInboxItem(item)}
            onDeleteInboxItem={async (id) => deleteInboxItem(id)}
            onAddProject={async (project) => addProject(project)}
            onUpdateProject={async (id, updates) => updateProject(id, updates)}
            onDeleteProject={async (id) => deleteProject(id)}
            onAddTaskType={async (taskType) => addTaskType(taskType)}
            onUpdateTaskType={async (id, updates) => updateTaskType(id, updates)}
            onDeleteTaskType={async (id) => deleteTaskType(id)}
            onAddProjectTemplate={async (template) => addProjectTemplate(template)}
            onUpdateProjectTemplate={async (id, updates) => updateProjectTemplate(id, updates)}
            onDeleteProjectTemplate={async (id) => deleteProjectTemplate(id)}
            onCreateProjectFromTemplate={async (templateId, projectData) => createProjectFromTemplate(templateId, projectData)}
            onRefreshData={async () => {}}
            onConvertToTask={async (item) => {
              await addTask({
                title: item.title,
                description: item.description,
                priority: 'medium',
                estimatedDuration: 30,
                deadline: new Date()
              });
              await deleteInboxItem(item.id);
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
