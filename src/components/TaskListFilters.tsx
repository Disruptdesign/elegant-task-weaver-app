
import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

type ItemType = 'all' | 'tasks' | 'events';
type FilterStatus = 'all' | 'pending' | 'completed';
type FilterPriority = 'all' | 'urgent' | 'high' | 'medium' | 'low';
type SortOption = 'deadline' | 'priority' | 'title' | 'created' | 'project' | 'date';

interface TaskListFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: ItemType;
  setFilterType: (type: ItemType) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  filterPriority: FilterPriority;
  setFilterPriority: (priority: FilterPriority) => void;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: SortOption) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  totalTasks: number;
  totalEvents: number;
  pendingTasks: number;
  completedTasks: number;
}

export function TaskListFilters({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  sortBy,
  sortOrder,
  onSortChange,
  setSortOrder,
  totalTasks,
  totalEvents,
  pendingTasks,
  completedTasks
}: TaskListFiltersProps) {
  const typeFilterOptions = [
    { value: 'all', label: 'Tout', count: totalTasks + totalEvents },
    { value: 'tasks', label: 'Tâches', count: totalTasks },
    { value: 'events', label: 'Événements', count: totalEvents },
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'Toutes', count: filterType === 'events' ? totalEvents : (filterType === 'tasks' ? totalTasks : totalTasks + totalEvents) },
    { value: 'pending', label: 'En cours', count: filterType === 'events' ? totalEvents : pendingTasks },
    { value: 'completed', label: 'Terminées', count: filterType === 'events' ? 0 : completedTasks },
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'priority', label: 'Priorité' },
    { value: 'title', label: 'Titre' },
    { value: 'created', label: 'Date de création' },
    { value: 'project', label: 'Projet' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher une tâche ou un événement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filtre par type */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
              {typeFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterType(option.value as ItemType)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    filterType === option.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
          </div>

          {/* Filtre par statut */}
          <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {statusFilterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value as FilterStatus)}
                disabled={filterType === 'events' && option.value === 'completed'}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  filterStatus === option.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>

          {/* Filtre par priorité (seulement pour les tâches) */}
          {filterType !== 'events' && (
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-target flex-1 sm:flex-none"
            >
              <option value="all">Toutes priorités</option>
              <option value="urgent">🔴 Urgente</option>
              <option value="high">🟠 Haute</option>
              <option value="medium">🟡 Moyenne</option>
              <option value="low">🟢 Faible</option>
            </select>
          )}

          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-target flex-1 sm:flex-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              title={sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
