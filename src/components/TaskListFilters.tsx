import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
    <Card className="shadow-sm border-border animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter size={20} className="text-primary" />
          Filtres et recherche
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Barre de recherche mise en évidence */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Rechercher une tâche ou un événement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-input rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base placeholder:text-muted-foreground shadow-sm"
          />
        </div>

        {/* Sections de filtres organisées en grille */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section Type d'élément */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Type d'élément</span>
            </div>
            <ToggleGroup 
              type="single" 
              value={filterType} 
              onValueChange={(value) => value && setFilterType(value as ItemType)}
              className="grid grid-cols-3 gap-1 w-full"
            >
              {typeFilterOptions.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={option.label}
                  className="px-3 py-3 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-lg border border-input hover:border-primary/50 transition-all text-center h-auto min-h-[3rem] flex flex-col items-center justify-center"
                >
                  <span className="leading-tight">{option.label}</span>
                  <span className="text-xs opacity-75 mt-1 leading-none">({option.count})</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Section Statut */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span>Statut</span>
            </div>
            <ToggleGroup 
              type="single" 
              value={filterStatus} 
              onValueChange={(value) => value && setFilterStatus(value as FilterStatus)}
              className="grid grid-cols-3 gap-1 w-full"
            >
              {statusFilterOptions.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={option.label}
                  disabled={filterType === 'events' && option.value === 'completed'}
                  className="px-3 py-3 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-lg border border-input hover:border-primary/50 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed h-auto min-h-[3rem] flex flex-col items-center justify-center"
                >
                  <span className="leading-tight">{option.label}</span>
                  <span className="text-xs opacity-75 mt-1 leading-none">({option.count})</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {/* Section contrôles avancés avec séparateur visuel */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
            <ArrowUpDown size={16} className="text-muted-foreground" />
            <span>Options avancées</span>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Filtre par priorité (seulement pour les tâches) */}
            {filterType !== 'events' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Priorité</label>
                <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as FilterPriority)}>
                  <SelectTrigger className="w-full border-input focus:ring-primary/20 focus:border-primary">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tri par</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
                  <SelectTrigger className="flex-1 border-input focus:ring-primary/20 focus:border-primary">
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
                  className="px-3 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-all text-sm min-w-[44px] h-10 flex items-center justify-center font-medium"
                  title={sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
