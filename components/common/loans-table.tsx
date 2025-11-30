'use client';

import React from 'react';
import { LoanWithInvestors } from '@/lib/types';
import { DataTable, ColumnDef } from './data-table';
import { Badge } from '@/components/ui/badge';
import { ActionButtonsGroup } from './action-buttons';
import { formatCurrency } from '@/lib/format';
import {
  calculateLoanStats,
  calculateTransactionStats,
} from '@/lib/calculations';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';
import { InvestorTransactionCard } from './investor-transaction-card';
import { DateListWithViewMore } from './date-list-with-view-more';

interface LoansTableProps {
  loans: LoanWithInvestors[];
  itemsPerPage?: number;
  hideFields?: string[];
  expandedRows?: Set<string | number>;
  onToggleExpand?: (loanId: string | number) => void;
  onQuickView?: (loan: LoanWithInvestors) => void;
}

export function LoansTable({
  loans,
  itemsPerPage = 10,
  hideFields = [],
  expandedRows,
  onToggleExpand,
  onQuickView,
}: LoansTableProps) {
  const columns: ColumnDef<LoanWithInvestors>[] = [
    {
      id: 'loanName',
      header: 'Loan Name',
      hidden: hideFields.includes('loanName'),
      accessorKey: 'loanName',
      sortable: true,
      cell: (loan) => <span className="font-medium">{loan.loanName}</span>,
    },
    {
      id: 'type',
      header: 'Type',
      hidden: hideFields.includes('type'),
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      accessorKey: 'type',
      sortable: true,
      cell: (loan) => (
        <Badge
          variant={getLoanTypeBadge(loan.type).variant}
          className={`text-[10px] flex justify-center w-15 truncate ${
            getLoanTypeBadge(loan.type).className
          }`}
        >
          {loan.type}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      hidden: hideFields.includes('status'),
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      accessorKey: 'status',
      sortable: true,
      cell: (loan) => (
        <Badge
          variant={getLoanStatusBadge(loan.status).variant}
          className={`text-[10px] flex justify-center w-25 truncate ${
            getLoanStatusBadge(loan.status).className
          }`}
        >
          {loan.status}
        </Badge>
      ),
    },
    {
      id: 'sentDates',
      header: 'Sent Dates',
      hidden: hideFields.includes('sentDates'),
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      accessorFn: (loan) => {
        const dates = loan.loanInvestors.map((li) =>
          new Date(li.sentDate).getTime()
        );
        return dates.length > 0 ? Math.min(...dates) : 0;
      },
      sortable: true,
      sortFn: (a, b, direction) => {
        const aDates = a.loanInvestors.map((li) =>
          new Date(li.sentDate).getTime()
        );
        const bDates = b.loanInvestors.map((li) =>
          new Date(li.sentDate).getTime()
        );
        const aValue = aDates.length > 0 ? Math.min(...aDates) : 0;
        const bValue = bDates.length > 0 ? Math.min(...bDates) : 0;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => {
        // Get unique sent dates
        const uniqueDates = Array.from(
          new Set(
            loan.loanInvestors.map(
              (li) => new Date(li.sentDate).toISOString().split('T')[0]
            )
          )
        )
          .map((dateStr) => new Date(dateStr))
          .sort((a, b) => a.getTime() - b.getTime());

        return (
          <DateListWithViewMore
            dates={uniqueDates}
            limit={3}
            dialogTitle="All Sent Dates"
            getItemClassName={(date, hasUnpaid) =>
              `${
                uniqueDates.length > 1 ? 'text-[10px]' : 'text-xs'
              } px-2 py-0.5 rounded inline-block ${
                hasUnpaid ? 'bg-yellow-200' : ''
              }`
            }
            checkUnpaid={(date) => {
              const dateStr = date.toISOString().split('T')[0];
              return loan.loanInvestors.some(
                (li) =>
                  new Date(li.sentDate).toISOString().split('T')[0] ===
                    dateStr && !li.isPaid
              );
            }}
          />
        );
      },
    },
    {
      id: 'dueDate',
      header: 'Due Dates',
      hidden: hideFields.includes('dueDate'),
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      accessorKey: 'dueDate',
      sortable: true,
      sortFn: (a, b, direction) => {
        const aTime = new Date(a.dueDate).getTime();
        const bTime = new Date(b.dueDate).getTime();
        return direction === 'asc' ? aTime - bTime : bTime - aTime;
      },
      cell: (loan) => {
        // Collect all unique due dates
        const dueDateSet = new Set<string>();

        // Add main loan due date
        dueDateSet.add(new Date(loan.dueDate).toISOString().split('T')[0]);

        // Add interest period due dates
        loan.loanInvestors.forEach((li) => {
          if (li.hasMultipleInterest && li.interestPeriods) {
            li.interestPeriods.forEach((period) => {
              dueDateSet.add(
                new Date(period.dueDate).toISOString().split('T')[0]
              );
            });
          }
        });

        const uniqueDates = Array.from(dueDateSet)
          .map((dateStr) => new Date(dateStr))
          .sort((a, b) => a.getTime() - b.getTime());

        return (
          <DateListWithViewMore
            dates={uniqueDates}
            limit={3}
            dialogTitle="All Due Dates"
            getItemClassName={(date) =>
              `${
                uniqueDates.length > 1 ? 'text-[10px]' : 'text-xs'
              } px-2 py-0.5 rounded inline-block`
            }
          />
        );
      },
    },
    {
      id: 'totalPrincipal',
      header: 'Total Principal',
      hidden: hideFields.includes('totalPrincipal'),
      accessorFn: (loan) => calculateLoanStats(loan).totalPrincipal,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateLoanStats(a).totalPrincipal;
        const bValue = calculateLoanStats(b).totalPrincipal;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span className="font-semibold">
          {formatCurrency(calculateLoanStats(loan).totalPrincipal)}
        </span>
      ),
    },
    {
      id: 'avgRate',
      header: 'Avg. Rate',
      hidden: hideFields.includes('avgRate'),
      accessorFn: (loan) => calculateLoanStats(loan).avgRate,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateLoanStats(a).avgRate;
        const bValue = calculateLoanStats(b).avgRate;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span>{calculateLoanStats(loan).avgRate.toFixed(2)}%</span>
      ),
    },
    {
      id: 'totalInterest',
      header: 'Total Interest',
      hidden: hideFields.includes('totalInterest'),
      accessorFn: (loan) => calculateLoanStats(loan).totalInterest,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateLoanStats(a).totalInterest;
        const bValue = calculateLoanStats(b).totalInterest;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span className="font-medium">
          {formatCurrency(calculateLoanStats(loan).totalInterest)}
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Total Amount',
      hidden: hideFields.includes('totalAmount'),
      accessorFn: (loan) => calculateLoanStats(loan).totalAmount,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateLoanStats(a).totalAmount;
        const bValue = calculateLoanStats(b).totalAmount;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span className="font-bold">
          {formatCurrency(calculateLoanStats(loan).totalAmount)}
        </span>
      ),
    },
    {
      id: 'freeLotSqm',
      header: 'Free Lot',
      hidden: hideFields.includes('freeLotSqm'),
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      accessorKey: 'freeLotSqm',
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = a.freeLotSqm || 0;
        const bValue = b.freeLotSqm || 0;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span>{loan.freeLotSqm ? `${loan.freeLotSqm} sqm` : '-'}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (loan) => (
        <ActionButtonsGroup
          isExpanded={expandedRows?.has(loan.id)}
          onToggle={
            onToggleExpand
              ? (e) => {
                  e.stopPropagation();
                  onToggleExpand(loan.id);
                }
              : undefined
          }
          viewHref={`/loans/${loan.id}`}
          onQuickView={
            onQuickView
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(loan);
                }
              : undefined
          }
          showToggle={!!onToggleExpand}
          showView={false}
          size="sm"
        />
      ),
      headerClassName: 'text-center',
    },
  ];

  const expandedContent = (loan: LoanWithInvestors) => {
    return (
      <div className="space-y-4">
        {/* Investors Section */}
        {loan.loanInvestors.length > 0 && (
          <div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                // Group by investor
                const investorMap = new Map<
                  number,
                  Array<(typeof loan.loanInvestors)[0]>
                >();
                loan.loanInvestors.forEach((li) => {
                  const existing = investorMap.get(li.investor.id) || [];
                  existing.push(li);
                  investorMap.set(li.investor.id, existing);
                });

                return Array.from(investorMap.values()).map((transactions) => {
                  const investor = transactions[0].investor;

                  // Calculate totals
                  const stats = calculateTransactionStats(transactions);
                  const totalPrincipal = stats.totalPrincipal;
                  const totalInterest = stats.totalInterest;
                  const avgRate = stats.averageRate;
                  const total = stats.total;

                  return (
                    <InvestorTransactionCard
                      key={investor.id}
                      investorName={investor.name}
                      transactions={transactions}
                      totalPrincipal={totalPrincipal}
                      avgRate={avgRate}
                      totalInterest={totalInterest}
                      total={total}
                    />
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DataTable
      data={loans}
      columns={columns}
      itemsPerPage={itemsPerPage}
      itemName="loans"
      getRowId={(loan) => loan.id}
      expandedContent={expandedContent}
      expandedRows={expandedRows}
    />
  );
}
