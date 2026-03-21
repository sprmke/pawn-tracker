'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { FileText, Filter, Loader2 } from 'lucide-react';
import { PDFSection } from '@/lib/pdf-export';
import { ExportColumnsModal } from './export-columns-modal';
import { toast } from 'sonner';

interface ExportButtonProps<T> {
  data: T[];
  filteredData: T[];
  sections: PDFSection<T>[];
  filename?: string;
  onGeneratePDF: (data: T[], enabledSectionKeys: string[]) => Promise<void>;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportButton<T>({
  data,
  filteredData,
  sections,
  onGeneratePDF,
  variant = 'outline',
  size = 'default',
  className = '',
}: ExportButtonProps<T>) {
  const [showModal, setShowModal] = useState(false);
  const [exportAllData, setExportAllData] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportClick = (exportAll: boolean) => {
    setExportAllData(exportAll);
    setShowModal(true);
  };

  const handleExport = async (selectedSections: PDFSection<T>[]) => {
    const dataToExport = exportAllData ? data : filteredData;

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    if (selectedSections.length === 0) {
      toast.error('Please select at least one section to export');
      return;
    }

    const enabledKeys = selectedSections.map((s) => s.key);

    setIsGenerating(true);
    try {
      await onGeneratePDF(dataToExport, enabledKeys);
      setShowModal(false);
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasFilters = data.length !== filteredData.length;
  const dataCount = exportAllData ? data.length : filteredData.length;
  const itemLabel = dataCount === 1 ? 'item' : 'items';

  const modalDescription = `Choose which sections to include in the exported PDF. (${dataCount} ${itemLabel})`;

  // Single button when no filters
  if (!hasFilters) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => handleExportClick(true)}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 xl:mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 xl:mr-2" />
          )}
          <span className="hidden xl:inline">Export PDF</span>
        </Button>
        <ExportColumnsModal
          open={showModal}
          onOpenChange={setShowModal}
          sections={sections}
          onExport={handleExport}
          title="Configure PDF Export"
          description={modalDescription}
          isGenerating={isGenerating}
        />
      </>
    );
  }

  // Dropdown when filters are active
  return (
    <>
      <DropdownMenu
        trigger={
          <Button variant={variant} size={size} className={className} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 md:mr-2" />
            )}
            <span className="hidden md:inline">Export PDF</span>
          </Button>
        }
        items={[
          {
            label: `Export All Data (${data.length} ${data.length === 1 ? 'item' : 'items'})`,
            icon: <FileText className="h-4 w-4" />,
            onClick: () => handleExportClick(true),
          },
          {
            label: `Export Filtered Data (${filteredData.length} ${filteredData.length === 1 ? 'item' : 'items'})`,
            icon: <Filter className="h-4 w-4" />,
            onClick: () => handleExportClick(false),
          },
        ]}
        align="end"
      />
      <ExportColumnsModal
        open={showModal}
        onOpenChange={setShowModal}
        sections={sections}
        onExport={handleExport}
        title="Configure PDF Export"
        description={modalDescription}
        isGenerating={isGenerating}
      />
    </>
  );
}
