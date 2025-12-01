'use client';

import { useState } from 'react';
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

interface CopyInvestorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceInvestor: Investor;
  availableInvestors: Investor[];
  onCopy: (targetInvestorIds: number[]) => void;
  selectedInvestorIds?: number[];
}

export function CopyInvestorModal({
  open,
  onOpenChange,
  sourceInvestor,
  availableInvestors,
  onCopy,
  selectedInvestorIds = [],
}: CopyInvestorModalProps) {
  const [checkedInvestorIds, setCheckedInvestorIds] = useState<number[]>([]);

  const handleToggleInvestor = (investorId: number) => {
    setCheckedInvestorIds((prev) =>
      prev.includes(investorId)
        ? prev.filter((id) => id !== investorId)
        : [...prev, investorId]
    );
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
                    const isAlreadyInForm = selectedInvestorIds.includes(
                      investor.id
                    );
                    return (
                      <div
                        key={investor.id}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`investor-${investor.id}`}
                          checked={checkedInvestorIds.includes(investor.id)}
                          onCheckedChange={() =>
                            handleToggleInvestor(investor.id)
                          }
                        />
                        <Label
                          htmlFor={`investor-${investor.id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span>{investor.name}</span>
                            {isAlreadyInForm && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                Already in form
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
