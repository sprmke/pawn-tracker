'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, Filter } from 'lucide-react';
import { convertToCSV, downloadCSV, CSVColumn } from '@/lib/csv-export';

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
  const handleExport = (exportAll: boolean) => {
    const dataToExport = exportAll ? data : filteredData;
    
    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = convertToCSV(dataToExport, columns);
    const timestamp = new Date().toISOString().split('T')[0];
    const exportType = exportAll ? 'all' : 'filtered';
    const fullFilename = `${filename}_${exportType}_${timestamp}.csv`;
    
    downloadCSV(csvContent, fullFilename);
  };

  const hasFilters = data.length !== filteredData.length;

  return (
    <DropdownMenu
      trigger={
        <Button variant={variant} size={size} className={className}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      }
      items={[
        {
          label: `Export All Data (${data.length} ${data.length === 1 ? 'item' : 'items'})`,
          icon: <FileSpreadsheet className="h-4 w-4" />,
          onClick: () => handleExport(true),
        },
        {
          label: `Export Filtered Data (${filteredData.length} ${filteredData.length === 1 ? 'item' : 'items'}${hasFilters ? ' - filtered' : ''})`,
          icon: <Filter className="h-4 w-4" />,
          onClick: () => handleExport(false),
        },
      ]}
      align="end"
    />
  );
}

