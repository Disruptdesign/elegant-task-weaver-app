
import { useState } from 'react';

export const useAppState = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<{ title: string; description?: string } | undefined>();

  const openAddForm = (initialData?: { title: string; description?: string }) => {
    setTaskFormData(initialData);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setTaskFormData(undefined);
  };

  return {
    currentView,
    setCurrentView,
    isAddFormOpen,
    taskFormData,
    openAddForm,
    closeAddForm,
  };
};
