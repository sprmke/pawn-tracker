'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, CheckSquare, Square } from 'lucide-react';
import { CSVColumn } from '@/lib/csv-export';

interface ExportColumnsModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: CSVColumn<T>[];
  onExport: (selectedColumns: CSVColumn<T>[]) => void;
  title?: string;
  description?: string;
}

export function ExportColumnsModal<T>({
  open,
  onOpenChange,
  columns,
  onExport,
  title = 'Select Columns to Export',
  description = 'Choose which columns you want to include in the exported CSV file.',
}: ExportColumnsModalProps<T>) {
  // Track selected column indices (all selected by default)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(columns.map((_, index) => index))
  );

  // Reset selections when modal opens or columns change
  useEffect(() => {
    if (open) {
      setSelectedIndices(new Set(columns.map((_, index) => index)));
    }
  }, [open, columns]);

  const handleToggleColumn = (index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedIndices(new Set(columns.map((_, index) => index)));
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleExport = () => {
    const selectedColumns = columns.filter((_, index) =>
      selectedIndices.has(index)
    );

    if (selectedColumns.length === 0) {
      alert('Please select at least one column to export');
      return;
    }

    onExport(selectedColumns);
    onOpenChange(false);
  };

  const allSelected = selectedIndices.size === columns.length;
  const noneSelected = selectedIndices.size === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select/Deselect All Buttons */}
          <div className="flex items-center gap-2 pb-3 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={allSelected}
              className="flex-1"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={noneSelected}
              className="flex-1"
            >
              <Square className="mr-2 h-4 w-4" />
              Deselect All
            </Button>
          </div>

          {/* Column Selection List */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleColumn(index)}
                >
                  <Checkbox
                    id={`column-${index}`}
                    checked={selectedIndices.has(index)}
                    onCheckedChange={() => handleToggleColumn(index)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    htmlFor={`column-${index}`}
                    className="flex-1 cursor-pointer font-medium text-sm"
                  >
                    {column.header}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Selection Summary */}
          <div className="text-sm text-muted-foreground pt-3 border-t">
            {selectedIndices.size} of {columns.length} columns selected
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={noneSelected}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

