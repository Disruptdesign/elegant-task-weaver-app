
import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface DurationSelectorProps {
  value: number; // durée en minutes
  onChange: (duration: number) => void;
  className?: string;
}

export function DurationSelector({ value, onChange, className = '' }: DurationSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const presets = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1h', value: 60 },
    { label: '1h30', value: 90 },
    { label: '2h', value: 120 },
    { label: '3h', value: 180 },
  ];

  const handleDurationClick = () => {
    setIsEditing(true);
    setInputValue(value.toString());
  };

  const handleInputSubmit = () => {
    const newValue = parseInt(inputValue);
    if (!isNaN(newValue) && newValue > 0) {
      onChange(Math.max(15, newValue));
    }
    setIsEditing(false);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleInputBlur = () => {
    handleInputSubmit();
  };

  return (
    <div className={`space-y-3 ${className}`}>
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
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(15, value - 15))}
          className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm transition-colors font-medium"
        >
          -15min
        </button>
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyPress}
              onBlur={handleInputBlur}
              min="15"
              step="15"
              className="flex-1 text-center py-2 px-3 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <span className="text-sm text-gray-500">min</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDurationClick}
            className="flex-1 text-center py-2 px-3 border border-gray-200 rounded-lg bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <span className="font-semibold text-blue-900 flex items-center justify-center gap-1">
              <Clock size={16} />
              {formatDuration(value)}
            </span>
          </button>
        )}
        
        <button
          type="button"
          onClick={() => onChange(value + 15)}
          className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm transition-colors font-medium"
        >
          +15min
        </button>
      </div>
    </div>
  );
}
