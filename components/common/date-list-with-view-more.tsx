'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DateListWithViewMoreProps {
  dates: Date[];
  limit?: number;
  className?: string;
  itemClassName?: string | ((date: Date, index: number) => string);
  dialogTitle?: string;
  formatDate?: (date: Date) => string;
  getItemClassName?: (date: Date, hasUnpaid?: boolean) => string;
  checkUnpaid?: (date: Date) => boolean;
}

export function DateListWithViewMore({
  dates,
  limit = 3,
  className = '',
  itemClassName = '',
  dialogTitle = 'All Dates',
  formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  getItemClassName,
  checkUnpaid,
}: DateListWithViewMoreProps) {
  const [showAllModal, setShowAllModal] = useState(false);

  const displayedDates = dates.slice(0, limit);
  const hasMore = dates.length > limit;

  const getClassName = (date: Date, index: number) => {
    if (typeof itemClassName === 'function') {
      return itemClassName(date, index);
    }

    if (getItemClassName) {
      const hasUnpaid = checkUnpaid ? checkUnpaid(date) : false;
      return getItemClassName(date, hasUnpaid);
    }

    return itemClassName;
  };

  return (
    <>
      <div className={`flex flex-col gap-0.5 items-start ${className}`}>
        {displayedDates.map((date, index) => {
          const hasUnpaid = checkUnpaid ? checkUnpaid(date) : false;
          return (
            <span key={index} className={getClassName(date, index)}>
              {formatDate(date)}
            </span>
          );
        })}
        {hasMore && (
          <Button
            variant="link"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAllModal(true);
            }}
            className="h-auto p-0 text-xs text-primary hover:underline"
          >
            View {dates.length - limit} more
          </Button>
        )}
      </div>

      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <div className="flex flex-col gap-2">
              {dates.map((date, index) => {
                const hasUnpaid = checkUnpaid ? checkUnpaid(date) : false;
                return (
                  <span key={index} className={getClassName(date, index)}>
                    {formatDate(date)}
                  </span>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
