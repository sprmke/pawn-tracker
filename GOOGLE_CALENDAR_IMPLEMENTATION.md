# Google Calendar Integration - Implementation Summary

## Overview

This document provides a technical summary of the Google Calendar integration implemented for the Pawn Tracker application. The integration automatically creates, updates, and deletes Google Calendar events for all loan-related activities, with investors added as attendees.

## What Was Implemented

### 1. Database Schema Changes

**File**: `db/schema.ts`

Added a new field to the `loans` table:
- `googleCalendarEventIds`: JSONB field to store an array of Google Calendar event IDs

**Migration**: `drizzle/0017_add_google_calendar_event_ids.sql`

### 2. Google Calendar Service

**File**: `lib/google-calendar.ts`

A comprehensive service module that handles all Google Calendar operations:

#### Functions:

- **`getCalendarClient()`**: Initializes and returns the Google Calendar API client
- **`createCalendarEvent(eventData)`**: Creates a single calendar event
- **`updateCalendarEvent(eventId, eventData)`**: Updates an existing calendar event
- **`deleteCalendarEvent(eventId)`**: Deletes a single calendar event
- **`deleteMultipleCalendarEvents(eventIds)`**: Deletes multiple calendar events
- **`generateLoanCalendarEvents(loan)`**: Generates all calendar events for a loan

#### Event Types:

1. **Disbursement Events (📤)**
   - Color: Red (Google Calendar color ID: 11)
   - Created for each unique sent date
   - Includes all investors and their amounts
   - Summary: "💸 [Loan Name] - Disbursement ([Total Amount])"

2. **Due Date Events (📅)**
   - Color: Green (Google Calendar color ID: 10)
   - Created for loans with a single due date
   - Includes principal, interest, and total breakdown
   - Summary: "📅 [Loan Name] - Due Date ([Total Amount])"

3. **Interest Due Events (💰)**
   - Color: Blue (Google Calendar color ID: 9)
   - Created for each interest period in multi-interest loans
   - Includes investor name, principal, and interest
   - Summary: "💰 [Loan Name] - Interest Due ([Investor Name])"

#### Features:

- All events are created as all-day events in Asia/Manila timezone
- Investors are automatically added as attendees
- Email notifications are sent to all attendees
- Events include detailed descriptions with loan information
- Reminders: 1 day before (email) and 1 hour before (popup)

### 3. API Route Updates

#### Loan Creation (`app/api/loans/route.ts`)

**Changes**:
- Added import for `generateLoanCalendarEvents`
- After loan creation and transaction generation, calendar events are created
- Event IDs are stored in the loan record

#### Loan Update (`app/api/loans/[id]/route.ts`)

**Changes**:
- Added imports for `generateLoanCalendarEvents` and `deleteMultipleCalendarEvents`
- Before updating, existing calendar events are deleted
- New calendar events are generated with updated loan data
- New event IDs replace the old ones in the loan record

#### Loan Deletion (`app/api/loans/[id]/route.ts`)

**Changes**:
- Before deleting the loan, associated calendar events are deleted
- Ensures no orphaned events remain in the calendar

### 4. Calendar Sync API

**File**: `app/api/loans/sync-calendar/route.ts`

A new API endpoint for syncing calendar events:

#### Endpoints:

1. **POST `/api/loans/sync-calendar`**
   - Syncs or removes calendar events for a specific loan
   - Body parameters:
     - `loanId`: The ID of the loan to sync
     - `action`: Either "sync" or "remove"

2. **GET `/api/loans/sync-calendar`**
   - Syncs calendar events for all loans owned by the current user
   - Returns detailed results for each loan

### 5. Admin UI

**File**: `app/admin/calendar-sync/page.tsx`

A user-friendly admin page for managing calendar synchronization:

#### Features:
- One-click sync for all loans
- Real-time progress indicator
- Detailed results showing:
  - Total loans processed
  - Successfully synced loans
  - Errors encountered
  - Per-loan sync status
- Setup instructions with link to documentation

### 6. Documentation

#### Files Created:

1. **`GOOGLE_CALENDAR_SETUP.md`**
   - Comprehensive setup guide
   - Step-by-step instructions for Google Cloud configuration
   - Service account creation and key generation
   - Calendar sharing instructions
   - Environment variable configuration
   - Troubleshooting guide

