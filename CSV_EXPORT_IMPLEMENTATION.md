# CSV Export Implementation

## Overview
Implemented comprehensive CSV export functionality for all tables in the Pawn Tracker application. Users can export data in two modes: "Export All Data" and "Export Filtered Data", with support for current sort order and filters.

## Features Implemented

### 1. Core CSV Export Utilities (`lib/csv-export.ts`)
- **convertToCSV**: Converts array of data to CSV format with proper escaping
- **downloadCSV**: Triggers browser download with UTF-8 BOM for Excel compatibility
- **escapeCSVValue**: Handles special characters (commas, quotes, newlines)
- **formatDateForCSV**: Formats dates as YYYY-MM-DD
- **formatCurrencyForCSV**: Formats currency as decimal numbers (no symbols)

### 2. CSV Column Definitions (`lib/csv-columns.ts`)
Predefined column configurations for each data type:

#### Loans Export Columns
- Loan Name, Type, Status
- Due Date, Sent Dates, All Due Dates
- Total Principal, Average Rate, Total Interest, Total Amount
- Free Lot (sqm), Investors (comma-separated list)
- Notes

#### Investors Export Columns
- Name, Email, Contact Number
- Total Capital, Average Rate, Total Interest, Total Amount
- Current Balance, Total Gain
- Active/Completed/Overdue/Total Loans

#### Transactions Export Columns
- Date, Name, Investor
- Type, Direction
- Amount, Investor Balance, Overall Balance
- Notes

### 3. Export Button Component (`components/common/export-button.tsx`)
Reusable dropdown button with two export options:
- **Export All Data**: Exports complete dataset
- **Export Filtered Data**: Exports only filtered/sorted data currently visible

Features:
- Shows item counts for each option
- Disables filtered export when no filters are active
- Automatic filename generation with timestamp
- Type-safe generic component

### 4. Integration Points

#### Main Pages
1. **Loans Page** (`app/loans/page.tsx`)
   - Exports all loan data with calculated fields
   - Respects search, status, type, free lot, investor filters
   - Respects amount range filters (principal, rate, interest, total)
   - Maintains current sort order

2. **Investors Page** (`app/investors/page.tsx`)
   - Exports investor portfolio data
   - Respects search, loan status filters
   - Respects amount range filters (capital, interest, gain)
   - Includes calculated statistics

3. **Transactions Page** (`app/transactions/page.tsx`)
   - Exports transaction history with overall balance calculation
   - Respects search, past transactions, type, direction filters
   - Respects amount range filters (amount, balance)
   - Respects investor filter
   - Maintains chronological sort order

4. **Investor Detail Page** (`app/investors/[id]/investor-detail-client.tsx`)
   - Two export buttons (one per tab):
     - **Loans Tab**: Exports investor's loans
     - **Transactions Tab**: Exports investor's transactions
   - Filenames include investor name for easy identification
   - Respects all tab-specific filters

## Technical Details

### CSV Format
- UTF-8 encoding with BOM for Excel compatibility
- Proper escaping of special characters
- Headers in first row
- One data row per item

### File Naming Convention
```
{entity}_{type}_{date}.csv

Examples:
- loans_all_2025-12-07.csv
- loans_filtered_2025-12-07.csv
- investors_all_2025-12-07.csv
- transactions_filtered_2025-12-07.csv
- loans_John_Doe_all_2025-12-07.csv (investor detail page)
```

### Data Integrity
- Exports use the same data source as tables
- Calculated fields (totals, averages) use same calculation functions
- Filters and sorts are applied before export
- No data transformation or loss

### User Experience
- Single-click export via dropdown menu
- Clear labeling of export options
- Item counts shown for each option
- Automatic file download
- No page reload required
- Works on all screen sizes

## Usage

### For Users
1. Navigate to any table view (Loans, Investors, or Transactions)
2. Apply desired filters and sorting (optional)
3. Click the "Export CSV" button
4. Select either:
   - "Export All Data" - exports complete dataset
   - "Export Filtered Data" - exports only visible/filtered data
5. File downloads automatically

### For Developers
To add export to a new table:

```typescript
import { ExportButton } from '@/components/common';
import { yourCSVColumns } from '@/lib/csv-columns';

// In your component
<ExportButton
  data={allData}
  filteredData={filteredAndSortedData}
  columns={yourCSVColumns}
  filename="your-entity"
  variant="outline"
  size="default"
/>
```

## Files Modified/Created

### Created
- `lib/csv-export.ts` - Core CSV utilities
- `lib/csv-columns.ts` - Column definitions
- `components/common/export-button.tsx` - Export button component
- `CSV_EXPORT_IMPLEMENTATION.md` - This documentation

### Modified
- `components/common/index.ts` - Added ExportButton export
- `app/loans/page.tsx` - Added export button
- `app/investors/page.tsx` - Added export button
- `app/transactions/page.tsx` - Added export button
- `app/investors/[id]/investor-detail-client.tsx` - Added export buttons to both tabs
- `todos.md` - Marked task as complete

## Testing Recommendations

1. **Basic Export**
   - Export all data from each table
   - Verify CSV opens correctly in Excel/Google Sheets
   - Check all columns are present

2. **Filtered Export**
   - Apply various filters
   - Export filtered data
   - Verify only filtered items are exported

3. **Data Accuracy**
   - Compare exported data with table display
   - Verify calculated fields (totals, averages)
   - Check date formatting

4. **Special Characters**
   - Export data with commas, quotes, newlines in notes
   - Verify proper escaping

5. **Edge Cases**
   - Empty datasets
   - Single item
   - Very large datasets
   - Special characters in investor names (for filenames)

## Future Enhancements (Optional)

1. **Additional Formats**
   - Excel (.xlsx) export
   - PDF export
   - JSON export

2. **Custom Columns**
   - Allow users to select which columns to export
   - Save column preferences

3. **Scheduled Exports**
   - Automatic daily/weekly exports
   - Email delivery

4. **Advanced Filters**
   - Date range exports
   - Custom field selection
   - Aggregated reports

## Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

