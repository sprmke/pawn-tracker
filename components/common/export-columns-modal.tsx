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
import { FileText, CheckSquare, Square, Loader2 } from 'lucide-react';
import { PDFSection } from '@/lib/pdf-export';

interface ExportColumnsModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: PDFSection<T>[];
  onExport: (selectedSections: PDFSection<T>[]) => void | Promise<void>;
  title?: string;
  description?: string;
  isGenerating?: boolean;
}

export function ExportColumnsModal<T>({
  open,
  onOpenChange,
  sections,
  onExport,
  title = 'Configure PDF Export',
  description = 'Choose which sections to include in the exported PDF.',
  isGenerating = false,
}: ExportColumnsModalProps<T>) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(sections.map((_, index) => index))
  );

  useEffect(() => {
    if (open) {
      setSelectedIndices(new Set(sections.map((_, index) => index)));
    }
  }, [open, sections]);

  const handleToggleSection = (index: number) => {
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
    setSelectedIndices(new Set(sections.map((_, index) => index)));
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleExport = async () => {
    const selectedSections = sections.filter((_, index) =>
      selectedIndices.has(index)
    );
    await onExport(selectedSections);
  };

  const allSelected = selectedIndices.size === sections.length;
  const noneSelected = selectedIndices.size === 0;

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select/Deselect All */}
          <div className="flex items-center gap-2 pb-3 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={allSelected || isGenerating}
              className="flex-1"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={noneSelected || isGenerating}
              className="flex-1"
            >
              <Square className="mr-2 h-4 w-4" />
              Deselect All
            </Button>
          </div>

          {/* Section Selection List */}
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-1">
              {sections.map((section, index) => (
                <div
                  key={section.key}
                  className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => !isGenerating && handleToggleSection(index)}
                >
                  <Checkbox
                    id={`section-${section.key}`}
                    checked={selectedIndices.has(index)}
                    onCheckedChange={() => handleToggleSection(index)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isGenerating}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`section-${section.key}`}
                      className="cursor-pointer font-medium text-sm leading-none"
                    >
                      {section.header}
                    </Label>
                    {section.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Selection Summary */}
          <div className="text-sm text-muted-foreground pt-3 border-t">
            {selectedIndices.size} of {sections.length} sections selected
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={noneSelected || isGenerating}
            className="gap-2 min-w-[130px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
