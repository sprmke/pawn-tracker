'use client';

import { useState, useMemo } from 'react';
import { ViewMode, CalendarEvent, CalendarCell } from './types';

export interface UseCalendarProps {
  events: CalendarEvent[];
}

export function useCalendar({ events }: UseCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get calendar grid data
  const calendarData = useMemo(() => {
    const grid: CalendarCell[] = [];

    if (viewMode === 'day') {
      // Day view - show only the current day
      grid.push({
        date: new Date(currentDate),
        isCurrentMonth: true,
        events: [],
      });
    } else if (viewMode === 'week') {
      // Week view - show 7 days starting from Sunday
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        grid.push({
          date,
          isCurrentMonth: date.getMonth() === currentDate.getMonth(),
          events: [],
        });
      }
    } else {
      // Month view - traditional calendar grid
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstDayOfWeek = firstDay.getDay();
      const daysInMonth = lastDay.getDate();
      const daysFromPrevMonth = firstDayOfWeek;
      const totalCells = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7;
      const daysFromNextMonth = totalCells - daysFromPrevMonth - daysInMonth;

      // Add days from previous month
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDay - i);
        grid.push({
          date,
          isCurrentMonth: false,
          events: [],
        });
      }

      // Add days from current month
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        grid.push({
          date,
          isCurrentMonth: true,
          events: [],
        });
      }

      // Add days from next month
      for (let i = 1; i <= daysFromNextMonth; i++) {
        const date = new Date(year, month + 1, i);
        grid.push({
          date,
          isCurrentMonth: false,
          events: [],
        });
      }
    }

    // Assign events to dates
    events.forEach((event) => {
      grid.forEach((cell) => {
        const cellDate = new Date(cell.date);
        cellDate.setHours(0, 0, 0, 0);

        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);

        if (cellDate.getTime() === eventDate.getTime()) {
          cell.events.push(event);
        }
      });
    });

    return grid;
  }, [currentDate, events, viewMode]);

  const goToPreviousPeriod = () => {
    if (viewMode === 'day') {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - 1
        )
      );
    } else if (viewMode === 'week') {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - 7
        )
      );
    } else {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    }
  };

  const goToNextPeriod = () => {
    if (viewMode === 'day') {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 1
        )
      );
    } else if (viewMode === 'week') {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 7
        )
      );
    } else {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getViewTitle = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return `${weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${weekEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    } else {
      return `${
        monthNames[currentDate.getMonth()]
      } ${currentDate.getFullYear()}`;
    }
  };

  return {
    currentDate,
    viewMode,
    setViewMode,
    calendarData,
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
    getViewTitle,
    monthNames,
    dayNames,
    isToday,
  };
}
