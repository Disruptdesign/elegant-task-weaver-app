
import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface DurationSelectorProps {
  value: number; // durée en minutes
  onChange: (duration: number) => void;
  className?: string;
}

export function DurationSelector({ value, onChange, className = '' }: DurationSelectorProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const presets = [
    { label: '15min', value: 15 },
    { label: '30min', value: 30 },
    { label: '1h', value: 60 },
    { label: '1h30', value: 90 },
    { label: '2h', value: 120 },
    { label: '3h', value: 180 },
  ];

  // Convertir les minutes en heures et minutes pour l'affichage
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const handleHoursChange = (newHours: number) => {
    const totalMinutes = newHours * 60 + minutes;
    onChange(Math.max(15, totalMinutes));
  };

  const handleMinutesChange = (newMinutes: number) => {
    const totalMinutes = hours * 60 + newMinutes;
    onChange(Math.max(15, totalMinutes));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Raccourcis prédéfinis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Raccourcis
        </label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`px-3 py-2 text-sm rounded-lg transition-all font-medium ${
                value === preset.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sélection personnalisée */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Clock size={16} className="inline mr-2" />
          Durée personnalisée
        </label>
        
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          {/* Sélecteur d'heures */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleHoursChange(Math.max(0, hours - 1))}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-medium"
            >
              −
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                {hours}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                heure{hours > 1 ? 's' : ''}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => handleHoursChange(hours + 1)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-medium"
            >
              +
            </button>
          </div>

          <div className="text-gray-400 font-bold text-xl">:</div>

          {/* Sélecteur de minutes */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMinutesChange(Math.max(0, Math.floor((minutes - 15) / 15) * 15))}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-medium"
            >
              −
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                {minutes.toString().padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                min
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => handleMinutesChange((Math.floor(minutes / 15) + 1) * 15)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 font-medium"
            >
              +
            </button>
          </div>
        </div>

        {/* Affichage du total */}
        <div className="mt-3 text-center">
          <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
            <Clock size={14} className="mr-1" />
            Total: {formatDuration(value)}
          </span>
        </div>
      </div>

      {/* Validation pour durée minimum */}
      {value < 15 && (
        <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-2">
          ⚠️ Durée minimum recommandée : 15 minutes
        </div>
      )}
    </div>
  );
}
