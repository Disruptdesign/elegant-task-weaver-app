
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle, Tag, FolderOpen, GitBranch } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { DurationSelector } from './ui/duration-selector';
import { DateTimeSelector } from './ui/datetime-selector';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Task, Project, TaskType } from '../types/task';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  deadline: z.date(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedDuration: z.number().min(15, 'La durée minimum est de 15 minutes'),
  scheduledStart: z.date().optional(),
  scheduledEnd: z.date().optional(),
  category: z.string().optional(),
  projectId: z.string().optional(),
  taskTypeId: z.string().optional(),
  canStartFrom: z.date().optional(),
  bufferBefore: z.number().optional(),
  bufferAfter: z.number().optional(),
  allowSplitting: z.boolean().optional(),
  splitDuration: z.number().optional(),
  dependencies: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface ExtendedTaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  initialData?: Partial<Task>;
  projects?: Project[];
  taskTypes?: TaskType[];
  tasks?: Task[];
}

export function ExtendedTaskForm({ onSubmit, onCancel, initialData, projects = [], taskTypes = [], tasks = [] }: ExtendedTaskFormProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      deadline: initialData?.deadline || new Date(),
      priority: initialData?.priority || 'medium',
      estimatedDuration: initialData?.estimatedDuration || 60,
      scheduledStart: initialData?.scheduledStart,
      scheduledEnd: initialData?.scheduledEnd,
      category: initialData?.category || '',
      projectId: initialData?.projectId || '',
      taskTypeId: initialData?.taskTypeId || '',
      canStartFrom: initialData?.canStartFrom,
      bufferBefore: initialData?.bufferBefore || 0,
      bufferAfter: initialData?.bufferAfter || 0,
      allowSplitting: initialData?.allowSplitting || false,
      splitDuration: initialData?.splitDuration || 30,
      dependencies: initialData?.dependencies || [],
    },
  });

  const handleSubmit = (data: TaskFormData) => {
    console.log('Extended task form submitted:', data);
    onSubmit(data);
  };

  // Obtenir le projet sélectionné
  const selectedProjectId = form.watch('projectId');
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const isProjectSelected = selectedProject && selectedProjectId && selectedProjectId !== '';

  // Mettre à jour automatiquement les dates quand un projet est sélectionné
  React.useEffect(() => {
    if (selectedProject) {
      form.setValue('deadline', new Date(selectedProject.deadline));
      form.setValue('canStartFrom', new Date(selectedProject.startDate));
    }
  }, [selectedProject, form]);

  const availableTasksForDependencies = tasks.filter(task => task.id !== initialData?.id && !task.completed);

  // Grouper les tâches disponibles par projet pour une meilleure organisation
  const tasksByProject = availableTasksForDependencies.reduce((acc, task) => {
    const projectId = task.projectId || 'no-project';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const getProjectName = (projectId: string) => {
    if (projectId === 'no-project') return 'Tâches sans projet';
    const project = projects.find(p => p.id === projectId);
    return project?.title || 'Projet inconnu';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Informations de base */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag size={20} />
            Informations de base
          </h3>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre de la tâche</FormLabel>
                <FormControl>
                  <Input placeholder="Entrez le titre de la tâche..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optionnel)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Décrivez la tâche..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une priorité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durée estimée</FormLabel>
                  <FormControl>
                    <DurationSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Date limite
                  {isProjectSelected && (
                    <span className="text-xs text-gray-500 ml-2">(définie par le projet)</span>
                  )}
                </FormLabel>
                <FormControl>
                  <div className={isProjectSelected ? 'opacity-50 pointer-events-none' : ''}>
                    <DateTimeSelector
                      value={field.value}
                      onChange={isProjectSelected ? () => {} : (date) => field.onChange(date)}
                      placeholder="Sélectionnez une date limite"
                      includeTime={false}
                      required
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Liaisons avec projets et types */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FolderOpen size={20} />
            Organisation
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un projet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucun projet</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taskTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de tâche</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Aucun type</SelectItem>
                      {taskTypes.map((taskType) => (
                        <SelectItem key={taskType.id} value={taskType.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: taskType.color }}
                            />
                            {taskType.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <FormControl>
                  <Input placeholder="Catégorie personnalisée..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dépendances */}
        {availableTasksForDependencies.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GitBranch size={20} />
              Dépendances des tâches
            </h3>
            <p className="text-sm text-gray-600">
              Cette tâche ne pourra pas démarrer avant que les tâches sélectionnées ci-dessous soient terminées.
            </p>

            <FormField
              control={form.control}
              name="dependencies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cette tâche dépend de :</FormLabel>
                  <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {Object.entries(tasksByProject).map(([projectId, projectTasks]) => (
                      <div key={projectId} className="space-y-2">
                        <h4 className="font-medium text-gray-800 text-sm flex items-center gap-2">
                          <FolderOpen size={14} />
                          {getProjectName(projectId)}
                        </h4>
                        <div className="ml-4 space-y-2">
                          {projectTasks.map((task) => {
                            const isSelected = field.value?.includes(task.id) || false;
                            
                            return (
                              <div key={task.id} className="flex items-start space-x-2 p-2 rounded border border-gray-100 hover:bg-gray-50">
                                <Checkbox
                                  id={`dep-${task.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const currentDeps = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentDeps, task.id]);
                                    } else {
                                      field.onChange(currentDeps.filter(id => id !== task.id));
                                    }
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <Label 
                                    htmlFor={`dep-${task.id}`}
                                    className="text-sm font-medium cursor-pointer block"
                                  >
                                    {task.title}
                                  </Label>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {task.priority === 'urgent' ? 'Urgente' :
                                       task.priority === 'high' ? 'Haute' :
                                       task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {task.estimatedDuration} min
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(task.deadline, 'dd/MM', { locale: fr })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Planification */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={20} />
            Planification
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduledStart"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Début planifié (optionnel)</FormLabel>
                  <FormControl>
                    <DateTimeSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sélectionnez une date et heure"
                      includeTime={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canStartFrom"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Peut commencer à partir du
                    {isProjectSelected && (
                      <span className="text-xs text-gray-500 ml-2">(définie par le projet)</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className={isProjectSelected ? 'opacity-50 pointer-events-none' : ''}>
                      <DateTimeSelector
                        value={field.value}
                        onChange={isProjectSelected ? () => {} : field.onChange}
                        placeholder="Sélectionnez une date"
                        includeTime={false}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bufferBefore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temps de pause avant (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="5" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bufferAfter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temps de pause après (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="5" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="allowSplitting"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Permettre le découpage de la tâche
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('allowSplitting') && (
              <FormField
                control={form.control}
                name="splitDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée minimum pour le découpage (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="15" 
                        step="15" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {initialData ? 'Modifier' : 'Créer'} la tâche
          </Button>
        </div>
      </form>
    </Form>
  );
}
