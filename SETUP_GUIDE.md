# Setup Guide - Pawn Business Tracker

This guide will walk you through setting up the Pawn Business Tracker application from scratch.

## Step 1: Create a Neon Database

1. Go to [https://neon.tech](https://neon.tech) and sign up for a free account
2. Click "Create a project"
3. Name your project (e.g., "pawn-tracker")
4. Select your region (choose the closest to your location)
5. Click "Create project"
6. Copy the connection string that looks like:
   ```
   postgresql://username:password@host.neon.tech/neondb?sslmode=require
   ```

## Step 2: Configure Environment Variables

1. In your project folder, find the `.env.local` file
2. Replace `your_neon_database_url_here` with your actual connection string:
   ```env
   DATABASE_URL=postgresql://username:password@host.neon.tech/neondb?sslmode=require
   ```
3. Save the file

## Step 3: Initialize the Database

Run these commands in order:

```bash
# Push the database schema to Neon
bun run db:push

# Seed the database with default investors
bun run db:seed
```

You should see output confirming:

- Tables created successfully
- 8 investors inserted

## Step 4: Verify Database Setup

You can verify your database setup by:

1. Using Drizzle Studio (recommended):

   ```bash
   bun run db:studio
   ```

   This opens a web-based database viewer at `https://local.drizzle.studio`

2. Or checking in the Neon dashboard:
   - Go to your project in Neon
   - Click on "Tables" in the sidebar
   - You should see: `investors`, `loans`, `loan_investors`, `transactions`

## Step 5: Start the Application

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and you should see:

- Dashboard with statistics (initially all zeros)
- Navigation menu with Dashboard, Loans, Add Loan, and Investors
- 8 investors in the Investors page

## Common Issues and Solutions

### Issue: "Cannot connect to database"

**Solution**: Check that:

- Your `.env.local` file has the correct `DATABASE_URL`
- The database URL includes `?sslmode=require` at the end
- You have internet connectivity
- Your Neon project is active (not suspended)

### Issue: "No investors found"

**Solution**: Run the seed script:

```bash
bun run db:seed
```

### Issue: Turbopack errors

**Solution**: If you encounter Turbopack issues, you can disable it:

```bash
bun run dev -- --no-turbopack
```

Or edit `package.json` and remove `--turbopack` from the dev script.

## Understanding the Database Schema

### Investors Table

Stores basic investor information:

- `id`: Unique identifier
- `name`: Investor's full name
- `email`: Contact email
- `created_at`, `updated_at`: Timestamps

### Loans Table

Stores loan details:

- `id`: Unique identifier
- `loan_name`: Title/label of the loan
- `type`: Lot Title, OR/CR, or Agent
- `status`: Active, Done, or Overdue
- `principal_amount`: Total loan amount
- `default_interest_rate`: Default interest percentage
- `due_date`: When the loan is due
- `is_monthly_interest`: Whether to calculate monthly
- `free_lot_sqm`: Optional lot size
- `notes`: Additional information

### Loan Investors Table (Junction)

Links loans with investors and their allocations:

- `id`: Unique identifier
- `loan_id`: Reference to loan
- `investor_id`: Reference to investor
- `amount`: How much this investor put in
- `interest_rate`: Custom rate for this investor
- `sent_date`: When money was sent

### Transactions Table

Tracks investor money in/out:

- `id`: Unique identifier
- `investor_id`: Reference to investor
- `date`: Transaction date
- `type`: Pawn, Salary, Credit Card, Debt, or Others
- `direction`: In or Out
- `name`: Description
- `amount`: Transaction amount
- `balance`: Running balance after this transaction
- `notes`: Additional details

## Next Steps

1. **Create your first loan**:

   - Go to "Add Loan" in the navigation
   - Fill out the loan details
   - Add at least one investor
   - Preview the calculations
   - Submit

2. **Track investor transactions**:

   - Use the API endpoint `/api/transactions` to add transactions
   - Or build a transaction form (future enhancement)

3. **Monitor the dashboard**:
   - Check overall statistics
   - Track active and overdue loans
   - View recent activities

## API Endpoints

The application provides these API endpoints:

### Investors

- `GET /api/investors` - List all investors
- `POST /api/investors` - Create new investor

### Loans

- `GET /api/loans` - List all loans with investors
- `POST /api/loans` - Create new loan

### Transactions

- `GET /api/transactions?investorId=X` - List transactions (optionally filter by investor)
- `POST /api/transactions` - Create new transaction

## Database Management

### View data in Drizzle Studio

```bash
bun run db:studio
```

### Generate migrations (if you modify schema)

```bash
bun run db:generate
```

### Push schema changes

```bash
bun run db:push
```

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub:

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to [https://vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: Your Neon connection string
6. Click "Deploy"

After deployment:

- Run the seed command in Vercel (if needed):
  - Go to your project settings
  - Find the "Deployments" tab
  - You might need to run seeds manually or via a serverless function

## Maintenance

### Backup your database

Neon provides automatic backups, but you can also:

1. Use Drizzle Studio to export data
2. Use Neon's branching feature to create a copy
3. Export via SQL dumps from the Neon dashboard

### Monitor usage

- Check your Neon dashboard for storage and compute usage
- Free tier includes: 0.5 GB storage, 300 compute hours

### Update dependencies

```bash
bun update
```

## Support

If you encounter issues:

1. Check the console for error messages
2. Verify your database connection
3. Review the main README.md
4. Check Neon dashboard for database health

---

Happy tracking! 🎯
