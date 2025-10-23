# Pawn Business Tracker

A comprehensive web application for tracking pawn business loans and investor transactions, built with Next.js 15, React 19, Tailwind CSS, and shadcn/ui.

## Features

### Module 1: Pawn Tracker

- **Create and manage loans** with detailed information:

  - Loan name/label
  - Type (Lot Title, OR/CR, Agent)
  - Principal amount
  - Interest rates (default and per-investor)
  - Due dates with monthly or total interest options
  - Status tracking (Active, Done, Overdue)
  - Free lot tracking (in sqm)
  - Notes and additional details

- **Multi-investor allocation**:

  - Select multiple investors per loan
  - Individual amount allocation per investor
  - Custom interest rates per investor
  - Multiple sent dates support

- **Real-time preview**:
  - Calculate capital, interest, and total per investor
  - Loan summary with total principal, interest, and amount due
  - Visual breakdown before submission

### Module 2: Investor In & Outs

- **Investor dashboard** showing:

  - Total capital invested
  - Total interest earned
  - Current balance with status indicators
  - Active and total loans

- **Investor detail page** with two tabs:

  - **Tab 1: Loans & Gains**

    - All loans joined by the investor
    - Capital, interest rate, and earnings per loan
    - Total gains calculation

  - **Tab 2: Transactions & Balance**
    - Complete transaction history
    - Running balance after each transaction
    - Date, type, amount, and notes
    - Color-coded balance status (Green: Can invest, Yellow: Low funds, Red: No funds)

### Dashboard

- Overview statistics:
  - Total principal amount
  - Total interest earned
  - Active loans count
  - Overdue loans alert
- Recent loans with quick status view

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database ORM**: Drizzle ORM
- **Database**: Neon PostgreSQL (serverless)
- **Form Handling**: React Hook Form + Zod validation
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Bun installed ([bun.sh](https://bun.sh))
- A Neon PostgreSQL database (free tier available at [neon.tech](https://neon.tech))

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pawn-tracker
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Neon database URL:

```env
DATABASE_URL=your_neon_database_url_here
```

4. Push the database schema:

```bash
bun run db:push
```

5. Seed the database with default investors:

```bash
bun run db:seed
```

6. Run the development server:

```bash
bun run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **investors**: Store investor information
- **loans**: Store loan details
- **loan_investors**: Junction table linking loans and investors with allocation details
- **transactions**: Store investor transactions for balance tracking

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run db:generate` - Generate database migrations
- `bun run db:migrate` - Run database migrations
- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open Drizzle Studio (database GUI)
- `bun run db:seed` - Seed database with default investors

## Project Structure

```
pawn-tracker/
├── app/
│   ├── api/              # API routes
│   ├── investors/        # Investor pages
│   ├── loans/            # Loan pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── components/
│   ├── common/           # Shared reusable components (NEW!)
│   │   ├── stat-card.tsx
│   │   ├── empty-state.tsx
│   │   ├── page-header.tsx
│   │   ├── view-mode-toggle.tsx
│   │   ├── search-filter.tsx
│   │   ├── range-filter.tsx
│   │   ├── filter-section.tsx
│   │   ├── collapsible-section.tsx
│   │   ├── pagination.tsx
│   │   ├── sort-button.tsx
│   │   ├── investor-transaction-card.tsx
│   │   └── README.md     # Component documentation
│   ├── layout/           # Layout components (Nav)
│   ├── loans/            # Loan-specific components
│   ├── investors/        # Investor-specific components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks (NEW!)
│   ├── use-pagination.ts
│   ├── use-sorting.ts
│   ├── use-filters.ts
│   └── README.md         # Hooks documentation
├── db/
│   ├── schema.ts         # Database schema
│   ├── index.ts          # Database client
│   └── seed.ts           # Seed script
├── lib/
│   ├── format.ts         # Formatting utilities (NEW!)
│   ├── calculations.ts   # Business logic calculations (NEW!)
│   ├── badge-config.ts   # Badge configurations
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # General utilities
├── drizzle.config.ts     # Drizzle ORM configuration
├── REFACTORING_SUMMARY.md # Refactoring documentation (NEW!)
└── README.md
```

## Code Architecture & DRY Principles

This project follows **DRY (Don't Repeat Yourself)** principles with a well-organized component architecture:

### Shared Utilities (`/lib/`)

- **format.ts**: Centralized formatting functions (currency, dates, percentages)
- **calculations.ts**: Business logic for loan calculations, investor stats, and aggregations
- **badge-config.ts**: Consistent badge styling across the app

### Reusable Components (`/components/common/`)

All common UI patterns are componentized (12 components):

- StatCard, EmptyState, PageHeader, ViewModeToggle, LoadingState
- SearchFilter, RangeFilter, FilterSection, CollapsibleSection
- Pagination, SortButton, InvestorTransactionCard

See `/components/common/README.md` for detailed documentation.

### Custom Hooks (`/hooks/`)

Encapsulated logic for common patterns:

- `usePagination`: Handle pagination state and logic
- `useSorting`: Handle sorting state and logic
- `useFilters`: Handle filtering state and logic

See `/hooks/README.md` for detailed documentation.

### Benefits

✅ **~500+ lines of duplicate code eliminated**  
✅ **Consistent formatting and calculations across the app**  
✅ **Easy to maintain and test**  
✅ **Type-safe with TypeScript**  
✅ **Composable and reusable**

See `REFACTORING_SUMMARY.md` for complete refactoring details.

## Key Features Explained

### Multi-Investor Loan Creation

The loan form allows you to:

1. Select multiple investors from a dropdown
2. Allocate specific amounts to each investor
3. Set custom interest rates per investor
4. Specify different sent dates for each investor
5. Preview calculations before creating the loan

### Balance Tracking

The transaction system tracks:

- All money IN/OUT for each investor
- Running balance after each transaction
- Visual indicators for investment capacity
- Complete audit trail with dates and notes

### Responsive Design

The application is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your `DATABASE_URL` environment variable
4. Deploy!

Vercel will automatically:

- Build your Next.js application
- Set up automatic deployments on push
- Provide a production URL

## Contributing

This is a private business application. For modifications or feature requests, please contact the development team.

## License

Private and Confidential - All Rights Reserved

## Support

For issues or questions, please contact the system administrator.

---

Built with ❤️ for efficient pawn business management
