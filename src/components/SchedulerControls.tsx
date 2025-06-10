
import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { CalendarClock, Settings, Zap } from 'lucide-react';
import { useAlgorithmicScheduler } from '../hooks/useAlgorithmicScheduler';
import { Task, Event } from '../types/task';

interface SchedulerControlsProps {
  tasks: Task[];
  events: Event[];
  projects?: any[];
  onTasksUpdate: (tasks: Task[]) => void;
}

export function SchedulerControls({ tasks, events, projects = [], onTasksUpdate }: SchedulerControlsProps) {
  const { settings, isScheduling, scheduleAllTasks, rescheduleAllTasks, updateSettings } = useAlgorithmicScheduler();

  const handleManualSchedule = async () => {
    console.log('🎯 Planification manuelle déclenchée avec', projects.length, 'projet(s)');
    const scheduledTasks = await scheduleAllTasks(tasks, events, projects);
    onTasksUpdate(scheduledTasks);
  };

  const handleReschedule = async () => {
    console.log('🔄 Replanification manuelle déclenchée avec', projects.length, 'projet(s) - CONTRAINTES canStartFrom PRÉSERVÉES');
    const rescheduledTasks = await rescheduleAllTasks(tasks, events, projects);
    onTasksUpdate(rescheduledTasks);
  };

  const unscheduledTasks = tasks.filter(task => !task.scheduledStart && !task.completed);
  const scheduledTasks = tasks.filter(task => task.scheduledStart);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Planificateur Algorithmique
        </CardTitle>
        <CardDescription>
          Planification automatique des tâches en fonction des événements, deadlines et priorités avec respect des contraintes "peut commencer à partir de"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{scheduledTasks.length}</div>
            <div className="text-sm text-blue-600">Tâches programmées</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{unscheduledTasks.length}</div>
            <div className="text-sm text-orange-600">À programmer</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{events.length}</div>
            <div className="text-sm text-green-600">Événements fixes</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleManualSchedule}
            disabled={isScheduling || unscheduledTasks.length === 0}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isScheduling ? 'Planification...' : 'Programmer les tâches'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleReschedule}
            disabled={isScheduling}
            className="flex items-center gap-2"
          >
            <CalendarClock className="h-4 w-4" />
            {isScheduling ? 'Replanification...' : 'Replanifier tout'}
          </Button>
        </div>

        {/* Paramètres */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-semibold">
            <Settings className="h-4 w-4" />
            Paramètres
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auto-schedule">Planification automatique</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-schedule"
                  checked={settings.autoSchedule}
                  onCheckedChange={(checked) => updateSettings({ autoSchedule: checked })}
                />
                <Label htmlFor="auto-schedule" className="text-sm text-gray-600">
                  {settings.autoSchedule ? 'Activée' : 'Désactivée'}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekends">Inclure les week-ends</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="weekends"
                  checked={settings.allowWeekends}
                  onCheckedChange={(checked) => updateSettings({ allowWeekends: checked })}
                />
                <Label htmlFor="weekends" className="text-sm text-gray-600">
                  {settings.allowWeekends ? 'Oui' : 'Non'}
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Début de journée</Label>
              <Input
                id="start-time"
                type="time"
                value={settings.workingHours.start}
                onChange={(e) => updateSettings({ 
                  workingHours: { ...settings.workingHours, start: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-time">Fin de journée</Label>
              <Input
                id="end-time"
                type="time"
                value={settings.workingHours.end}
                onChange={(e) => updateSettings({ 
                  workingHours: { ...settings.workingHours, end: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buffer">Pause (min)</Label>
              <Input
                id="buffer"
                type="number"
                min="0"
                max="60"
                value={settings.bufferBetweenTasks}
                onChange={(e) => updateSettings({ 
                  bufferBetweenTasks: parseInt(e.target.value) || 15
                })}
              />
            </div>
          </div>
        </div>

        {/* Informations */}
        {isScheduling && (
          <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
            <p className="text-sm">
              🤖 Planification en cours... Les tâches sont organisées selon leur priorité et deadline.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
