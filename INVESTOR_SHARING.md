# Multi-User Loan & Transaction Sharing

## Overview

This feature enables **multi-user collaboration** where loans and transactions can be shared across different user accounts. When you add an investor to a loan or transaction, that investor can sign in with their email and access those items as if they created them - including full edit and delete permissions.

## How It Works

### Simple Example

1. **Account A1** (michaeldmanlulu@gmail.com) creates a loan
2. **Account A1** adds **Investor B1** (perezarianna0410@gmail.com) to the loan
3. **Account B1** signs in with their email
4. **Account B1** sees the loan in their loans list
5. **Account B1** can view, edit, and manage the loan just like A1

### Key Concept

**It's not about viewing - it's about shared ownership!**
- When you add someone as an investor to a loan/transaction, you're giving them full access
- They see it in their dashboard, loans page, transactions page
- They can edit and update it
- Same UI for everyone - no special "investor view"

## Setup Instructions

### For New Installations

1. Run the database migration:
   ```bash
   bun run db:push
   ```

2. Create investors as usual - user accounts will be created automatically

### For Existing Installations

1. Run the database migration:
   ```bash
   bun run db:push
   ```

2. Link existing investors to user accounts:
   ```bash
   bun run link-investors
   ```

3. If you have email mismatches, use the fix script (see troubleshooting)

## Usage

### Step 1: Create an Investor

1. Sign in as your main account (e.g., A1)
2. Go to Investors page
3. Click "New Investor"
4. Enter investor details:
   - **Name**: Arianna Perez
   - **Email**: perezarianna0410@gmail.com (must match their Google account)
   - **Contact Number**: (optional)
5. Click "Create"
6. ✨ A user account is automatically created for this email!

### Step 2: Share a Loan

1. Create a new loan or edit an existing one
2. In the "Investors" section, add the investor (B1)
3. Enter their investment amount, interest rate, etc.
4. Save the loan
5. ✨ The investor can now see and edit this loan!

### Step 3: Share a Transaction

1. Create a new transaction
2. Select the investor (B1) from the dropdown
3. Save the transaction
4. ✨ The investor can now see and edit this transaction!

### Step 4: Investor Access

1. Investor (B1) goes to the application
2. Signs in with Google using their email (perezarianna0410@gmail.com)
3. Sees the normal dashboard with all shared loans/transactions
4. Can navigate to Loans, Transactions, Investors pages
5. Can view, edit, and manage everything shared with them!

## What Gets Shared

When you add an investor to a loan:
- ✅ The loan appears in their loans list
- ✅ All transactions related to that loan
- ✅ All investors involved in that loan
- ✅ Full edit and delete permissions

When you add an investor to a transaction:
- ✅ The transaction appears in their transactions list
- ✅ Full edit and delete permissions (except loan-generated transactions)

## Technical Details

### Database Schema

- **users table**: Has `role` field (admin/investor)
- **investors table**: Has `investorUserId` field linking to user accounts
- When an investor is created, a user account is automatically created/linked

### Access Control

The system uses smart access control:
- Users see loans they **created** OR loans where they are an **investor**
- Users see transactions they **created** OR transactions where they are the **investor**
- Users see all investors from any loans they have access to
- Full CRUD permissions on all shared items

### API Changes

All APIs now support multi-user access:
- `GET /api/loans` - Returns owned + shared loans
- `GET /api/transactions` - Returns owned + shared transactions
- `GET /api/investors` - Returns all investors from accessible loans
- `GET/PUT/DELETE /api/loans/[id]` - Checks access before allowing operations
- `GET/PUT/DELETE /api/transactions/[id]` - Checks access before allowing operations

## Benefits

✅ **True Collaboration** - Multiple users can manage the same loans/transactions  
✅ **No UI Changes** - Everyone sees the same interface  
✅ **Full Permissions** - Shared users can edit and delete  
✅ **Automatic** - Just add them as an investor, sharing happens automatically  
✅ **Secure** - Only users with explicit access can see/edit items  

## Debugging Scripts

### Check All Investors
```bash
bun run check-investors
```
Shows all investors and whether they're linked to user accounts.

### Check User Roles
```bash
bun run check-users
```
Shows all users and their roles.

### Check Specific Investor Data
```bash
bun run tsx scripts/check-specific-investor.ts
```
Shows loans and transactions for a specific investor (edit the script to change the email).

## Troubleshooting

### Problem: Investor sees no data after signing in

**Solution:**
1. Verify the investor's email matches their Google account exactly
2. Run `bun run check-investors` to see if they're linked
3. Check if they're actually added to any loans/transactions
4. Try the fix script if there's an email mismatch

### Problem: Email mismatch (investor email doesn't match user email)

**Solution:**
Use the fix script to update the investor's email:

```bash
# Edit scripts/fix-investor-email.ts to set the correct emails
bun run tsx scripts/fix-investor-email.ts
```

### Problem: Investor can't edit a loan

**Solution:**
1. Verify they're added as an investor to that specific loan
2. Check that their `investorUserId` is set correctly
3. Run `bun run check-investors` to verify the link

### Problem: User sees duplicate loans/transactions

**Solution:**
This is normal if they:
- Created the loan/transaction themselves, AND
- Are also added as an investor to it

The system deduplicates automatically, but you might see it twice if there's a data issue.

## FAQ

**Q: Can an investor create new loans/transactions?**  
A: Yes! Once they're set up as an investor, they can create their own loans/transactions and share them with others.

**Q: Can I remove an investor's access?**  
A: Yes, just remove them from the loan's investor list and save. They'll no longer see that loan.

**Q: What happens if I delete an investor?**  
A: The investor record is deleted, but their user account remains. They can still sign in but won't see any shared data unless they're re-added.

**Q: Can one person have multiple investor profiles?**  
A: Technically yes, but it's not recommended. Use one investor profile per email address.

**Q: Do investors need to be "approved" or "invited"?**  
A: No! Just add their email as an investor, and they can sign in immediately with Google.

## Security Notes

- Users can only see/edit loans and transactions they have explicit access to
- Access is verified on every API call
- No way to bypass the access control system
- User roles (admin/investor) don't affect permissions - access is based on investor assignments

## Example Workflow

### Scenario: Loan Officer and Investor Collaboration

1. **Loan Officer (A1)** creates a loan for a property
2. **Loan Officer** adds **Investor B1** with $50,000 investment
3. **Loan Officer** adds **Investor C1** with $30,000 investment
4. **Investor B1** signs in and sees the loan
5. **Investor B1** updates their interest rate
6. **Investor C1** signs in and sees the loan
7. **Investor C1** adds notes to the loan
8. **Loan Officer** sees all updates from both investors
9. Everyone stays in sync! 🎉

---

**That's it!** Simple loan and transaction sharing across multiple users with full collaboration support.
