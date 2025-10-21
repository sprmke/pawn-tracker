'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { ViewMode } from './types';

interface CalendarHeaderProps {
  title: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  showLegend?: boolean;
}

export function CalendarHeader({
  title,
  viewMode,
  onViewModeChange,
  onToday,
  onPrevious,
  onNext,
  showLegend = true,
}: CalendarHeaderProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              {/* Legend */}
              {showLegend && (
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
              )}
              {/* View Mode Selector */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('day')}
                  className="h-7 px-2 text-xs"
                >
                  Day
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('week')}
                  className="h-7 px-2 text-xs"
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('month')}
                  className="h-7 px-2 text-xs"
                >
                  Month
                </Button>
              </div>
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={onPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
