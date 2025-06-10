
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { Inbox } from './components/Inbox';
import { ProjectList } from './components/ProjectList';
import { ProjectTemplates } from './components/ProjectTemplates';
import { TaskTypeSettings } from './components/TaskTypeSettings';
import { useTasks } from './hooks/useTasks';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  const {
    tasks,
    events,
    inboxItems,
    projects,
    taskTypes,
    projectTemplates,
    filter,
    setFilter,
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
    createProjectFromTemplate,
  } = useTasks();

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={
            <Dashboard 
              tasks={tasks}
              events={events}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onAddEvent={addEvent}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
              projects={projects}
              taskTypes={taskTypes}
            />
          } />
          
          <Route path="/tasks" element={
            <TaskList
              tasks={tasks}
              events={events}
              projects={projects}
              taskTypes={taskTypes}
              filter={filter}
              setFilter={setFilter}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onAddEvent={addEvent}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
            />
          } />
          
          <Route path="/inbox" element={
            <Inbox
              inboxItems={inboxItems}
              onAddInboxItem={addInboxItem}
              onDeleteInboxItem={deleteInboxItem}
              onConvertToTask={addTask}
              projects={projects}
              taskTypes={taskTypes}
            />
          } />
          
          <Route path="/projects" element={
            <ProjectList
              projects={projects}
              tasks={tasks}
              onAddProject={addProject}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              taskTypes={taskTypes}
            />
          } />
          
          <Route path="/templates" element={
            <ProjectTemplates
              templates={projectTemplates}
              onAddTemplate={addProjectTemplate}
              onUpdateTemplate={updateProjectTemplate}
              onDeleteTemplate={deleteProjectTemplate}
              onCreateProjectFromTemplate={createProjectFromTemplate}
            />
          } />
          
          <Route path="/settings" element={
            <TaskTypeSettings
              taskTypes={taskTypes}
              onAddTaskType={addTaskType}
              onUpdateTaskType={updateTaskType}
              onDeleteTaskType={deleteTaskType}
            />
          } />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;
