'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { ViewMode, LegendGroup } from './types';

interface CalendarHeaderProps {
  title: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  showLegend?: boolean;
  legendGroups?: LegendGroup[];
}

export function CalendarHeader({
  title,
  viewMode,
  onViewModeChange,
  onToday,
  onPrevious,
  onNext,
  showLegend = true,
  legendGroups,
}: CalendarHeaderProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <div className="flex flex-col-reverse xl:flex-row items-start sm:items-end xl:items-center gap-3">
              {/* Legend */}
              {showLegend && legendGroups && legendGroups.length > 0 && (
                <div className="flex flex-wrap items-center text-xs py-1.5 px-2 md:px-3 border border-gray-200 rounded-lg">
                  {legendGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="flex items-center">
                      {groupIndex > 0 && (
                        <div className="h-4 md:h-6 w-px bg-gray-300 inline-block mx-2 md:mx-4" />
                      )}
                      <div className="inline-flex items-center gap-1 md:gap-2">
                        <span className="font-semibold text-gray-600 hidden sm:inline">
                          {group.title}:
                        </span>
                        {group.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center gap-1 md:gap-1.5"
                          >
                            <div
                              className={`flex items-center justify-center w-2 h-2 md:w-3 md:h-3 rounded-full ${item.color}`}
                            ></div>
                            <span className="font-medium text-[10px] md:text-xs">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3">
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
        </div>
      </CardContent>
    </Card>
  );
}
