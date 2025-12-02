'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { InterestPeriodData } from './multiple-interest-manager';

interface PeriodConfiguration {
  interestRate: string;
  interestAmount: string;
  interestType: string;
}

interface CopyPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePeriod: InterestPeriodData;
  sourcePeriodIndex: number;
  availablePeriods: InterestPeriodData[];
  onCopy: (targetPeriodIds: string[], applyToAll: boolean) => void;
}

export function CopyPeriodModal({
  open,
  onOpenChange,
  sourcePeriod,
  sourcePeriodIndex,
  availablePeriods,
  onCopy,
}: CopyPeriodModalProps) {
  // Helper function to compare two period configurations (only interest, not dueDate)
  const periodConfigurationsMatch = (
    config1: PeriodConfiguration,
    config2: PeriodConfiguration
  ): boolean => {
    // Compare interest type
    if (config1.interestType !== config2.interestType) {
      return false;
    }

    // Compare interest fields based on type
    if (config1.interestType === 'rate') {
      // For rate type, only compare interestRate
      return config1.interestRate === config2.interestRate;
    } else {
      // For fixed type, only compare interestAmount
      return config1.interestAmount === config2.interestAmount;
    }
  };

  // Get source period configuration
  const getSourceConfig = (): PeriodConfiguration => {
    return {
      interestRate: sourcePeriod.interestRate || '',
      interestAmount: sourcePeriod.interestAmount || '',
      interestType: sourcePeriod.interestType || 'rate',
    };
  };

  // Get period configuration
  const getPeriodConfig = (period: InterestPeriodData): PeriodConfiguration => {
    return {
      interestRate: period.interestRate || '',
      interestAmount: period.interestAmount || '',
      interestType: period.interestType || 'rate',
    };
  };

  // Helper function to find all periods with the same configuration as source
  const findPeriodsWithSameConfig = useCallback((): string[] => {
    const sourceConfig = getSourceConfig();
    const matchingIds: string[] = [];

    availablePeriods.forEach((period) => {
      // Skip the source period itself
      if (period.id === sourcePeriod.id) return;

      const periodConfig = getPeriodConfig(period);
      if (periodConfigurationsMatch(sourceConfig, periodConfig)) {
        matchingIds.push(period.id);
      }
    });

    return matchingIds;
  }, [sourcePeriod, availablePeriods]);

  // Track which periods are auto-checked (have matching configs) vs manually checked
  const [autoCheckedPeriodIds, setAutoCheckedPeriodIds] = useState<Set<string>>(
    new Set()
  );
  const [checkedPeriodIds, setCheckedPeriodIds] = useState<string[]>([]);
  const [applyToAll, setApplyToAll] = useState(false);

  // Effect: Handle modal open/close - only runs when open changes
  useEffect(() => {
    if (open) {
      // On open, reset and find matching periods
      setCheckedPeriodIds([]);
      setAutoCheckedPeriodIds(new Set());
      setApplyToAll(false);

      // Find all periods with the same configuration as the source period
      const matchingIds = findPeriodsWithSameConfig();

      setAutoCheckedPeriodIds(new Set(matchingIds));
      setCheckedPeriodIds(matchingIds);
    } else {
      // Reset when modal closes
      setCheckedPeriodIds([]);
      setAutoCheckedPeriodIds(new Set());
      setApplyToAll(false);
    }
  }, [open, findPeriodsWithSameConfig]);

  // Helper to check if a period currently has matching config with source
  const hasMatchingConfig = useCallback(
    (periodId: string): boolean => {
      const period = availablePeriods.find((p) => p.id === periodId);
      if (!period) return false;

      const sourceConfig = getSourceConfig();
      const periodConfig = getPeriodConfig(period);
      return periodConfigurationsMatch(sourceConfig, periodConfig);
    },
    [sourcePeriod, availablePeriods]
  );

  const handleTogglePeriod = (periodId: string) => {
    const isCurrentlyChecked = checkedPeriodIds.includes(periodId);

    if (isCurrentlyChecked) {
      // Unchecking period - just remove it from checked list
      setCheckedPeriodIds((prev) => prev.filter((id) => id !== periodId));
      // Remove from auto-checked set if it was there
      setAutoCheckedPeriodIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(periodId);
        return newSet;
      });
    } else {
      // Checking a period - only toggle this specific period
      setCheckedPeriodIds((prev) => {
        const newSet = new Set([...prev, periodId]);
        return Array.from(newSet);
      });
      // Don't mark as auto-checked since this is a manual selection
    }
  };

  const handleApplyToAllChange = (checked: boolean) => {
    setApplyToAll(checked);
    if (checked) {
      // Check all periods except source
      const allPeriodIds = availablePeriods
        .filter((p) => p.id !== sourcePeriod.id)
        .map((p) => p.id);
      setCheckedPeriodIds(allPeriodIds);
    } else {
      // Reset to only matching periods
      const matchingIds = findPeriodsWithSameConfig();
      setCheckedPeriodIds(matchingIds);
      setAutoCheckedPeriodIds(new Set(matchingIds));
    }
  };

  const handleCopy = () => {
    if (checkedPeriodIds.length === 0 && !applyToAll) return;
    onCopy(checkedPeriodIds, applyToAll);
    setCheckedPeriodIds([]);
    setApplyToAll(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setCheckedPeriodIds([]);
    setApplyToAll(false);
    onOpenChange(false);
  };

  const sourceConfig = getSourceConfig();
  const sourceDisplayValue =
    sourceConfig.interestType === 'rate'
      ? `${sourceConfig.interestRate}%`
      : `₱${parseFloat(sourceConfig.interestAmount || '0').toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Copy Period Interest</DialogTitle>
          <DialogDescription>
            Select periods to copy interest configuration from{' '}
            <strong>Period {sourcePeriodIndex + 1}</strong> ({sourceDisplayValue}
            ). This will only copy the interest rate/amount, not the due date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply-to-all"
              checked={applyToAll}
              onCheckedChange={handleApplyToAllChange}
            />
            <Label
              htmlFor="apply-to-all"
              className="text-sm font-medium cursor-pointer"
            >
              Apply to all periods
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Select Periods</Label>
            {availablePeriods.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No other periods available to copy to
              </p>
            ) : (
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-3">
                  {availablePeriods.map((period, index) => {
                    // Skip the source period
                    if (period.id === sourcePeriod.id) return null;

                    const isChecked = checkedPeriodIds.includes(period.id);
                    const currentlyMatches = hasMatchingConfig(period.id);

                    const periodConfig = getPeriodConfig(period);
                    const periodDisplayValue =
                      periodConfig.interestType === 'rate'
                        ? `${periodConfig.interestRate}%`
                        : `₱${parseFloat(periodConfig.interestAmount || '0').toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`;

                    return (
                      <div
                        key={period.id || `period-${index}`}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`period-${period.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleTogglePeriod(period.id)}
                        />
                        <Label
                          htmlFor={`period-${period.id}`}
                          className="flex-1 text-sm cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              Period {index + 1}
                              {index === availablePeriods.length - 1
                                ? ' (Final)'
                                : ''}
                            </span>
                            {currentlyMatches && isChecked && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                Same interest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Due: {formatDate(period.dueDate)}</span>
                            <span>•</span>
                            <span>Interest: {periodDisplayValue}</span>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCopy}
              disabled={checkedPeriodIds.length === 0 && !applyToAll}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to{' '}
              {applyToAll
                ? 'all periods'
                : `${checkedPeriodIds.length} period${checkedPeriodIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

