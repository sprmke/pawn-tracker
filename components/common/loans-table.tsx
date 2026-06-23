'use client';

import React from 'react';
import { LoanWithInvestors } from '@/lib/types';
import { DataTable, ColumnDef } from './data-table';
import { Badge } from '@/components/ui/badge';
import { ActionButtonsGroup } from './action-buttons';
import {
  formatCurrencyCompact,
  formatDateVeryShort,
  formatText,
  formatPercentage,
  formatSqm,
} from '@/lib/format';
import { calculateTransactionStats } from '@/lib/calculations';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';
import { DateListWithViewMore } from './date-list-with-view-more';

interface LoansTableProps {
  loans: LoanWithInvestors[];
  itemsPerPage?: number;
  hideFields?: string[];
  onQuickView?: (loan: LoanWithInvestors) => void;
  /** When provided, shows investor-specific stats instead of loan totals */
  investorId?: number;
}

export function LoansTable({
  loans,
  itemsPerPage = 10,
  hideFields = [],
  onQuickView,
  investorId,
}: LoansTableProps) {
  // Helper to get investor-specific loan investors or all if no investorId
  const getRelevantLoanInvestors = (loan: LoanWithInvestors) => {
    if (investorId) {
      return loan.loanInvestors.filter((li) => li.investor.id === investorId);
    }
    return loan.loanInvestors;
  };

  // Helper to calculate stats for the relevant investors
  const getStats = (loan: LoanWithInvestors) => {
    const relevantInvestors = getRelevantLoanInvestors(loan);
    return calculateTransactionStats(relevantInvestors);
  };

  const columns: ColumnDef<LoanWithInvestors>[] = [
    {
      id: 'loanName',
      header: 'Loan',
      hidden: hideFields.includes('loanName'),
      accessorKey: 'loanName',
      sortable: true,
      headerClassName: 'w-[12%]',
      className: 'w-[12%]',
      cell: (loan) => (
        <span
          className="block truncate font-medium"
          title={formatText(loan.loanName)}
        >
          {formatText(loan.loanName)}
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      hidden: hideFields.includes('type'),
      className: 'hidden 2xl:table-cell w-[7%]',
      headerClassName: 'hidden 2xl:table-cell w-[7%]',
      accessorKey: 'type',
      sortable: true,
      cell: (loan) => (
        <Badge
          variant={getLoanTypeBadge(loan.type).variant}
          className={`text-[10px] px-1.5 flex justify-center max-w-full truncate ${
            getLoanTypeBadge(loan.type).className
          }`}
        >
          {formatText(loan.type)}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      hidden: hideFields.includes('status'),
      className: 'hidden 2xl:table-cell w-[7%]',
      headerClassName: 'hidden 2xl:table-cell w-[7%]',
      accessorKey: 'status',
      sortable: true,
      cell: (loan) => (
        <Badge
          variant={getLoanStatusBadge(loan.status).variant}
          className={`text-[10px] px-1.5 flex justify-center max-w-full truncate ${
            getLoanStatusBadge(loan.status).className
          }`}
        >
          {formatText(loan.status)}
        </Badge>
      ),
    },
    {
      id: 'sentDates',
      header: 'Sent',
      hidden: hideFields.includes('sentDates'),
      className: 'hidden 2xl:table-cell w-[8%]',
      headerClassName: 'hidden 2xl:table-cell w-[8%]',
      accessorFn: (loan) => {
        const dates = loan.loanInvestors.map((li) =>
          new Date(li.sentDate).getTime(),
        );
        return dates.length > 0 ? Math.min(...dates) : 0;
      },
      sortable: true,
      sortFn: (a, b, direction) => {
        const aDates = a.loanInvestors.map((li) =>
          new Date(li.sentDate).getTime(),
        );
        const bDates = b.loanInvestors.map((li) =>
          new Date(li.sentDate).getTime(),
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
              (li) => new Date(li.sentDate).toISOString().split('T')[0],
            ),
          ),
        )
          .map((dateStr) => new Date(dateStr))
          .sort((a, b) => a.getTime() - b.getTime());

        return (
          <DateListWithViewMore
            dates={uniqueDates}
            limit={2}
            dialogTitle="All Sent Dates"
            title={loan.loanName}
            formatDate={formatDateVeryShort}
            getItemClassName={(date, hasUnpaid) =>
              `text-[10px] px-1 py-0.5 rounded inline-block ${
                hasUnpaid ? 'bg-yellow-200' : ''
              }`
            }
            checkUnpaid={(date) => {
              const dateStr = date.toISOString().split('T')[0];
              return loan.loanInvestors.some(
                (li) =>
                  new Date(li.sentDate).toISOString().split('T')[0] ===
                    dateStr && !li.isPaid,
              );
            }}
          />
        );
      },
    },
    {
      id: 'dueDate',
      header: 'Due',
      hidden: hideFields.includes('dueDate'),
      className: 'hidden 2xl:table-cell w-[8%]',
      headerClassName: 'hidden 2xl:table-cell w-[8%]',
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
                new Date(period.dueDate).toISOString().split('T')[0],
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
            limit={2}
            dialogTitle="All Due Dates"
            title={loan.loanName}
            formatDate={formatDateVeryShort}
            getItemClassName={() =>
              'text-[10px] px-1 py-0.5 rounded inline-block'
            }
          />
        );
      },
    },
    {
      id: 'totalPrincipal',
      header: 'Principal',
      hidden: hideFields.includes('totalPrincipal'),
      headerClassName: 'w-[10%]',
      className: 'w-[10%]',
      accessorFn: (loan) => getStats(loan).totalPrincipal,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = getStats(a).totalPrincipal;
        const bValue = getStats(b).totalPrincipal;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span className="font-medium tabular-nums">
          {formatCurrencyCompact(getStats(loan).totalPrincipal)}
        </span>
      ),
    },
    {
      id: 'avgRate',
      header: 'Rate',
      hidden: hideFields.includes('avgRate'),
      headerClassName: 'w-[7%]',
      className: 'w-[7%]',
      accessorFn: (loan) => getStats(loan).averageRate,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = getStats(a).averageRate;
        const bValue = getStats(b).averageRate;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span className="tabular-nums">
          {formatPercentage(getStats(loan).averageRate)}
        </span>
      ),
    },
    {
      id: 'totalInterest',
      header: 'Interest',
      hidden: hideFields.includes('totalInterest'),
      headerClassName: 'w-[10%]',
      className: 'w-[10%]',
      accessorFn: (loan) => getStats(loan).totalInterest,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = getStats(a).totalInterest;
        const bValue = getStats(b).totalInterest;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span className="font-medium tabular-nums">
          {formatCurrencyCompact(getStats(loan).totalInterest)}
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: investorId ? 'Total' : 'Amount',
      hidden: hideFields.includes('totalAmount'),
      headerClassName: 'w-[10%]',
      className: 'w-[10%]',
      accessorFn: (loan) => getStats(loan).total,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = getStats(a).total;
        const bValue = getStats(b).total;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span className="font-semibold tabular-nums">
          {formatCurrencyCompact(getStats(loan).total)}
        </span>
      ),
    },
    {
      id: 'freeLotSqm',
      header: 'Lot',
      hidden: hideFields.includes('freeLotSqm'),
      className: 'hidden 2xl:table-cell w-[7%]',
      headerClassName: 'hidden 2xl:table-cell w-[7%]',
      accessorKey: 'freeLotSqm',
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = a.freeLotSqm || 0;
        const bValue = b.freeLotSqm || 0;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (loan) => (
        <span>
          {loan.freeLotSqm ? formatSqm(loan.freeLotSqm) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      className: 'hidden 2xl:table-cell w-[5%]',
      headerClassName: 'hidden 2xl:table-cell w-[5%] text-center',
      cell: (loan) => (
        <ActionButtonsGroup
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
          showView={false}
          size="sm"
        />
      ),
    },
  ];

  return (
    <DataTable
      data={loans}
      columns={columns}
      itemsPerPage={itemsPerPage}
      itemName="loans"
      getRowId={(loan) => loan.id}
      onRowClick={onQuickView ? onQuickView : undefined}
      rowClickOnMobileOnly={true}
    />
  );
}
