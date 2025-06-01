
import { useState, useEffect } from 'react';
import { Task } from '../types/task';
import { taskScheduler } from '../utils/taskScheduler';

const STORAGE_KEY = 'flowsavvy-tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Charger les tâches depuis le localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        deadline: new Date(task.deadline),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        scheduledStart: task.scheduledStart ? new Date(task.scheduledStart) : undefined,
        scheduledEnd: task.scheduledEnd ? new Date(task.scheduledEnd) : undefined,
      }));
      setTasks(parsedTasks);
    }
  }, []);

  // Sauvegarder les tâches dans le localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTasks = [...tasks, newTask];
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks);
    setTasks(rescheduledTasks);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    );
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks);
    setTasks(rescheduledTasks);
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(updatedTasks);
    setTasks(rescheduledTasks);
  };

  const completeTask = (id: string) => {
    updateTask(id, { completed: true });
  };

  const rescheduleAllTasks = () => {
    const rescheduledTasks = taskScheduler.rescheduleAllTasks(tasks);
    setTasks(rescheduledTasks);
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    rescheduleAllTasks,
  };
}
