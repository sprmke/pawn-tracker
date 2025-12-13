# Google Calendar Integration - Quick Start Guide

Get your Google Calendar integration up and running in 10 minutes!

## Prerequisites

- Google account with access to Google Cloud Console
- Access to your application's `.env.local` file

## Quick Setup (10 minutes)

### Step 1: Create Service Account (3 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**:
   - Go to **APIs & Services** > **Library**
   - Search "Google Calendar API" → Enable
4. Create **Service Account**:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **Service Account**
   - Name it "pawn-tracker-calendar"
   - Click **Create and Continue** → **Done**
5. Generate **Key**:
   - Click on the service account email
   - Go to **Keys** tab
   - Click **Add Key** > **Create new key**
   - Choose **JSON** → **Create**
   - Save the downloaded JSON file

### Step 2: Share Calendar (2 minutes)

1. Open [Google Calendar](https://calendar.google.com/)
2. Click ⚙️ (Settings) on your calendar
3. Go to **Settings and sharing**
4. Under **Share with specific people**, click **Add people**
5. Enter the service account email (from the JSON file: `client_email`)
6. Set permission to **Make changes to events**
7. Click **Send**

### Step 3: Configure Environment (2 minutes)

1. Open the downloaded JSON file
2. Copy these values to your `.env.local`:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL="[copy client_email from JSON]"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="[copy entire private_key from JSON]"
GOOGLE_CALENDAR_ID="primary"
```

**Example:**
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL="pawn-tracker@my-project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID="primary"
```

### Step 4: Apply Database Migration (1 minute)

```bash
npm run db:push
```

When prompted, select **"create column"** for `google_calendar_event_ids`.

### Step 5: Test It! (2 minutes)

1. Restart your development server:
```bash
npm run dev
```

2. Create or update a loan

3. Check your Google Calendar - you should see new events! 🎉

## Sync Existing Loans

If you have existing loans, sync them to calendar:

1. Go to `/admin/calendar-sync` in your app
2. Click **"Sync All Loans"**
3. Wait for completion
4. Check your calendar!

## What You'll See in Calendar

### 📤 Disbursement Events (Red)
- Shows when money was sent out
- Lists all investors and amounts
- Example: "💸 John's Loan - Disbursement (₱100,000)"

### 📅 Due Date Events (Green)
- Shows when loan is due
- Includes principal + interest breakdown
- Example: "📅 John's Loan - Due Date (₱110,000)"

### 💰 Interest Due Events (Blue)
- For loans with multiple interest periods
- One event per investor per period
- Example: "💰 John's Loan - Interest Due (Maria)"

## 📧 Important: Sharing Events with Investors

**Note:** Investors are NOT automatically added to calendar events. This is a Google Calendar API limitation for service accounts.

**To let investors see the events:**
1. Go to Google Calendar settings for your loan calendar
2. Click "Share with specific people"
3. Add investor email addresses
4. Set permission to "See all event details"
5. Investors can then view all loan events in their own Google Calendar

Investor information (names and amounts) is included in each event's description.

## Troubleshooting

### Events not appearing?

**Check 1: Environment variables**
```bash
# Make sure all three are set in .env.local
echo $GOOGLE_SERVICE_ACCOUNT_EMAIL
echo $GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
echo $GOOGLE_CALENDAR_ID
```

**Check 2: Calendar sharing**
- Verify service account has "Make changes to events" permission
- Check spam/junk folder for calendar invitation

**Check 3: API enabled**
- Confirm Google Calendar API is enabled in GCP Console

**Check 4: Server logs**
- Look for error messages in terminal/console

### Investors not getting notifications?

- Verify investor emails are correct in the system
- Check their spam folders
- Ensure calendar sharing is set to send notifications

### Private key errors?

- Copy the entire `private_key` value including BEGIN/END lines
- Keep the `\n` characters (they're important!)
- Wrap the value in double quotes in `.env.local`

## Need More Help?

- **Detailed Setup**: See [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md)
- **Technical Details**: See [GOOGLE_CALENDAR_IMPLEMENTATION.md](./GOOGLE_CALENDAR_IMPLEMENTATION.md)
- **Server Logs**: Check terminal for error messages

## Optional: Use a Dedicated Calendar

Instead of using your primary calendar:

1. Create a new calendar in Google Calendar
2. Name it "Pawn Tracker Loans"
3. Share it with the service account
4. Get the Calendar ID from Settings
5. Update `GOOGLE_CALENDAR_ID` in `.env.local`

## Security Notes

✅ **DO:**
- Keep `.env.local` in `.gitignore`
- Store service account key securely
- Rotate keys periodically

❌ **DON'T:**
- Commit service account JSON to git
- Share private key publicly
- Use personal OAuth (service account is better)

## That's It!

Your Google Calendar integration is now live! 🎊

Every loan you create or update will automatically appear in your calendar with all the details and notify your investors.

---

**Questions?** Check the detailed guides or review server logs for specific error messages.

