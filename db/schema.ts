import {
  pgTable,
  text,
  serial,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const loanTypeEnum = pgEnum('loan_type', [
  'Lot Title',
  'OR/CR',
  'Agent',
]);
export const loanStatusEnum = pgEnum('loan_status', [
  'Partially Funded',
  'Fully Funded',
  'Overdue',
  'Completed',
]);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'Pawn',
  'Salary',
  'Credit Card',
  'Debt',
  'Others',
]);
export const transactionDirectionEnum = pgEnum('transaction_direction', [
  'In',
  'Out',
]);

// Investors Table
export const investors = pgTable('investors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Loans Table
export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  loanName: text('loan_name').notNull(),
  type: loanTypeEnum('type').notNull(),
  status: loanStatusEnum('status').notNull().default('Partially Funded'),
  dueDate: timestamp('due_date').notNull(),
  isMonthlyInterest: boolean('is_monthly_interest').default(false),
  freeLotSqm: integer('free_lot_sqm'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Loan Investors (Junction Table)
export const loanInvestors = pgTable('loan_investors', {
  id: serial('id').primaryKey(),
  loanId: integer('loan_id')
    .references(() => loans.id, { onDelete: 'cascade' })
    .notNull(),
  investorId: integer('investor_id')
    .references(() => investors.id, { onDelete: 'cascade' })
    .notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).notNull(),
  sentDate: timestamp('sent_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions Table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  investorId: integer('investor_id')
    .references(() => investors.id, { onDelete: 'cascade' })
    .notNull(),
  date: timestamp('date').notNull(),
  type: transactionTypeEnum('type').notNull(),
  direction: transactionDirectionEnum('direction').notNull(),
  name: text('name').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const investorsRelations = relations(investors, ({ many }) => ({
  loanInvestors: many(loanInvestors),
  transactions: many(transactions),
}));

export const loansRelations = relations(loans, ({ many }) => ({
  loanInvestors: many(loanInvestors),
}));

export const loanInvestorsRelations = relations(loanInvestors, ({ one }) => ({
  loan: one(loans, {
    fields: [loanInvestors.loanId],
    references: [loans.id],
  }),
  investor: one(investors, {
    fields: [loanInvestors.investorId],
    references: [investors.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  investor: one(investors, {
    fields: [transactions.investorId],
    references: [investors.id],
  }),
}));
