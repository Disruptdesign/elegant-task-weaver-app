
import React, { useState } from 'react';
import { Clock, Check, X } from 'lucide-react';

interface DurationSelectorProps {
  value: number; // durée en minutes
  onChange: (duration: number) => void;
  className?: string;
}

export function DurationSelector({ value, onChange, className = '' }: DurationSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(true);

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

  const validateInput = (val: string) => {
    const numValue = parseInt(val);
    return !isNaN(numValue) && numValue >= 15 && numValue <= 999;
  };

  const handleDurationClick = () => {
    setIsEditing(true);
    setInputValue(value.toString());
    setIsValid(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsValid(validateInput(val));
  };

  const handleConfirm = () => {
    if (isValid && inputValue) {
      const newValue = parseInt(inputValue);
      onChange(Math.max(15, newValue));
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
    setIsValid(true);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
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
          <div className="flex-1 flex items-center gap-2 animate-fade-in">
            <div className="flex-1 relative">
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyPress}
                min="15"
                max="999"
                step="15"
                placeholder="Durée"
                className={`w-full text-center py-2 px-3 pr-12 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                  isValid 
                    ? 'border-blue-500 focus:ring-blue-500' 
                    : 'border-red-500 focus:ring-red-500 bg-red-50'
                }`}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                min
              </span>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid}
              className={`p-2 rounded-lg transition-colors ${
                isValid
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title="Confirmer"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              title="Annuler"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDurationClick}
            className="flex-1 text-center py-2 px-3 border border-gray-200 rounded-lg bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all cursor-pointer group relative"
            title="Cliquer pour modifier"
          >
            <span className="font-semibold text-blue-900 flex items-center justify-center gap-1">
              <Clock size={16} />
              {formatDuration(value)}
            </span>
            <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-300 transition-colors opacity-0 group-hover:opacity-100"></div>
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
      
      {isEditing && !isValid && (
        <div className="text-sm text-red-600 animate-fade-in">
          Veuillez entrer une durée entre 15 et 999 minutes
        </div>
      )}
    </div>
  );
}
