# Technical Implementation Details: Due Date Filter

## Architecture Overview

This feature implements a URL-based filtering system that allows users to filter loans by due date using query parameters. The implementation spans two main files:

1. **Frontend**: `app/loans/page.tsx` - Handles URL parameter reading and loan filtering
2. **Backend**: `lib/google-calendar.ts` - Generates calendar events with filtered URLs

## Implementation Details

### 1. URL Parameter Reading (`app/loans/page.tsx`)

#### Import Changes
```typescript
import { useRouter, useSearchParams } from 'next/navigation';
import { toLocalDateString } from '@/lib/date-utils';
```

- Added `useSearchParams` hook to read URL query parameters
- Imported `toLocalDateString` utility for date formatting consistency

#### State Management
```typescript
const searchParams = useSearchParams();
const dueDateFilter = searchParams.get('dueDate');
```

- Reads the `dueDate` query parameter from the URL
- Returns `null` if parameter is not present
- Returns the date string (YYYY-MM-DD format) if present

### 2. Filter Logic

#### Main Filtering Function
```typescript
// Due date filter (from URL query parameter)
if (dueDateFilter) {
  // Check if the loan's main due date matches
  const loanDueDateStr = toLocalDateString(loan.dueDate);
  let hasMatchingDueDate = loanDueDateStr === dueDateFilter;

  // Also check interest period due dates
  if (!hasMatchingDueDate) {
    hasMatchingDueDate = loan.loanInvestors.some((li) => {
      if (li.hasMultipleInterest && li.interestPeriods) {
        return li.interestPeriods.some((period) => {
          const periodDueDateStr = toLocalDateString(period.dueDate);
          return periodDueDateStr === dueDateFilter;
        });
      }
      return false;
    });
  }

  if (!hasMatchingDueDate) return false;
}
```

**Logic Flow:**
1. Check if the loan's main `dueDate` matches the filter
2. If not, iterate through all loan investors
3. For each investor with multiple interest periods, check each period's due date
4. Return `true` if any due date matches, `false` otherwise

**Why This Approach:**
- Handles both simple loans (single due date) and complex loans (multiple interest periods)
- Efficient: stops checking once a match is found
- Comprehensive: catches all possible due dates for a loan

### 3. Active Filter Detection

```typescript
const hasActiveFilters =
  searchQuery !== '' ||
  statusFilter !== 'all' ||
  typeFilter !== 'all' ||
  hasActiveAmountFilters ||
  !!dueDateFilter; // Added this line
```

- Uses `!!dueDateFilter` to convert to boolean
- Ensures the filter UI shows when due date filter is active

### 4. Clear Filters Function

```typescript
const clearFilters = () => {
  // ... existing clear logic ...
  
  // Clear due date filter from URL
  if (dueDateFilter) {
    router.push('/loans');
  }
};
```

- Navigates to `/loans` without query parameters
- Removes the due date filter from the URL
- Triggers re-render with all loans visible

### 5. Visual Indicator (Badge)

```typescript
{dueDateFilter && (
  <Badge variant="secondary" className="gap-2">
    <Calendar className="h-3 w-3" />
    Due on: {new Date(dueDateFilter + 'T00:00:00').toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}
    <button
      onClick={() => router.push('/loans')}
      className="ml-1 hover:text-foreground"
    >
      <X className="h-3 w-3" />
    </button>
  </Badge>
)}
```

**Features:**
- Only renders when `dueDateFilter` is present
- Shows formatted date (e.g., "Dec 25, 2024")
- Includes X button to clear the filter
- Uses Philippine locale for date formatting

**Date Parsing:**
- Appends `'T00:00:00'` to ensure local timezone interpretation
- Prevents timezone conversion issues

### 6. Google Calendar Integration (`lib/google-calendar.ts`)

#### Updated Event Description Function

```typescript
function createEventDescription(eventData: CalendarEventData): string {
  const { type, date, loan, loans, /* ... */ } = eventData;
  
  // ... existing code ...
  
  if (type === 'summary') {
    // ... existing summary code ...
    
    // Add date parameter to the loans link for filtering
    const dateStr = toLocalDateString(date);
    description += `\n<a href="${appUrl}/loans?dueDate=${dateStr}">View Loans</a>`;
  }
  
  // ... rest of function ...
}
```

