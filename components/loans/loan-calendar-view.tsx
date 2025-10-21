'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  TrendingUp,
} from 'lucide-react';
import { LoanWithInvestors } from '@/lib/types';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';

interface LoanCalendarViewProps {
  loans: LoanWithInvestors[];
  onLoanClick: (loan: LoanWithInvestors) => void;
}

interface CalendarEventSent {
  type: 'sent';
  loan: LoanWithInvestors;
  date: Date;
  investors: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
}

interface CalendarEventDue {
  type: 'due';
  loan: LoanWithInvestors;
  date: Date;
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
}

type CalendarEvent = CalendarEventSent | CalendarEventDue;

export function LoanCalendarView({
  loans,
  onLoanClick,
}: LoanCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate calendar events from loans
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    loans.forEach((loan) => {
      // Group transactions by sent date
      const sentDateMap = new Map<
        string,
        Array<(typeof loan.loanInvestors)[0]>
      >();

      loan.loanInvestors.forEach((li) => {
        const dateKey = new Date(li.sentDate).toISOString().split('T')[0];
        const existing = sentDateMap.get(dateKey) || [];
        existing.push(li);
        sentDateMap.set(dateKey, existing);
      });

      // Create sent date events
      sentDateMap.forEach((transactions, dateKey) => {
        const investors = transactions.map((t) => ({
          name: t.investor.name,
          amount: parseFloat(t.amount),
        }));
        const totalAmount = investors.reduce((sum, inv) => sum + inv.amount, 0);

        events.push({
          type: 'sent',
          loan,
          date: new Date(dateKey + 'T00:00:00'),
          investors,
          totalAmount,
        });
      });

      // Calculate totals for due date
      const totalPrincipal = loan.loanInvestors.reduce(
        (sum, li) => sum + parseFloat(li.amount),
        0
      );
      const totalInterest = loan.loanInvestors.reduce((sum, li) => {
        const capital = parseFloat(li.amount);
        const rate = parseFloat(li.interestRate) / 100;
        return sum + capital * rate;
      }, 0);

      // Create due date event
      events.push({
        type: 'due',
        loan,
        date: new Date(loan.dueDate),
        totalPrincipal,
        totalInterest,
        totalAmount: totalPrincipal + totalInterest,
      });
    });

    return events;
  }, [loans]);

  // Get calendar grid data
  const calendarData = useMemo(() => {
    const grid: Array<{
      date: Date;
      isCurrentMonth: boolean;
      events: CalendarEvent[];
    }> = [];

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
    calendarEvents.forEach((event) => {
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
  }, [currentDate, calendarEvents, viewMode]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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

  // Render event card function for reusability
  const renderEventCard = (event: CalendarEvent, eventIndex: number) => {
    if (event.type === 'sent') {
      return (
        <button
          key={`${event.loan.id}-sent-${eventIndex}`}
          onClick={() => onLoanClick(event.loan)}
          className="w-full text-left p-3 rounded-lg text-sm hover:shadow-lg transition-all bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 shadow-md"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 flex-shrink-0">
                <ArrowUp className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="font-bold text-gray-900 text-sm">
                  {event.loan.loanName}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant={getLoanTypeBadge(event.loan.type).variant}
                    className={`text-[8px] h-3.5 px-1 py-0 leading-none ${
                      getLoanTypeBadge(event.loan.type).className || ''
                    }`}
                  >
                    {event.loan.type}
                  </Badge>
                  <Badge
                    variant={getLoanStatusBadge(event.loan.status).variant}
                    className={`text-[8px] h-3.5 px-1 py-0 leading-none ${
                      getLoanStatusBadge(event.loan.status).className
                    }`}
                  >
                    {event.loan.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="pl-8 space-y-1">
              <div className="text-xs text-gray-700 space-y-0.5">
                {event.investors.map((inv, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-red-500 font-bold">•</span>
                    <span className="truncate">
                      <span className="font-semibold">{inv.name}:</span>{' '}
                      {formatCurrency(inv.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="font-bold text-gray-900 text-sm bg-white/60 px-2 py-1 rounded inline-block mt-1">
                Sent: {formatCurrency(event.totalAmount)}
              </div>
            </div>
          </div>
        </button>
      );
    } else if (event.type === 'due') {
      return (
        <button
          key={`${event.loan.id}-due-${eventIndex}`}
          onClick={() => onLoanClick(event.loan)}
          className="w-full text-left p-3 rounded-lg text-sm hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600 shadow-md"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 flex-shrink-0">
                <ArrowDown className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="font-bold text-gray-900 text-sm">
                  {event.loan.loanName}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant={getLoanTypeBadge(event.loan.type).variant}
                    className={`text-[8px] h-3.5 px-1 py-0 leading-none ${
                      getLoanTypeBadge(event.loan.type).className || ''
                    }`}
                  >
                    {event.loan.type}
                  </Badge>
                  <Badge
                    variant={getLoanStatusBadge(event.loan.status).variant}
                    className={`text-[8px] h-3.5 px-1 py-0 leading-none ${
                      getLoanStatusBadge(event.loan.status).className
                    }`}
                  >
                    {event.loan.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="pl-8 space-y-1">
              <div className="font-bold text-gray-900 text-sm bg-white/60 px-2 py-1 rounded inline-block">
                Due: {formatCurrency(event.totalAmount)}
              </div>
              <div className="text-xs text-gray-700 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Principal:</span>
                  <span className="font-semibold">
                    {formatCurrency(event.totalPrincipal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Interest:</span>
                  <span className="font-semibold">
                    {formatCurrency(event.totalInterest)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold">{getViewTitle()}</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500">
                      <ArrowUp className="h-3 w-3 text-white" />
                    </div>
                    <span className="font-medium">Out</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-600">
                      <ArrowDown className="h-3 w-3 text-white" />
                    </div>
                    <span className="font-medium">In</span>
                  </div>
                </div>
                {/* View Mode Selector */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                    className="h-7 px-2 text-xs"
                  >
                    Day
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className="h-7 px-2 text-xs"
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="h-7 px-2 text-xs"
                  >
                    Month
                  </Button>
                </div>
                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPeriod}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextPeriod}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 border-b">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-semibold border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
          )}

          {/* Day View - Vertical Stack */}
          {viewMode === 'day' && (
            <div className="p-6">
              {calendarData.map((cell, index) => (
                <div key={index} className="space-y-3">
                  {/* Daily Summary */}
                  {cell.events.length > 1 &&
                    (() => {
                      const totalOut = cell.events
                        .filter((e) => e.type === 'sent')
                        .reduce(
                          (sum, e) =>
                            sum + (e as CalendarEventSent).totalAmount,
                          0
                        );
                      const totalIn = cell.events
                        .filter((e) => e.type === 'due')
                        .reduce((sum, e) => {
                          if (e.type === 'due') {
                            return sum + (e as CalendarEventDue).totalAmount;
                          }
                          return sum;
                        }, 0);

                      return (
                        <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm space-y-1">
                          {totalOut > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-red-600 font-semibold flex items-center gap-1">
                                <ArrowUp className="h-4 w-4" />
                                Total Out:
                              </span>
                              <span className="font-bold text-red-700 text-lg">
                                {formatCurrency(totalOut)}
                              </span>
                            </div>
                          )}
                          {totalIn > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-green-600 font-semibold flex items-center gap-1">
                                <ArrowDown className="h-4 w-4" />
                                Total In:
                              </span>
                              <span className="font-bold text-green-700 text-lg">
                                {formatCurrency(totalIn)}
                              </span>
                            </div>
                          )}
                          {totalOut > 0 && totalIn > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                              <span className="text-gray-700 font-semibold">
                                Net:
                              </span>
                              <span
                                className={`font-bold text-lg ${
                                  totalIn - totalOut >= 0
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }`}
                              >
                                {formatCurrency(totalIn - totalOut)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* Events List */}
                  <div className="space-y-3">
                    {cell.events.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No transactions on this day
                      </div>
                    ) : (
                      cell.events.map((event, eventIndex) => {
                        return (
                          <div key={eventIndex}>
                            {renderEventCard(event, eventIndex)}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Week View - Horizontal Columns */}
          {viewMode === 'week' && (
            <div>
              {/* Week Header */}
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {calendarData.map((cell, index) => (
                  <div
                    key={index}
                    className="p-3 text-center border-r last:border-r-0"
                  >
                    <div className="text-xs font-semibold text-muted-foreground">
                      {dayNames[cell.date.getDay()]}
                    </div>
                    <div
                      className={`text-2xl font-bold mt-1 ${
                        isToday(cell.date) ? 'text-primary' : ''
                      }`}
                    >
                      {cell.date.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Week Content */}
              <div className="grid grid-cols-7">
                {calendarData.map((cell, index) => (
                  <div
                    key={index}
                    className={`min-h-[500px] border-r last:border-r-0 p-2 ${
                      !cell.isCurrentMonth ? 'bg-muted/30' : ''
                    } ${isToday(cell.date) ? 'bg-primary/5' : ''}`}
                  >
                    <div className="space-y-2">
                      {/* Daily Summary */}
                      {cell.events.length > 0 &&
                        (() => {
                          const totalOut = cell.events
                            .filter((e) => e.type === 'sent')
                            .reduce(
                              (sum, e) =>
                                sum + (e as CalendarEventSent).totalAmount,
                              0
                            );
                          const totalIn = cell.events
                            .filter((e) => e.type === 'due')
                            .reduce((sum, e) => {
                              if (e.type === 'due') {
                                return (
                                  sum + (e as CalendarEventDue).totalAmount
                                );
                              }
                              return sum;
                            }, 0);

                          // Only show summary if there are multiple events
                          if (cell.events.length <= 1) return null;

                          return (
                            <div className="mb-2 p-1.5 bg-gray-50 border border-gray-300 rounded text-[9px] space-y-0.5">
                              {totalOut > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-red-600 font-semibold flex items-center gap-1">
                                    <ArrowUp className="h-2.5 w-2.5" />
                                    Out:
                                  </span>
                                  <span className="font-bold text-red-700">
                                    {formatCurrency(totalOut)}
                                  </span>
                                </div>
                              )}
                              {totalIn > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-green-600 font-semibold flex items-center gap-1">
                                    <ArrowDown className="h-2.5 w-2.5" />
                                    In:
                                  </span>
                                  <span className="font-bold text-green-700">
                                    {formatCurrency(totalIn)}
                                  </span>
                                </div>
                              )}
                              {totalOut > 0 && totalIn > 0 && (
                                <div className="flex items-center justify-between pt-0.5 border-t border-gray-300">
                                  <span className="text-gray-700 font-semibold">
                                    Net:
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      totalIn - totalOut >= 0
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                    }`}
                                  >
                                    {formatCurrency(totalIn - totalOut)}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {/* Events List */}
                      {cell.events.map((event, eventIndex) => {
                        return (
                          <div key={eventIndex}>
                            {renderEventCard(event, eventIndex)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month View - Traditional Grid */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7">
              {calendarData.map((cell, index) => (
                <div
                  key={index}
                  className={`min-h-[140px] border-r border-b last:border-r-0 p-2 ${
                    !cell.isCurrentMonth ? 'bg-muted/30' : ''
                  } ${isToday(cell.date) ? 'bg-primary/5' : ''}`}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${
                      !cell.isCurrentMonth ? 'text-muted-foreground' : ''
                    } ${isToday(cell.date) ? 'text-primary font-bold' : ''}`}
                  >
                    {cell.date.getDate()}
                  </div>

                  <div className="space-y-1.5">
                    {/* Daily Summary */}
                    {cell.events.length > 1 &&
                      (() => {
                        const totalOut = cell.events
                          .filter((e) => e.type === 'sent')
                          .reduce(
                            (sum, e) =>
                              sum + (e as CalendarEventSent).totalAmount,
                            0
                          );
                        const totalIn = cell.events
                          .filter((e) => e.type === 'due')
                          .reduce((sum, e) => {
                            if (e.type === 'due') {
                              return sum + (e as CalendarEventDue).totalAmount;
                            }
                            return sum;
                          }, 0);

                        return (
                          <div className="mb-2 p-1.5 bg-gray-50 border border-gray-300 rounded text-[9px] space-y-0.5">
                            {totalOut > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                  <ArrowUp className="h-2.5 w-2.5" />
                                  Out:
                                </span>
                                <span className="font-bold text-red-700">
                                  {formatCurrency(totalOut)}
                                </span>
                              </div>
                            )}
                            {totalIn > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-green-600 font-semibold flex items-center gap-1">
                                  <ArrowDown className="h-2.5 w-2.5" />
                                  In:
                                </span>
                                <span className="font-bold text-green-700">
                                  {formatCurrency(totalIn)}
                                </span>
                              </div>
                            )}
                            {totalOut > 0 && totalIn > 0 && (
                              <div className="flex items-center justify-between pt-0.5 border-t border-gray-300">
                                <span className="text-gray-700 font-semibold">
                                  Net:
                                </span>
                                <span
                                  className={`font-bold ${
                                    totalIn - totalOut >= 0
                                      ? 'text-green-700'
                                      : 'text-red-700'
                                  }`}
                                >
                                  {formatCurrency(totalIn - totalOut)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                    {cell.events.map((event, eventIndex) => {
                      if (event.type === 'sent') {
                        // Check if sent date is in the future
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const eventDate = new Date(event.date);
                        eventDate.setHours(0, 0, 0, 0);
                        const isFutureSentDate = eventDate > today;

                        return (
                          <button
                            key={`${event.loan.id}-sent-${eventIndex}`}
                            onClick={() => onLoanClick(event.loan)}
                            className={`w-full text-left p-2 rounded-md text-xs hover:shadow-md transition-all bg-gradient-to-br shadow-sm ${
                              isFutureSentDate
                                ? 'from-yellow-50 to-yellow-100 border-l-4 border-yellow-500'
                                : 'from-red-50 to-red-100 border-l-4 border-red-500'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1">
                                  <div
                                    className={`flex items-center justify-center w-3 h-3 rounded-full flex-shrink-0 ${
                                      isFutureSentDate
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                  >
                                    <ArrowUp className="h-2 w-2 text-white" />
                                  </div>
                                  <Badge
                                    variant={
                                      getLoanTypeBadge(event.loan.type).variant
                                    }
                                    className={`text-[8px] h-3.5 px-1 py-0 leading-none ${
                                      getLoanTypeBadge(event.loan.type)
                                        .className || ''
                                    }`}
                                  >
                                    {event.loan.type}
                                  </Badge>
                                  <Badge
                                    variant={
                                      getLoanStatusBadge(event.loan.status)
                                        .variant
                                    }
                                    className={`text-[8px] h-3.5 px-1 py-0 leading-none ${
                                      getLoanStatusBadge(event.loan.status)
                                        .className
                                    }`}
                                  >
                                    {event.loan.status}
                                  </Badge>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1 mb-1">
                                  <div className="font-bold truncate text-gray-900 text-[11px]">
                                    {event.loan.loanName}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-gray-700 space-y-0.5">
                                  {event.investors.map((inv, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-1"
                                    >
                                      <span
                                        className={`font-bold ${
                                          isFutureSentDate
                                            ? 'text-yellow-500'
                                            : 'text-red-500'
                                        }`}
                                      >
                                        •
                                      </span>
                                      <span className="truncate">
                                        <span className="font-semibold">
                                          {inv.name}:
                                        </span>{' '}
                                        {formatCurrency(inv.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="font-bold text-gray-900 text-[11px] bg-white/60 px-1.5 py-0.5 rounded inline-block">
                                  Sent: {formatCurrency(event.totalAmount)}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      } else if (event.type === 'due') {
                        return (
                          <button
                            key={`${event.loan.id}-due-${eventIndex}`}
                            onClick={() => onLoanClick(event.loan)}
                            className="w-full text-left p-2 rounded-md text-xs hover:shadow-md transition-all bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600 shadow-sm"
                          >
                            <div className="space-y-0.5">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center justify-center w-3 h-3 rounded-full bg-green-600 flex-shrink-0">
                                    <ArrowDown className="h-2 w-2 text-white" />
                                  </div>
                                  <Badge
                                    variant={
                                      getLoanTypeBadge(event.loan.type).variant
                                    }
                                    className={`text-[8px] h-3.5 px-1 py-0 leading-none ${
                                      getLoanTypeBadge(event.loan.type)
                                        .className || ''
                                    }`}
                                  >
                                    {event.loan.type}
                                  </Badge>
                                  <Badge
                                    variant={
                                      getLoanStatusBadge(event.loan.status)
                                        .variant
                                    }
                                    className={`text-[8px] h-3.5 px-1 py-0 leading-none ${
                                      getLoanStatusBadge(event.loan.status)
                                        .className
                                    }`}
                                  >
                                    {event.loan.status}
                                  </Badge>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1 mb-1">
                                  <div className="font-bold truncate text-gray-900 text-[11px]">
                                    {event.loan.loanName}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-gray-700 space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">
                                      Principal:
                                    </span>
                                    <span className="font-semibold">
                                      {formatCurrency(event.totalPrincipal)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">
                                      Interest:
                                    </span>
                                    <span className="font-semibold">
                                      {formatCurrency(event.totalInterest)}
                                    </span>
                                  </div>
                                </div>
                                <div className="font-bold text-gray-900 text-[11px] bg-white/60 px-1.5 py-0.5 rounded inline-block">
                                  Due: {formatCurrency(event.totalAmount)}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
