
import { useState, useMemo } from 'react';
import { Task, Event } from '../types/task';

type ItemType = 'all' | 'tasks' | 'events';
type FilterStatus = 'all' | 'pending' | 'completed';
type FilterPriority = 'all' | 'urgent' | 'high' | 'medium' | 'low';

export function useTaskListFilters(tasks: Task[], events: Event[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterType, setFilterType] = useState<ItemType>('all');

  const allItems = useMemo(() => [
    ...tasks.map(task => ({ ...task, type: 'task' as const })),
    ...events.map(event => ({ ...event, type: 'event' as const }))
  ], [tasks, events]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (item.type === 'task') {
        matchesStatus = filterStatus === 'all' ||
                       (filterStatus === 'pending' && !item.completed) ||
                       (filterStatus === 'completed' && item.completed);
      } else {
        // Pour les événements, on considère qu'ils sont toujours "pending" (non terminés)
        matchesStatus = filterStatus === 'all' || filterStatus === 'pending';
      }
      
      let matchesPriority = true;
      if (item.type === 'task') {
        matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
      }
      
      const matchesType = filterType === 'all' ||
                         (filterType === 'tasks' && item.type === 'task') ||
                         (filterType === 'events' && item.type === 'event');
      
      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [allItems, searchTerm, filterStatus, filterPriority, filterType]);

  return {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterType,
    setFilterType,
    filteredItems,
    allItems
  };
}
