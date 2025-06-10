
import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../lib/utils';

interface DateTimeSelectorProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  includeTime?: boolean;
  className?: string;
  required?: boolean;
}

export function DateTimeSelector({ 
  value, 
  onChange, 
  placeholder = "Sélectionnez une date",
  includeTime = false,
  className = '',
  required = false
}: DateTimeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const timePresets = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const handleDateSelect = (date: Date | undefined) => {
    if (date && value) {
      // Conserver l'heure existante lors du changement de date
      const newDate = new Date(date);
      newDate.setHours(value.getHours(), value.getMinutes());
      onChange(newDate);
    } else {
      onChange(date);
    }
  };

  const handleTimeChange = (time: string) => {
    if (value) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
  };

  const getCurrentTime = () => {
    if (!value) return '';
    return format(value, 'HH:mm');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal shadow-unified-sm hover:shadow-unified-md",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              <span className="text-unified-sm">
                {format(value, "PPP", { locale: fr })}
                {includeTime && ` à ${format(value, "HH:mm")}`}
              </span>
            ) : (
              <span className="text-unified-sm">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background shadow-unified-xl" align="start">
          <div className="space-y-3 spacing-sm">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
            
            {includeTime && (
              <div className="border-t pt-3 space-y-3">
                <div className="flex items-center gap-2 text-unified-sm font-medium text-foreground">
                  <Clock size={16} />
                  Heure
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {timePresets.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeChange(time)}
                      className={`px-2 py-1 text-unified-xs rounded-unified transition-unified shadow-unified-sm hover:shadow-unified-md ${
                        getCurrentTime() === time
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-unified-sm text-muted-foreground">Heure personnalisée :</span>
                  <input
                    type="time"
                    value={getCurrentTime()}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="px-2 py-1 border border-input rounded-unified text-unified-sm bg-background transition-unified focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="flex-1"
              >
                Effacer
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                OK
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
