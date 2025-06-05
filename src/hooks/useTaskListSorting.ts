
import { useState, useMemo } from 'react';
import { Project } from '../types/task';

type SortOption = 'deadline' | 'priority' | 'title' | 'created' | 'project' | 'date';

export function useTaskListSorting(items: any[], projects: Project[] = []) {
  const [sortBy, setSortBy] = useState<SortOption>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'deadline':
        case 'date':
          const dateA = a.type === 'task' ? new Date(a.deadline) : new Date(a.startDate);
          const dateB = b.type === 'task' ? new Date(b.deadline) : new Date(b.startDate);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'priority':
          if (a.type === 'task' && b.type === 'task') {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          } else {
            // Les événements ont une priorité neutre
            comparison = a.type === 'task' ? -1 : 1;
          }
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'project':
          if (a.type === 'task' && b.type === 'task') {
            const projectA = a.projectId ? projects.find(p => p.id === a.projectId)?.title || '' : '';
            const projectB = b.projectId ? projects.find(p => p.id === b.projectId)?.title || '' : '';
            comparison = projectA.localeCompare(projectB);
          } else {
            comparison = a.type === 'task' ? -1 : 1;
          }
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, sortBy, sortOrder, projects]);

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return {
    sortBy,
    sortOrder,
    sortedItems,
    handleSortChange,
    setSortOrder
  };
}