**Changes:**
1. Added `date` to destructured parameters
2. Convert date to YYYY-MM-DD format using `toLocalDateString`
3. Append `?dueDate=${dateStr}` to the loans URL
4. Result: `https://app-url.com/loans?dueDate=2024-12-25`

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Google Calendar                          │
│  Daily Summary Event: "View Loans" link                     │
│  URL: /loans?dueDate=2024-12-25                             │
└────────────────────┬────────────────────────────────────────┘
                     │ User clicks link
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│  Route: /loans with query param dueDate=2024-12-25         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  LoansPage Component                         │
│  1. useSearchParams() reads dueDate                         │
│  2. dueDateFilter = "2024-12-25"                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Filter Function                            │
│  For each loan:                                             │
│    1. Check main due date                                   │
│    2. Check interest period due dates                       │
│    3. Return true if any match                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Filtered Results                           │
│  Display only loans due on 2024-12-25                       │
│  Show badge: "Due on: Dec 25, 2024 [X]"                    │
└─────────────────────────────────────────────────────────────┘
```

## Date Format Consistency

### Why YYYY-MM-DD?

1. **ISO 8601 Standard**: Internationally recognized date format
2. **URL Safe**: No special characters that need encoding
3. **Sortable**: Lexicographic sorting matches chronological sorting
4. **Unambiguous**: No confusion between MM/DD and DD/MM
5. **Database Compatible**: Matches PostgreSQL date format
6. **Existing Utility**: `toLocalDateString` already uses this format

### Date Conversion Chain

```
Database (timestamp)
    ↓
toLocalDateString()
    ↓
"2024-12-25" (YYYY-MM-DD)
    ↓
URL Query Parameter
    ↓
String Comparison
    ↓
Display (formatted with toLocaleDateString())
```

## Performance Considerations

### Client-Side Filtering
- **Pros**: 
  - No additional API calls
  - Instant filtering
  - Works with existing data
- **Cons**: 
  - All loans must be loaded first
  - Not suitable for very large datasets (1000+ loans)

### Optimization Opportunities (Future)
If the dataset grows large, consider:
1. Server-side filtering via API endpoint
2. Pagination with filtered results
3. Indexed database queries
4. Caching filtered results

## Edge Cases Handled

### 1. Invalid Date Format
```typescript
// If dueDateFilter is "invalid-date"
const loanDueDateStr = toLocalDateString(loan.dueDate); // "2024-12-25"
loanDueDateStr === "invalid-date" // false
// Result: No loans match, shows "No loans match your filters"
```

### 2. Missing Interest Periods
```typescript
if (li.hasMultipleInterest && li.interestPeriods) {
  // Only processes if interestPeriods array exists
}
```

### 3. Empty Interest Periods Array
```typescript
li.interestPeriods.some((period) => { /* ... */ })
// Returns false if array is empty
```

### 4. Null or Undefined Due Dates
The `toLocalDateString` function handles Date objects, so invalid dates would throw an error. However, the database schema ensures `dueDate` is always present (`notNull()`).

## Testing Strategy

### Unit Tests (Recommended)
```typescript
describe('Due Date Filter', () => {
  it('should filter loans by main due date', () => {
    // Test implementation
  });
  
  it('should filter loans by interest period due date', () => {
    // Test implementation
  });
  
  it('should handle loans with no matching dates', () => {
    // Test implementation
  });
  
  it('should clear filter when X button is clicked', () => {
    // Test implementation
  });
});
```

### Integration Tests (Recommended)
```typescript
describe('Google Calendar Integration', () => {
  it('should generate correct URL in calendar event', () => {
    // Test implementation
  });
  
  it('should navigate to filtered page when clicking calendar link', () => {
    // Test implementation
  });
});
```

## Security Considerations

### XSS Prevention
- Query parameters are not rendered as HTML
- Date strings are validated through `toLocalDateString`
- No `dangerouslySetInnerHTML` used

### Input Validation
- Date format is implicitly validated through string comparison
- Invalid dates simply result in no matches
- No SQL injection risk (client-side filtering)

## Browser Compatibility

- Uses standard `URLSearchParams` API (supported in all modern browsers)
- Date formatting uses `Intl.DateTimeFormat` (widely supported)
- No polyfills required for target browsers

## Future Enhancements

### 1. Date Range Filter
```typescript
// Example: ?dueDateFrom=2024-12-01&dueDateTo=2024-12-31
const dueDateFrom = searchParams.get('dueDateFrom');
const dueDateTo = searchParams.get('dueDateTo');
```

### 2. Quick Filter Buttons
```typescript
<Button onClick={() => router.push('/loans?dueDate=' + todayStr)}>
  Due Today
</Button>
<Button onClick={() => router.push('/loans?dueDate=' + tomorrowStr)}>
  Due Tomorrow
</Button>
```

### 3. Date Picker UI
```typescript
<DatePicker
  value={dueDateFilter}
  onChange={(date) => router.push(`/loans?dueDate=${date}`)}
/>
```

### 4. Multiple Date Selection
```typescript
// Example: ?dueDates=2024-12-25,2024-12-26,2024-12-27
const dueDates = searchParams.get('dueDates')?.split(',') || [];
```

## Maintenance Notes

### When Adding New Date Fields
If new date fields are added to loans (e.g., `reminderDate`), consider:
1. Whether they should be included in the due date filter
2. Update the filter logic accordingly
3. Update documentation

### When Modifying Date Utilities
If `toLocalDateString` is modified:
1. Ensure backward compatibility
2. Update all usages of the function
3. Test calendar integration thoroughly

### When Changing URL Structure
If the URL structure changes:
1. Update Google Calendar event generation
2. Consider adding URL redirects for old format
3. Update all documentation and tests

