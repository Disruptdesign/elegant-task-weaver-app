
import React from 'react';
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
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1h', value: 60 },
    { label: '1h30', value: 90 },
    { label: '2h', value: 120 },
    { label: '3h', value: 180 },
    { label: '4h', value: 240 },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-4 gap-2">
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
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(15, value - 15))}
          className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm transition-colors font-medium"
        >
          -15min
        </button>
        <div className="flex-1 text-center py-2 px-3 border border-gray-200 rounded-lg bg-blue-50 border-blue-200">
          <span className="font-semibold text-blue-900 flex items-center justify-center gap-1">
            <Clock size={16} />
            {formatDuration(value)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 15)}
          className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm transition-colors font-medium"
        >
          +15min
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 min-w-0">Durée personnalisée :</span>
        <input
          type="range"
          min="15"
          max="480"
          step="15"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - 15) / (480 - 15)) * 100}%, #e5e7eb ${((value - 15) / (480 - 15)) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>
    </div>
  );
}
