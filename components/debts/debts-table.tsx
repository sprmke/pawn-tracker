'use client';

import React from 'react';
import { DataTable, ColumnDef } from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';
import { ActionButtonsGroup } from '@/components/common';
import {
  formatCurrencyCompact,
  formatDateVeryShort,
  formatText,
} from '@/lib/format';
import { calculatePerPeriodInterest, calculateDebtSummary } from '@/lib/debt-calculations';
import type { DebtWithInvestor } from '@/lib/types';

interface DebtsTableProps {
  debts: DebtWithInvestor[];
  itemsPerPage?: number;
  onQuickView?: (debt: DebtWithInvestor) => void;
}

export function DebtsTable({
  debts,
  itemsPerPage = 10,
  onQuickView,
}: DebtsTableProps) {
  const columns: ColumnDef<DebtWithInvestor>[] = [
    {
      id: 'date',
      header: 'Start Date',
      accessorKey: 'date',
      sortable: true,
      sortFn: (a, b, direction) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return direction === 'asc' ? aTime - bTime : bTime - aTime;
      },
      cell: (debt) => <span>{formatDateVeryShort(debt.date)}</span>,
    },
    {
      id: 'name',
      header: 'Borrowing Name',
      accessorKey: 'name',
      sortable: true,
      cell: (debt) => (
        <p className="font-medium truncate" title={formatText(debt.name)}>
          {formatText(debt.name)}
        </p>
      ),
    },
    {
      id: 'investor',
      header: 'Investor',
      accessorFn: (debt) => debt.investor.name,
      sortable: true,
      cell: (debt) => (
        <span className="block truncate">{formatText(debt.investor.name)}</span>
      ),
    },
    {
      id: 'amount',
      header: 'Principal',
      accessorFn: (debt) => parseFloat(debt.amount),
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = parseFloat(a.amount);
        const bValue = parseFloat(b.amount);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (debt) => (
        <span className="font-medium tabular-nums">
          {formatCurrencyCompact(debt.amount)}
        </span>
      ),
    },
    {
      id: 'interestRate',
      header: 'Rate',
      accessorFn: (debt) => parseFloat(debt.interestRate),
      sortable: true,
      className: 'hidden xl:table-cell',
      headerClassName: 'hidden xl:table-cell',
      cell: (debt) => (
        <span className="tabular-nums">{debt.interestRate}%</span>
      ),
    },
    {
      id: 'interestInterval',
      header: 'Period',
      accessorKey: 'interestInterval',
      sortable: true,
      className: 'hidden 2xl:table-cell',
      headerClassName: 'hidden 2xl:table-cell',
      cell: (debt) => (
        <Badge variant="secondary" className="text-[10px]">
          {debt.interestInterval}
        </Badge>
      ),
    },
    {
      id: 'durationMonths',
      header: 'Duration',
      accessorKey: 'durationMonths',
      sortable: true,
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      cell: (debt) => (
        <span className="tabular-nums">
          {debt.durationMonths} mo
        </span>
      ),
    },
    {
      id: 'perPeriodInterest',
      header: 'Interest/Period',
      accessorFn: (debt) =>
        calculatePerPeriodInterest(debt.amount, debt.interestRate),
      sortable: true,
      cell: (debt) => (
        <span className="font-medium tabular-nums text-emerald-600">
          {formatCurrencyCompact(
            calculatePerPeriodInterest(debt.amount, debt.interestRate),
          )}
        </span>
      ),
    },
    {
      id: 'totalInterestIncludingFees',
      header: 'Total Interest',
      accessorFn: (debt) => {
        const debtDate =
          debt.date instanceof Date
            ? debt.date.toISOString().split('T')[0]
            : String(debt.date).split('T')[0];
        return calculateDebtSummary({
          principal: debt.amount,
          interestRate: debt.interestRate,
          interestInterval: debt.interestInterval,
          debtDate,
          durationMonths: debt.durationMonths,
          additionalFees: debt.additionalFees ?? [],
        }).totalInterestIncludingFees;
      },
      sortable: true,
      className: 'hidden xl:table-cell',
      headerClassName: 'hidden xl:table-cell',
      cell: (debt) => {
        const debtDate =
          debt.date instanceof Date
            ? debt.date.toISOString().split('T')[0]
            : String(debt.date).split('T')[0];
        const total = calculateDebtSummary({
          principal: debt.amount,
          interestRate: debt.interestRate,
          interestInterval: debt.interestInterval,
          debtDate,
          durationMonths: debt.durationMonths,
          additionalFees: debt.additionalFees ?? [],
        }).totalInterestIncludingFees;
        return (
          <span className="font-medium tabular-nums text-emerald-600">
            {formatCurrencyCompact(total)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      className: 'hidden 2xl:table-cell w-[5%]',
      headerClassName: 'hidden 2xl:table-cell w-[5%] text-center',
      cell: (debt) => (
        <ActionButtonsGroup
          onQuickView={
            onQuickView
              ? (e) => {
                  e.stopPropagation();
                  onQuickView(debt);
                }
              : undefined
          }
          viewHref={`/debts/${debt.id}`}
          showView={false}
          size="sm"
        />
      ),
    },
  ];

  return (
    <DataTable
      data={debts}
      columns={columns}
      itemsPerPage={itemsPerPage}
      itemName="borrowings"
      getRowId={(debt) => debt.id}
      initialSortField="date"
      initialSortDirection="asc"
      onRowClick={onQuickView ? onQuickView : undefined}
      rowClickOnMobileOnly={true}
    />
  );
}
