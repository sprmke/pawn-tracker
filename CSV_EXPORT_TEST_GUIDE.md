# CSV Export Testing Guide

## Quick Test Checklist

### 1. Loans Page (`/loans`)
- [ ] Navigate to `/loans`
- [ ] Verify "Export CSV" button is visible in the header
- [ ] Click "Export CSV" → "Export All Data"
- [ ] Verify CSV file downloads with name format: `loans_all_YYYY-MM-DD.csv`
- [ ] Open CSV in Excel/Google Sheets - verify all columns are present
- [ ] Apply filters (e.g., Status = "Fully Funded", Type = "Lot Title")
- [ ] Click "Export CSV" → "Export Filtered Data"
- [ ] Verify CSV contains only filtered items
- [ ] Verify filename format: `loans_filtered_YYYY-MM-DD.csv`

**Expected Columns:**
- Loan Name, Type, Status
- Due Date, Sent Dates, All Due Dates
- Total Principal, Average Rate (%), Total Interest, Total Amount
- Free Lot (sqm), Investors (comma-separated list)
- Notes

### 2. Investors Page (`/investors`)
- [ ] Navigate to `/investors`
- [ ] Verify "Export CSV" button is visible in the header
- [ ] Click "Export CSV" → "Export All Data"
- [ ] Verify CSV file downloads with name format: `investors_all_YYYY-MM-DD.csv`
- [ ] Open CSV - verify all columns are present
- [ ] Apply filters (e.g., Loan Status = "Has Active Loans")
- [ ] Click "Export CSV" → "Export Filtered Data"
- [ ] Verify CSV contains only filtered items

**Expected Columns:**
- Name, Email, Contact Number
- Total Capital (₱), Average Rate (%), Total Interest (₱), Total Amount (₱)
- Current Balance (₱), Total Gain (₱)
- Active Loans, Completed Loans, Overdue Loans, Total Loans

### 3. Transactions Page (`/transactions`)
- [ ] Navigate to `/transactions`
- [ ] Verify "Export CSV" button is visible in the header
- [ ] Click "Export CSV" → "Export All Data"
- [ ] Verify CSV file downloads with name format: `transactions_all_YYYY-MM-DD.csv`
- [ ] Open CSV - verify all columns including "Overall Balance"
- [ ] Apply filters (e.g., Type = "Investment", Direction = "In")
- [ ] Click "Export CSV" → "Export Filtered Data"
- [ ] Verify CSV contains only filtered items
- [ ] Verify "Overall Balance" is calculated correctly

**Expected Columns:**
- Date, Name, Investor
- Type, Direction
- Amount (₱), Investor Balance (₱), Overall Balance (₱)
- Notes

### 4. Investor Detail Page (`/investors/[id]`)

#### Loans Tab
- [ ] Navigate to any investor detail page
- [ ] Go to "Loans" tab
- [ ] Verify "Export CSV" button is visible
- [ ] Click "Export CSV" → "Export All Data"
- [ ] Verify filename includes investor name: `loans_[Investor_Name]_all_YYYY-MM-DD.csv`
- [ ] Apply filters (e.g., Status = "Completed")
- [ ] Click "Export CSV" → "Export Filtered Data"
- [ ] Verify only filtered loans are exported

#### Transactions Tab
- [ ] Go to "Transactions" tab
- [ ] Verify "Export CSV" button is visible
- [ ] Click "Export CSV" → "Export All Data"
- [ ] Verify filename includes investor name: `transactions_[Investor_Name]_all_YYYY-MM-DD.csv`
- [ ] Apply filters (e.g., Type = "Loan")
- [ ] Click "Export CSV" → "Export Filtered Data"
- [ ] Verify only filtered transactions are exported

## Data Validation Tests

### Test 1: Special Characters
1. Create a loan with notes containing:
   - Commas: "Test, with, commas"
   - Quotes: 'Test "quoted" text'
   - Newlines: "Line 1\nLine 2"
2. Export the loan
3. Open in Excel/Google Sheets
4. Verify the notes field displays correctly

### Test 2: Empty Datasets
1. Apply filters that result in 0 items
2. Try to export filtered data
3. Verify appropriate message is shown

### Test 3: Large Datasets
1. If you have 50+ items, export all
2. Verify all items are included in CSV
3. Check file opens correctly in Excel

### Test 4: Calculated Fields
1. Export loans with multiple investors
2. Verify "Total Principal" matches sum shown in UI
3. Verify "Average Rate" is calculated correctly
4. Verify "Total Interest" matches UI display

### Test 5: Date Formatting
1. Export any data with dates
2. Verify dates are in YYYY-MM-DD format
3. Verify dates can be sorted correctly in Excel

### Test 6: Currency Formatting
1. Export any data with currency
2. Verify amounts are decimal numbers (e.g., 10000.00)
3. Verify no currency symbols in CSV
4. Verify Excel can format as currency

## Browser Compatibility Tests

### Chrome/Edge
- [ ] Test all export functions
- [ ] Verify file downloads automatically
- [ ] Check CSV opens correctly

### Firefox
- [ ] Test all export functions
- [ ] Verify file downloads automatically
- [ ] Check CSV opens correctly

### Safari
- [ ] Test all export functions
- [ ] Verify file downloads automatically
- [ ] Check CSV opens correctly

### Mobile (Optional)
- [ ] Test on mobile browser
- [ ] Verify export button is accessible
- [ ] Check file downloads

## Common Issues and Solutions

### Issue: CSV opens with garbled characters
**Solution:** The CSV includes UTF-8 BOM. Try:
1. Open Excel
2. Go to Data → Get Data → From Text/CSV
3. Select the CSV file
4. Choose UTF-8 encoding

### Issue: Dates appear as numbers in Excel
**Solution:** 
1. Select the date column
2. Format → Cells → Date
3. Choose desired date format

### Issue: Currency shows too many decimals
**Solution:**
1. Select currency columns
2. Format → Cells → Number
3. Set decimal places to 2

### Issue: Export button not visible
**Solution:**
- Check screen size (might be hidden on very small screens)
- Refresh the page
- Check browser console for errors

## Performance Benchmarks

Expected export times (approximate):
- 10 items: < 100ms
- 100 items: < 500ms
- 1000 items: < 2 seconds
- 5000+ items: < 5 seconds

If export takes longer, check:
- Browser performance
- Number of calculated fields
- Network conditions (shouldn't affect local export)

## Reporting Issues

If you find any issues, please report with:
1. Page where issue occurred
2. Number of items being exported
3. Filters applied (if any)
4. Browser and version
5. Error message (if any)
6. Screenshot of the issue

## Success Criteria

✅ All export buttons are visible and functional
✅ Both "Export All" and "Export Filtered" work correctly
✅ Filenames follow the correct naming convention
✅ All expected columns are present in exports
✅ Data matches what's displayed in the UI
✅ Special characters are properly escaped
✅ CSV opens correctly in Excel and Google Sheets
✅ Calculated fields are accurate
✅ Filters are respected in filtered exports
✅ Sort order is maintained in exports

