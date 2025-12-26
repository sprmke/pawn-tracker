'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, Filter } from 'lucide-react';
import { convertToCSV, downloadCSV, CSVColumn } from '@/lib/csv-export';
import { ExportColumnsModal } from './export-columns-modal';

interface ExportButtonProps<T> {
  data: T[];
  filteredData: T[];
  columns: CSVColumn<T>[];
  filename: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportButton<T>({
  data,
  filteredData,
  columns,
  filename,
  variant = 'outline',
  size = 'default',
  className = '',
}: ExportButtonProps<T>) {
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [exportAllData, setExportAllData] = useState(true);

  const handleExportClick = (exportAll: boolean) => {
    setExportAllData(exportAll);
    setShowColumnsModal(true);
  };

  const handleExport = (selectedColumns: CSVColumn<T>[]) => {
    const dataToExport = exportAllData ? data : filteredData;

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = convertToCSV(dataToExport, selectedColumns);
    const timestamp = new Date().toISOString().split('T')[0];
    const exportType = exportAllData ? 'all' : 'filtered';
    const fullFilename = `${filename}_${exportType}_${timestamp}.csv`;

    downloadCSV(csvContent, fullFilename);
  };

  const hasFilters = data.length !== filteredData.length;

  // If no filters are active, show single button that opens modal
  if (!hasFilters) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => handleExportClick(true)}
        >
          <Download className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline">Export CSV</span>
        </Button>
        <ExportColumnsModal
          open={showColumnsModal}
          onOpenChange={setShowColumnsModal}
          columns={columns}
          onExport={handleExport}
          title="Select Columns to Export"
          description={`Choose which columns you want to include in the exported CSV file. (${data.length} ${
            data.length === 1 ? 'item' : 'items'
          })`}
        />
      </>
    );
  }

  // If filters are active, show dropdown with both options
  return (
    <>
      <DropdownMenu
        trigger={
          <Button variant={variant} size={size} className={className}>
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Export CSV</span>
          </Button>
        }
        items={[
          {
            label: `Export All Data (${data.length} ${
              data.length === 1 ? 'item' : 'items'
            })`,
            icon: <FileSpreadsheet className="h-4 w-4" />,
            onClick: () => handleExportClick(true),
          },
          {
            label: `Export Filtered Data (${filteredData.length} ${
              filteredData.length === 1 ? 'item' : 'items'
            })`,
            icon: <Filter className="h-4 w-4" />,
            onClick: () => handleExportClick(false),
          },
        ]}
        align="end"
      />
      <ExportColumnsModal
        open={showColumnsModal}
        onOpenChange={setShowColumnsModal}
        columns={columns}
        onExport={handleExport}
        title="Select Columns to Export"
        description={`Choose which columns you want to include in the exported CSV file. (${
          exportAllData ? data.length : filteredData.length
        } ${
          (exportAllData ? data.length : filteredData.length) === 1
            ? 'item'
            : 'items'
        })`}
      />
    </>
  );
}
