'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange?: (date: string) => void; // Returns YYYY-MM-DD format
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'MM/DD/YYYY',
  disabled = false,
  className,
  id,
  name,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  // Convert YYYY-MM-DD to Date object
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [value]);

  // Convert YYYY-MM-DD to MM/DD/YYYY for display
  React.useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      setInputValue(`${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`);
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      onChange?.(isoDate);
      setOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse MM/DD/YYYY format
    const match = newValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      const [, month, day, year] = match;
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      const yearNum = parseInt(year, 10);

      // Validate date
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        const date = new Date(yearNum, monthNum - 1, dayNum);
        // Check if the date is valid (handles invalid dates like 02/31/2024)
        if (
          date.getFullYear() === yearNum &&
          date.getMonth() === monthNum - 1 &&
          date.getDate() === dayNum
        ) {
          const isoDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          onChange?.(isoDate);
        }
      }
    }
  };

  const handleInputBlur = () => {
    // If input is invalid, reset to the current value
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      setInputValue(`${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`);
    } else {
      setInputValue('');
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className={cn('pr-10', className)}
        />
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={disabled}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

