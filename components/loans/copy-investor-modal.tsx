'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import type { Investor } from '@/lib/types';
import type { InterestPeriodData } from './multiple-interest-manager';

interface Transaction {
  id: string;
  amount: string;
  interestRate: string;
  interestAmount: string;
  interestType: 'rate' | 'fixed';
  sentDate: string;
  isPaid: boolean;
}

interface InvestorConfiguration {
  transactions: Transaction[];
  hasMultipleInterest: boolean;
  interestPeriods: InterestPeriodData[];
}

interface CopyInvestorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceInvestor: Investor;
  sourceInvestorConfig: InvestorConfiguration;
  availableInvestors: Investor[];
  onCopy: (targetInvestorIds: number[]) => void;
  selectedInvestorIds?: number[];
  selectedInvestorsConfigs?: Map<number, InvestorConfiguration>;
}

export function CopyInvestorModal({
  open,
  onOpenChange,
  sourceInvestor,
  sourceInvestorConfig,
  availableInvestors,
  onCopy,
  selectedInvestorIds = [],
  selectedInvestorsConfigs = new Map(),
}: CopyInvestorModalProps) {
  // Helper function to compare two configurations
  const configurationsMatch = (
    config1: InvestorConfiguration,
    config2: InvestorConfiguration
  ): boolean => {
    // Compare hasMultipleInterest
    if (config1.hasMultipleInterest !== config2.hasMultipleInterest) {
      return false;
    }

    // Compare transactions (ignore IDs and isPaid, compare structure and values)
    if (config1.transactions.length !== config2.transactions.length) {
      return false;
    }

    // Sort transactions by sentDate for comparison
    const sortTransactions = (txns: Transaction[]) =>
      [...txns].sort((a, b) => a.sentDate.localeCompare(b.sentDate));

    const sorted1 = sortTransactions(config1.transactions);
    const sorted2 = sortTransactions(config2.transactions);

    for (let i = 0; i < sorted1.length; i++) {
      const t1 = sorted1[i];
      const t2 = sorted2[i];

      // Compare basic fields
      if (
        t1.amount !== t2.amount ||
        t1.interestType !== t2.interestType ||
        t1.sentDate !== t2.sentDate
      ) {
        return false;
      }

      // Compare interest fields based on type
      if (t1.interestType === 'rate') {
        // For rate type, only compare interestRate
        if (t1.interestRate !== t2.interestRate) {
          return false;
        }
      } else {
        // For fixed type, only compare interestAmount
        if (t1.interestAmount !== t2.interestAmount) {
          return false;
        }
      }
    }

    // Compare interest periods if using multiple interest
    if (config1.hasMultipleInterest) {
      if (config1.interestPeriods.length !== config2.interestPeriods.length) {
        return false;
      }

      // Sort interest periods by dueDate for comparison
      const sortPeriods = (periods: InterestPeriodData[]) =>
        [...periods].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      const sortedPeriods1 = sortPeriods(config1.interestPeriods);
      const sortedPeriods2 = sortPeriods(config2.interestPeriods);

      for (let i = 0; i < sortedPeriods1.length; i++) {
        const p1 = sortedPeriods1[i];
        const p2 = sortedPeriods2[i];

        // Compare basic fields
        if (p1.dueDate !== p2.dueDate || p1.interestType !== p2.interestType) {
          return false;
        }

        // Compare interest fields based on type
        if (p1.interestType === 'rate') {
          // For rate type, only compare interestRate
          if (p1.interestRate !== p2.interestRate) {
            return false;
          }
        } else {
          // For fixed type, only compare interestAmount
          if (p1.interestAmount !== p2.interestAmount) {
            return false;
          }
        }
      }
    }

    return true;
  };

  // Helper function to find all investors with the same configuration as a given investor
  const findInvestorsWithSameConfig = useCallback(
    (targetConfig: InvestorConfiguration): number[] => {
      const matchingIds: number[] = [];

      availableInvestors.forEach((investor) => {
        const investorConfig = selectedInvestorsConfigs.get(investor.id);
        if (
          investorConfig &&
          configurationsMatch(targetConfig, investorConfig)
        ) {
          matchingIds.push(investor.id);
        }
      });

      return matchingIds;
    },
    [availableInvestors, selectedInvestorsConfigs]
  );

  // Track which investors are auto-checked (have matching configs) vs manually checked
  const [autoCheckedInvestorIds, setAutoCheckedInvestorIds] = useState<
    Set<number>
  >(new Set());
  const [checkedInvestorIds, setCheckedInvestorIds] = useState<number[]>([]);

  // Effect: Handle modal open/close - only runs when open changes
  useEffect(() => {
    if (open) {
      // On open, reset and find matching investors
      setCheckedInvestorIds([]);
      setAutoCheckedInvestorIds(new Set());

      // Find all investors with the same configuration as the source investor
      const matchingIds = findInvestorsWithSameConfig(sourceInvestorConfig);

      setAutoCheckedInvestorIds(new Set(matchingIds));
      setCheckedInvestorIds(matchingIds);
    } else {
      // Reset when modal closes
      setCheckedInvestorIds([]);
      setAutoCheckedInvestorIds(new Set());
    }
  }, [open, sourceInvestorConfig, findInvestorsWithSameConfig]);

  // Track previous configs to detect changes
  const prevConfigsRef = useRef<string>('');

  // Effect: Re-evaluate when configs change while modal is open
  useEffect(() => {
    if (!open) {
      prevConfigsRef.current = '';
      return;
    }

    // Create a stable representation of configs
    const configsKey = Array.from(selectedInvestorsConfigs.keys())
      .sort()
      .join(',');

    // Only re-evaluate if configs actually changed
    if (prevConfigsRef.current !== configsKey) {
      prevConfigsRef.current = configsKey;

      // Find all investors with the same configuration as the source investor
      const matchingIds = findInvestorsWithSameConfig(sourceInvestorConfig);

      setAutoCheckedInvestorIds(new Set(matchingIds));

      // Add new matches to existing checked list
      setCheckedInvestorIds((prev) => {
        const newSet = new Set(prev);
        matchingIds.forEach((id) => newSet.add(id));
        return Array.from(newSet);
      });
    }
  }, [
    open,
    selectedInvestorsConfigs,
    sourceInvestorConfig,
    findInvestorsWithSameConfig,
  ]);

  // Helper to check if an investor currently has matching config with source
  const hasMatchingConfig = useCallback(
    (investorId: number): boolean => {
      const investorConfig = selectedInvestorsConfigs.get(investorId);
      if (!investorConfig) {
        return false;
      }
      return configurationsMatch(sourceInvestorConfig, investorConfig);
    },
    [sourceInvestorConfig, selectedInvestorsConfigs]
  );

  const handleToggleInvestor = (investorId: number) => {
    const investorConfig = selectedInvestorsConfigs.get(investorId);
    const isCurrentlyChecked = checkedInvestorIds.includes(investorId);
    const currentlyMatches = hasMatchingConfig(investorId);

    // Don't allow unchecking if investor currently matches source config
    if (isCurrentlyChecked && currentlyMatches) {
      return;
    }

    if (isCurrentlyChecked) {
      // Unchecking investor - only allowed if config no longer matches
      setCheckedInvestorIds((prev) => prev.filter((id) => id !== investorId));
      // Remove from auto-checked set if it was there
      setAutoCheckedInvestorIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(investorId);
        return newSet;
      });
    } else {
      // Checking an investor
      if (investorConfig) {
        // If this investor has a config, find and check all investors with the same config
        const matchingIds = findInvestorsWithSameConfig(investorConfig);
        setCheckedInvestorIds((prev) => {
          const newSet = new Set([...prev, ...matchingIds]);
          return Array.from(newSet);
        });
        // Mark all matching investors as auto-checked
        setAutoCheckedInvestorIds((prev) => {
          const newSet = new Set([...prev, ...matchingIds]);
          return newSet;
        });
      } else {
        // Investor not in form yet - check it and also check all investors with same config as source
        const matchingIds = findInvestorsWithSameConfig(sourceInvestorConfig);
        setCheckedInvestorIds((prev) => {
          const newSet = new Set([...prev, investorId, ...matchingIds]);
          return Array.from(newSet);
        });
        // Mark all matching investors (including the one just checked) as auto-checked
        setAutoCheckedInvestorIds((prev) => {
          const newSet = new Set([...prev, investorId, ...matchingIds]);
          return newSet;
        });
      }
    }
  };

  const handleCopy = () => {
    if (checkedInvestorIds.length === 0) return;
    onCopy(checkedInvestorIds);
    setCheckedInvestorIds([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setCheckedInvestorIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Copy Investor Configuration</DialogTitle>
          <DialogDescription>
            Select investors to copy all configurations from{' '}
            <strong>{sourceInvestor.name}</strong>. This will copy all principal
            payments, interest configurations, and multiple interest periods.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Select Investors</Label>
            {availableInvestors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No other investors available to copy to
              </p>
            ) : (
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-3">
                  {availableInvestors.map((investor) => {
                    const isChecked = checkedInvestorIds.includes(investor.id);
                    const currentlyMatches = hasMatchingConfig(investor.id);
                    const isDisabled = isChecked && currentlyMatches;
                    const isAlreadyAdded = selectedInvestorIds.includes(investor.id);

                    return (
                      <div
                        key={investor.id}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`investor-${investor.id}`}
                          checked={isChecked}
                          disabled={isDisabled}
                          onCheckedChange={() =>
                            handleToggleInvestor(investor.id)
                          }
                        />
                        <Label
                          htmlFor={`investor-${investor.id}`}
                          className={`flex-1 text-sm ${
                            isDisabled
                              ? 'cursor-not-allowed opacity-60'
                              : 'cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{investor.name}</span>
                            {isAlreadyAdded && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                Added
                              </span>
                            )}
                            {currentlyMatches && isChecked && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                Same config
                              </span>
                            )}
                          </div>
                          {investor.email && (
                            <span className="text-xs text-muted-foreground">
                              {investor.email}
                            </span>
                          )}
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
              disabled={checkedInvestorIds.length === 0}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to {checkedInvestorIds.length} investor
              {checkedInvestorIds.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
