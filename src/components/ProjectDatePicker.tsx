
import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface ProjectDatePickerProps {
  date: Date | string;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function ProjectDatePicker({
  date,
  onDateChange,
  placeholder = "Sélectionner une date",
  label,
  className
}: ProjectDatePickerProps) {
  const selectedDate = typeof date === 'string' ? new Date(date) : date;
  const isValidDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime());

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !isValidDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {isValidDate ? (
              format(selectedDate, 'dd MMM yyyy', { locale: fr })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={isValidDate ? selectedDate : undefined}
            onSelect={onDateChange}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