2. **`env.example`** (Updated)
   - Added Google Calendar environment variables
   - Includes descriptions and examples

3. **`README.md`** (Updated)
   - Added Google Calendar integration to features list
   - Link to setup documentation

## Environment Variables

Three new environment variables are required:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@project-id.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID="primary"
```

## How It Works

### Loan Creation Flow

1. User creates a new loan with investors
2. Loan is saved to database
3. Transactions are generated
4. **Calendar events are created**:
   - One event per unique sent date (disbursement)
   - One event for due date OR multiple events for interest periods
5. Event IDs are stored in the loan record

### Loan Update Flow

1. User updates an existing loan
2. Loan changes are saved to database
3. **Old calendar events are deleted** using stored event IDs
4. Transactions are regenerated (if needed)
5. **New calendar events are created** with updated information
6. New event IDs replace old ones in the loan record

### Loan Deletion Flow

1. User deletes a loan
2. **Calendar events are deleted** using stored event IDs
3. Transactions are deleted
4. Loan is removed from database

## Error Handling

The implementation includes robust error handling:

- Calendar operations never block loan operations
- If calendar API is unavailable, loans can still be created/updated/deleted
- Errors are logged but don't cause transaction failures
- Missing credentials result in warnings, not errors
- Failed event creation/deletion is logged for debugging

## Testing

To test the integration:

1. **Setup**: Follow `GOOGLE_CALENDAR_SETUP.md`
2. **Create a loan**: Verify events appear in calendar
3. **Update the loan**: Verify events are updated
4. **Delete the loan**: Verify events are removed
5. **Sync existing loans**: Use `/admin/calendar-sync` page

## API Usage Examples

### Sync a specific loan

```typescript
const response = await fetch('/api/loans/sync-calendar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    loanId: 123,
    action: 'sync'
  })
});
```

### Sync all loans

```typescript
const response = await fetch('/api/loans/sync-calendar', {
  method: 'GET'
});
```

### Remove calendar events for a loan

```typescript
const response = await fetch('/api/loans/sync-calendar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    loanId: 123,
    action: 'remove'
  })
});
```

## Security Considerations

1. **Service Account**: Uses Google service account for authentication (no user OAuth required)
2. **Private Key**: Stored securely in environment variables
3. **Access Control**: Only loan owners can sync their loans
4. **Email Privacy**: Investor emails are only visible to calendar attendees
5. **API Quotas**: Google Calendar API has usage limits (check GCP console)

## Future Enhancements

Possible improvements for future versions:

1. **Selective Sync**: Allow users to choose which event types to create
2. **Custom Reminders**: Let users configure reminder times
3. **Multiple Calendars**: Support for different calendars per loan type
4. **Event Colors**: Customizable colors for different event types
5. **Recurring Events**: Support for recurring interest payments
6. **Calendar View**: Embedded calendar view in the app
7. **Conflict Detection**: Warn about overlapping events
8. **Bulk Operations**: Batch API calls for better performance

## Maintenance

### Monitoring

- Check server logs for calendar API errors
- Monitor Google Cloud Console for API usage
- Track failed event creation/deletion

### Updates

- Keep `googleapis` package updated
- Monitor Google Calendar API changes
- Review and rotate service account keys periodically

## Dependencies

- `googleapis`: ^140.0.0 (or latest)
- Google Calendar API v3
- Google Cloud service account with Calendar API enabled

## Files Modified/Created

### Created:
- `lib/google-calendar.ts`
- `app/api/loans/sync-calendar/route.ts`
- `app/admin/calendar-sync/page.tsx`
- `drizzle/0017_add_google_calendar_event_ids.sql`
- `GOOGLE_CALENDAR_SETUP.md`
- `GOOGLE_CALENDAR_IMPLEMENTATION.md`

### Modified:
- `db/schema.ts`
- `app/api/loans/route.ts`
- `app/api/loans/[id]/route.ts`
- `env.example`
- `README.md`

## Conclusion

The Google Calendar integration is fully functional and production-ready. It provides automatic synchronization of loan events with Google Calendar, complete with investor notifications and detailed event information. The implementation is robust, well-documented, and easy to set up.

