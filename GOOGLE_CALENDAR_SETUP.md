# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for the Pawn Tracker application. The integration automatically creates calendar events for loan disbursements, due dates, and interest periods, with investors added as attendees.

## Features

- **Automatic Event Creation**: Calendar events are automatically created when loans are created or updated
- **Event Types**:
  - 📤 **Disbursement Events** (Red): Created for each unique sent date with all investors and amounts
  - 📅 **Due Date Events** (Green): Created for loans with a single due date
  - 💰 **Interest Due Events** (Blue): Created for each interest period in loans with multiple interest dates
- **Investor Notifications**: All investors are added as attendees and receive email notifications
- **Complete Loan Information**: Events include detailed loan information, amounts, and investor details
- **Automatic Updates**: Events are updated when loans are modified
- **Automatic Deletion**: Events are removed when loans are deleted

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A Google Calendar (can use your primary calendar or create a dedicated one)

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

### Step 3: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - **Service account name**: `pawn-tracker-calendar` (or any name you prefer)
   - **Service account ID**: Will be auto-generated
   - **Description**: "Service account for Pawn Tracker calendar integration"
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

### Step 4: Generate Service Account Key

1. In the **Credentials** page, find your newly created service account
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Choose **JSON** format
6. Click **Create** - a JSON file will be downloaded

### Step 5: Share Your Calendar with the Service Account

1. Open [Google Calendar](https://calendar.google.com/)
2. Find the calendar you want to use (or create a new one)
3. Click the three dots next to the calendar name
4. Select **Settings and sharing**
5. Scroll down to **Share with specific people**
6. Click **Add people**
7. Enter the service account email (found in the JSON file as `client_email`)
8. Set permission to **Make changes to events**
9. Click **Send**

### Step 6: Get Your Calendar ID

1. In the same **Settings and sharing** page
2. Scroll down to **Integrate calendar**
3. Copy the **Calendar ID** (usually looks like an email address)
4. If using your primary calendar, you can use `"primary"` as the Calendar ID

### Step 7: Configure Environment Variables

1. Open the downloaded JSON file from Step 4
2. Copy the following values to your `.env.local` file:

```bash
# Google Calendar API Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project-id.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
```

**Important Notes:**

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Copy the `client_email` value from the JSON file
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: Copy the entire `private_key` value from the JSON file (including the BEGIN and END lines)
- `GOOGLE_CALENDAR_ID`: Use the Calendar ID from Step 6, or `"primary"` for your main calendar

### Step 8: Apply Database Migration

Run the database migration to add the calendar event tracking field:

```bash
npm run db:push
```

When prompted, select "create column" for the `google_calendar_event_ids` field.

### Step 9: Test the Integration

1. Start your development server:

```bash
npm run dev
```

2. Create a new loan or update an existing one
3. Check your Google Calendar - you should see new events created
4. Verify that investors are added as attendees

## Syncing Existing Loans

To sync calendar events for existing loans that were created before the integration was set up:

### Sync All Loans

Make a GET request to:

```
GET /api/loans/sync-calendar
```

This will sync all loans for the current user.

### Sync a Specific Loan

Make a POST request to:

```
POST /api/loans/sync-calendar
Content-Type: application/json

{
  "loanId": 123,
  "action": "sync"
}
```

### Remove Calendar Events for a Loan

Make a POST request to:

```
POST /api/loans/sync-calendar
Content-Type: application/json

{
  "loanId": 123,
  "action": "remove"
}
```

## Event Details

### Disbursement Events (📤)

- **Color**: Red
- **Date**: Sent date of the loan
- **Summary**: "💸 [Loan Name] - Disbursement ([Total Amount])"
- **Description**: Includes loan details, total amount sent, and breakdown by investor
- **Attendees**: All investors in the loan

### Due Date Events (📅)

- **Color**: Green
- **Date**: Due date of the loan
- **Summary**: "📅 [Loan Name] - Due Date ([Total Amount])"
- **Description**: Includes loan details, principal, interest, and total due
- **Attendees**: All investors in the loan

### Interest Due Events (💰)

- **Color**: Blue
- **Date**: Interest period due date
- **Summary**: "💰 [Loan Name] - Interest Due ([Investor Name])"
- **Description**: Includes loan details, investor name, principal, interest, and total
- **Attendees**: All investors in the loan

## Reminders

All calendar events are configured with:

- Email reminder: 1 day before the event
- Popup reminder: 1 hour before the event

## Important: Investor Access to Calendar Events

### Service Account Limitations

**Service accounts cannot add attendees to calendar events.** This is a Google Calendar API limitation that requires Domain-Wide Delegation (only available for Google Workspace).

**What this means:**

- ✅ Calendar events are created successfully with all loan details
- ✅ Investor information is included in the event description
- ❌ Investors are NOT automatically added as attendees
- ❌ Investors do NOT receive automatic email invitations
- ✅ Investors can view events if you share the calendar with them

**How to share events with investors:**

1. **Share the calendar** (Recommended):

   - In Google Calendar, go to calendar settings
   - Under "Share with specific people", add investor emails
   - Set permission to "See all event details"
   - Investors can then view all loan events in their Google Calendar

2. **Manual notifications**:

   - Send investors a calendar link
   - Notify them about important dates separately
   - Export events and share via email

3. **Domain-Wide Delegation** (Google Workspace only):
   - Advanced setup for Google Workspace accounts
   - Allows service accounts to send email notifications
   - Requires admin access to configure

## Troubleshooting

### Events are not being created

1. **Check environment variables**: Ensure all three Google Calendar variables are set correctly in `.env.local`
2. **Check service account permissions**: Verify the service account has access to the calendar
3. **Check API enablement**: Ensure Google Calendar API is enabled in your GCP project
4. **Check logs**: Look for error messages in the server console

### Private key format issues

If you get authentication errors:

- Ensure the private key includes the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
- Ensure `\n` characters are preserved in the key (they represent line breaks)
- You can copy the entire `private_key` value from the JSON file as-is

### Calendar ID issues

- If using your primary calendar, try using `"primary"` as the Calendar ID
- If using a specific calendar, ensure you copied the full Calendar ID from the calendar settings
- Verify the service account has been shared with the calendar

## Security Best Practices

1. **Never commit** the service account JSON file or private key to version control
2. **Keep** `.env.local` in your `.gitignore` file
3. **Rotate** service account keys periodically
4. **Use** a dedicated calendar for the application (optional but recommended)
5. **Limit** service account permissions to only what's needed

## Disabling the Integration

If you want to disable the Google Calendar integration:

1. Remove or comment out the Google Calendar environment variables in `.env.local`
2. The application will continue to work normally, but calendar events won't be created
3. Existing calendar events will remain in your calendar until manually deleted

## API Reference

### Create Calendar Event

```typescript
import { generateLoanCalendarEvents } from '@/lib/google-calendar';

const eventIds = await generateLoanCalendarEvents(loan);
```

### Delete Calendar Events

```typescript
import { deleteMultipleCalendarEvents } from '@/lib/google-calendar';

await deleteMultipleCalendarEvents(eventIds);
```

## Support

For issues or questions:

1. Check the server logs for detailed error messages
2. Verify all setup steps were completed correctly
3. Ensure your GCP project has billing enabled (required for API usage)
4. Check Google Calendar API quotas in the GCP Console
