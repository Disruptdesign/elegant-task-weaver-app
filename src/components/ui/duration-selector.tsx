import React, { useState } from 'react';
import { Clock } from 'lucide-react';
interface DurationSelectorProps {
  value: number; // durée en minutes
  onChange: (duration: number) => void;
  className?: string;
}
export function DurationSelector({
  value,
  onChange,
  className = ''
}: DurationSelectorProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };
  const presets = [{
    label: '15min',
    value: 15
  }, {
    label: '30min',
    value: 30
  }, {
    label: '1h',
    value: 60
  }, {
    label: '1h30',
    value: 90
  }, {
    label: '2h',
    value: 120
  }, {
    label: '3h',
    value: 180
  }];

  // Convertir les minutes en heures et minutes pour l'affichage
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  const handleHoursChange = (newHours: string) => {
    const hoursNum = Math.max(0, Math.min(23, parseInt(newHours) || 0));
    const totalMinutes = hoursNum * 60 + minutes;
    onChange(Math.max(15, totalMinutes));
  };
  const handleMinutesChange = (newMinutes: string) => {
    const minutesNum = Math.max(0, Math.min(59, parseInt(newMinutes) || 0));
    const totalMinutes = hours * 60 + minutesNum;
    onChange(Math.max(15, totalMinutes));
  };
  return <div className={`space-y-3 ${className}`}>
      {/* Raccourcis prédéfinis */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Raccourcis
        </label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map(preset => <button key={preset.value} type="button" onClick={() => onChange(preset.value)} className={`px-2 py-1.5 text-sm rounded-md transition-all font-medium ${value === preset.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'}`}>
              {preset.label}
            </button>)}
        </div>
      </div>

      {/* Sélection personnalisée */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          <Clock size={14} className="inline mr-1" />
          Durée personnalisée
        </label>
        
        <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          {/* Sélecteur d'heures */}
          <div className="flex flex-col items-center gap-1">
            <input type="number" min="0" max="23" value={hours} onChange={e => handleHoursChange(e.target.value)} className="w-12 h-8 text-lg font-semibold text-foreground text-center bg-background border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <span className="text-xs text-muted-foreground font-medium">
              h
            </span>
          </div>

          <div className="text-muted-foreground font-semibold text-lg mt-[-16px]">:</div>

          {/* Sélecteur de minutes */}
          <div className="flex flex-col items-center gap-1">
            <input type="number" min="0" max="59" value={minutes.toString().padStart(2, '0')} onChange={e => handleMinutesChange(e.target.value)} className="w-12 h-8 text-lg font-semibold text-foreground text-center bg-background border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <span className="text-xs text-muted-foreground font-medium">
              min
            </span>
          </div>
        </div>

        {/* Affichage du total */}
        
      </div>

      {/* Validation pour durée minimum */}
      {value < 15 && <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-2">
          ⚠️ Durée minimum recommandée : 15 minutes
        </div>}
    </div>;
}