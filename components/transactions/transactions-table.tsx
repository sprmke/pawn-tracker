'use client';

import React from 'react';
import { DataTable, ColumnDef } from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';
import { ActionButtonsGroup } from '@/components/common';
import { formatCurrency, formatDateShort } from '@/lib/format';
import {
  getTransactionDirectionBadge,
  getTransactionTypeBadge,
} from '@/lib/badge-config';
import type { TransactionWithInvestor } from '@/lib/types';

interface TransactionsTableProps {
  transactions: TransactionWithInvestor[];
  itemsPerPage?: number;
  onQuickView?: (transaction: TransactionWithInvestor) => void;
}

export function TransactionsTable({
  transactions,
  itemsPerPage = 10,
  onQuickView,
}: TransactionsTableProps) {
  const columns: ColumnDef<TransactionWithInvestor>[] = [
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      sortFn: (a, b, direction) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return direction === 'asc' ? aTime - bTime : bTime - aTime;
      },
      cell: (transaction) => (
        <span className="text-xs">{formatDateShort(transaction.date)}</span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (transaction) => (
        <p
          className="font-medium max-w-50 break-words"
          title={transaction.name}
        >
          {transaction.name}
        </p>
      ),
    },
    {
      id: 'investor',
      header: 'Investor',
      accessorFn: (transaction) => transaction.investor.name,
      sortable: true,
      cell: (transaction) => (
        <span className="text-xs">{transaction.investor.name}</span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      className: 'hidden 2xl:table-cell',
      headerClassName: 'hidden 2xl:table-cell',
      cell: (transaction) => (
        <Badge
          variant={getTransactionTypeBadge(transaction.type).variant}
          className={`text-[10px] w-18 flex justify-center truncate ${
            getTransactionTypeBadge(transaction.type).className
          }`}
        >
          {transaction.type}
        </Badge>
      ),
    },
    {
      id: 'direction',
      header: 'Direction',
      accessorKey: 'direction',
      sortable: true,
      cell: (transaction) => (
        <Badge
          variant={getTransactionDirectionBadge(transaction.direction).variant}
          className={`text-[10px] w-8 flex justify-center truncate ${
            getTransactionDirectionBadge(transaction.direction).className
          }`}
        >
          {transaction.direction}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorFn: (transaction) => parseFloat(transaction.amount),
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = parseFloat(a.amount);
        const bValue = parseFloat(b.amount);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (transaction) => (
        <span
          className={`font-semibold truncate ${
            transaction.direction === 'In'
              ? 'text-emerald-600'
              : 'text-rose-600'
          }`}
        >
          {transaction.direction === 'In' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      className: 'hidden 2xl:table-cell',
      headerClassName: 'hidden 2xl:table-cell text-center',
      cell: (transaction) => (
        <ActionButtonsGroup
          onQuickView={
            onQuickView
              ? (e) => {
                  e.stopPropagation();
                  onQuickView(transaction);
                }
              : undefined
          }
          viewHref={`/transactions/${transaction.id}`}
          showView={false}
          size="sm"
        />
      ),
    },
  ];

  return (
    <DataTable
      data={transactions}
      columns={columns}
      itemsPerPage={itemsPerPage}
      itemName="transactions"
      getRowId={(transaction) => transaction.id}
      initialSortField="date"
      initialSortDirection="asc"
      onRowClick={onQuickView ? onQuickView : undefined}
      rowClickOnMobileOnly={true}
    />
  );
}
