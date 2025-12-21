# Due Date Filter Implementation

## Overview
Added support for filtering loans by due date via URL query parameter. This allows users to click on Google Calendar "View Loans" links and see only loans due on that specific date.

## Changes Made

### 1. Loans Page (`app/loans/page.tsx`)
- **Added `useSearchParams` hook** to read URL query parameters
- **Added `dueDateFilter` state** from `searchParams.get('dueDate')`
- **Enhanced filtering logic** to check both:
  - Main loan due dates
  - Interest period due dates (for loans with multiple interest periods)
- **Updated `clearFilters` function** to clear the URL parameter when clearing filters
- **Added visual indicator** showing a badge with the filtered date and an X button to clear it
- **Updated `hasActiveFilters`** to include the due date filter

### 2. Google Calendar (`lib/google-calendar.ts`)
- **Updated `createEventDescription` function** for summary events
- **Modified "View Loans" link** to include `?dueDate=YYYY-MM-DD` parameter
- This ensures that when users click "View Loans" from the Daily Summary event in Google Calendar, they are redirected to the loans page with the appropriate date filter applied

## How It Works

### URL Format
```
/loans?dueDate=2024-12-18
```

### Filter Logic
When a `dueDate` query parameter is present, the loans page will:
1. Check if the loan's main `dueDate` matches the filter date
2. If not, check all interest periods for any matching due dates
3. Only show loans that have at least one due date matching the filter

### Google Calendar Integration
When the Daily Summary event is created in Google Calendar:
- The "View Loans" link includes the date: `/loans?dueDate=2024-12-18`
- Clicking this link opens the app and automatically filters to show only loans due on that date
- Users can see exactly which loans are due on the day they clicked

## Testing

### Manual Testing
1. **Test URL parameter directly:**
   ```
   http://localhost:3000/loans?dueDate=2024-12-25
   ```
   - Should show only loans due on December 25, 2024
   - Should display a badge showing "Due on: Dec 25, 2024"

2. **Test with no matching loans:**
   ```
   http://localhost:3000/loans?dueDate=2030-01-01
   ```
   - Should show "No loans match your filters" message

3. **Test clear filter:**
   - Click the X button on the due date badge
   - Should navigate back to `/loans` without the query parameter
   - Should show all loans again

4. **Test with other filters:**
   - Apply a due date filter
   - Also apply status, type, or other filters
   - All filters should work together

### Google Calendar Testing
1. Run calendar sync to create/update events
2. Open Google Calendar
3. Find a Daily Summary event
4. Click "View Loans" link in the event description
5. Should open the app with the date filter applied
6. Should show only loans due on that specific date

## Date Format
- Uses `YYYY-MM-DD` format (ISO 8601)
- Consistent with the `toLocalDateString` utility function
- Example: `2024-12-18`

## Edge Cases Handled
- ✅ Loans with single due dates
- ✅ Loans with multiple interest periods
- ✅ Combining due date filter with other filters
- ✅ Clearing the due date filter
- ✅ Invalid or non-existent dates (will show no results)
- ✅ Visual feedback when filter is active

## Future Enhancements (Optional)
- Add a date picker UI element to select due dates without manually editing the URL
- Add a "Due Today" quick filter button
- Add "Due This Week" or "Due This Month" filters
- Show count of loans per due date in calendar view

