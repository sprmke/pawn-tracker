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
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { AdapterAccount } from 'next-auth/adapters';

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
  'Loan',
  'Investment',
]);
export const transactionDirectionEnum = pgEnum('transaction_direction', [
  'In',
  'Out',
]);
export const interestTypeEnum = pgEnum('interest_type', ['rate', 'fixed']);
export const interestPeriodStatusEnum = pgEnum('interest_period_status', [
  'Pending',
  'Completed',
  'Overdue',
]);

// Investors Table
export const investors = pgTable('investors', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  contactNumber: text('contact_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Loans Table
export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  loanName: text('loan_name').notNull(),
  type: loanTypeEnum('type').notNull(),
  status: loanStatusEnum('status').notNull().default('Fully Funded'),
  dueDate: timestamp('due_date').notNull(),
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
  interestRate: decimal('interest_rate', { precision: 15, scale: 2 }).notNull(),
  interestType: interestTypeEnum('interest_type').notNull().default('rate'),
  sentDate: timestamp('sent_date').notNull(),
  isPaid: boolean('is_paid').notNull().default(true),
  hasMultipleInterest: boolean('has_multiple_interest')
    .notNull()
    .default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Interest Periods Table (for multiple interest due dates)
export const interestPeriods = pgTable('interest_periods', {
  id: serial('id').primaryKey(),
  loanInvestorId: integer('loan_investor_id')
    .references(() => loanInvestors.id, { onDelete: 'cascade' })
    .notNull(),
  dueDate: timestamp('due_date').notNull(),
  interestRate: decimal('interest_rate', { precision: 15, scale: 2 }).notNull(),
  interestType: interestTypeEnum('interest_type').notNull().default('rate'),
  status: interestPeriodStatusEnum('status').notNull().default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions Table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  investorId: integer('investor_id')
    .references(() => investors.id, { onDelete: 'cascade' })
    .notNull(),
  loanId: integer('loan_id').references(() => loans.id, {
    onDelete: 'cascade',
  }),
  date: timestamp('date').notNull(),
  type: transactionTypeEnum('type').notNull(),
  direction: transactionDirectionEnum('direction').notNull(),
  name: text('name').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  transactionIndex: integer('transaction_index'),
  transactionTotal: integer('transaction_total'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Auth.js Tables
export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Relations
export const investorsRelations = relations(investors, ({ one, many }) => ({
  user: one(users, {
    fields: [investors.userId],
    references: [users.id],
  }),
  loanInvestors: many(loanInvestors),
  transactions: many(transactions),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  loanInvestors: many(loanInvestors),
  transactions: many(transactions),
}));

export const loanInvestorsRelations = relations(
  loanInvestors,
  ({ one, many }) => ({
    loan: one(loans, {
      fields: [loanInvestors.loanId],
      references: [loans.id],
    }),
    investor: one(investors, {
      fields: [loanInvestors.investorId],
      references: [investors.id],
    }),
    interestPeriods: many(interestPeriods),
  })
);

export const interestPeriodsRelations = relations(
  interestPeriods,
  ({ one }) => ({
    loanInvestor: one(loanInvestors, {
      fields: [interestPeriods.loanInvestorId],
      references: [loanInvestors.id],
    }),
  })
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  investor: one(investors, {
    fields: [transactions.investorId],
    references: [investors.id],
  }),
  loan: one(loans, {
    fields: [transactions.loanId],
    references: [loans.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  investors: many(investors),
  loans: many(loans),
  transactions: many(transactions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
