
import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

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
    <div className="bg-card rounded-2xl shadow-sm border border-border p-4 sm:p-6 space-y-6">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Rechercher une tâche ou un événement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-input rounded-xl bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-base placeholder:text-muted-foreground"
        />
      </div>

      {/* Filtres organisés en sections */}
      <div className="space-y-4">
        {/* Section Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter size={16} className="text-muted-foreground" />
            <span>Type d'élément</span>
          </div>
          <ToggleGroup 
            type="single" 
            value={filterType} 
            onValueChange={(value) => value && setFilterType(value as ItemType)}
            className="justify-start"
          >
            {typeFilterOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                aria-label={option.label}
                className="px-4 py-2 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {option.label} ({option.count})
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Section Statut */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Statut</div>
          <ToggleGroup 
            type="single" 
            value={filterStatus} 
            onValueChange={(value) => value && setFilterStatus(value as FilterStatus)}
            className="justify-start"
          >
            {statusFilterOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                aria-label={option.label}
                disabled={filterType === 'events' && option.value === 'completed'}
                className="px-4 py-2 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {option.label} ({option.count})
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Section contrôles avancés */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-border">
          {/* Filtre par priorité (seulement pour les tâches) */}
          {filterType !== 'events' && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground mb-2">Priorité</div>
              <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as FilterPriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Toutes priorités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                  <SelectItem value="high">🟠 Haute</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="low">🟢 Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tri */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <ArrowUpDown size={16} className="text-muted-foreground" />
              <span>Tri</span>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm min-w-[44px] h-10 flex items-center justify-center"
                title={sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
