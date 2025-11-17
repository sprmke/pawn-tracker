'use client';

import { InvestorWithLoans, LoanWithInvestors } from '@/lib/types';
import { DataTable, ColumnDef } from './data-table';
import { ActionButtonsGroup } from './action-buttons';
import { formatCurrency } from '@/lib/format';
import { getTodayAtMidnight, normalizeToMidnight } from '@/lib/date-utils';
import {
  calculateInvestorStats,
  calculateAverageRate,
} from '@/lib/calculations';
import {
  PastDueLoansCard,
  PendingDisbursementsCard,
  MaturingLoansCard,
} from './';
import { addDays, isAfter, isBefore, isPast } from 'date-fns';

interface InvestorsTableProps {
  investors: InvestorWithLoans[];
  allLoans?: LoanWithInvestors[];
  itemsPerPage?: number;
  expandedRows?: Set<string | number>;
  onToggleExpand?: (investorId: string | number) => void;
}

export function InvestorsTable({
  investors,
  allLoans = [],
  itemsPerPage = 10,
  expandedRows,
  onToggleExpand,
}: InvestorsTableProps) {
  const columns: ColumnDef<InvestorWithLoans>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (investor) => <span className="font-medium">{investor.name}</span>,
    },
    {
      id: 'totalCapital',
      header: 'Total Capital',
      accessorFn: (investor) => calculateInvestorStats(investor).totalCapital,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateInvestorStats(a).totalCapital;
        const bValue = calculateInvestorStats(b).totalCapital;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (investor) => (
        <span className="font-medium text-xs">
          {formatCurrency(calculateInvestorStats(investor).totalCapital)}
        </span>
      ),
    },
    {
      id: 'avgRate',
      header: 'Avg. Rate',
      accessorFn: (investor) => calculateAverageRate(investor.loanInvestors),
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateAverageRate(a.loanInvestors);
        const bValue = calculateAverageRate(b.loanInvestors);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (investor) => (
        <span>{calculateAverageRate(investor.loanInvestors).toFixed(2)}%</span>
      ),
    },
    {
      id: 'totalInterest',
      header: 'Total Interest',
      accessorFn: (investor) => calculateInvestorStats(investor).totalInterest,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateInvestorStats(a).totalInterest;
        const bValue = calculateInvestorStats(b).totalInterest;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (investor) => (
        <span className="font-medium">
          {formatCurrency(calculateInvestorStats(investor).totalInterest)}
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Total Amount',
      accessorFn: (investor) => {
        const stats = calculateInvestorStats(investor);
        return stats.totalCapital + stats.totalInterest;
      },
      sortable: true,
      sortFn: (a, b, direction) => {
        const aStats = calculateInvestorStats(a);
        const bStats = calculateInvestorStats(b);
        const aValue = aStats.totalCapital + aStats.totalInterest;
        const bValue = bStats.totalCapital + bStats.totalInterest;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (investor) => {
        const stats = calculateInvestorStats(investor);
        return (
          <span className="font-medium text-xs">
            {formatCurrency(stats.totalCapital + stats.totalInterest)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (investor) => (
        <ActionButtonsGroup
          isExpanded={expandedRows?.has(investor.id)}
          onToggle={
            onToggleExpand
              ? (e) => {
                  e.stopPropagation();
                  onToggleExpand(investor.id);
                }
              : undefined
          }
          viewHref={`/investors/${investor.id}`}
          showToggle={!!onToggleExpand}
          size="sm"
        />
      ),
      headerClassName: 'text-center',
    },
  ];

  const expandedContent = (investor: InvestorWithLoans) => {
    // Calculate activity data for this investor
    const activityData = (() => {
      const now = new Date();
      const fourteenDaysFromNow = addDays(now, 14);

      // Get investor's loan IDs
      const investorLoanIds = new Set(
        investor.loanInvestors.map((li) => li.loan.id)
      );

      // Filter loans to only those this investor is part of
      const investorLoans = allLoans.filter((loan) =>
        investorLoanIds.has(loan.id)
      );

      // Overdue loans
      const overdueLoans = investorLoans
        .filter(
          (loan) =>
            loan.status === 'Overdue' ||
            (loan.status !== 'Completed' && isPast(new Date(loan.dueDate)))
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

      // Pending disbursements
      const unpaidLoanTransactions: Array<{
        id: number;
        loanId: number;
        loanName: string;
        investorName: string;
        amount: string;
        sentDate: Date;
      }> = [];

      investorLoans.forEach((loan) => {
        loan.loanInvestors
          .filter((li) => !li.isPaid && li.investor.id === investor.id)
          .forEach((li) => {
            unpaidLoanTransactions.push({
              id: li.id,
              loanId: loan.id,
              loanName: loan.loanName,
              investorName: li.investor.name,
              amount: li.amount,
              sentDate: li.sentDate,
            });
          });
      });

      const pendingDisbursements = unpaidLoanTransactions.sort(
        (a, b) =>
          new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime()
      );

      // Maturing loans
      const maturingLoans = investorLoans
        .filter((loan) => {
          const dueDate = new Date(loan.dueDate);
          return (
            (loan.status === 'Fully Funded' ||
              loan.status === 'Partially Funded') &&
            isAfter(dueDate, now) &&
            isBefore(dueDate, fourteenDaysFromNow)
          );
        })
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );

      return {
        overdueLoans,
        pendingDisbursements,
        maturingLoans,
      };
    })();

    return (
      <div className="grid gap-2 grid-cols-1 lg:grid-cols-3">
        <PastDueLoansCard
          loans={activityData.overdueLoans}
          investorId={investor.id}
        />
        <PendingDisbursementsCard
          disbursements={activityData.pendingDisbursements}
        />
        <MaturingLoansCard
          loans={activityData.maturingLoans}
          investorId={investor.id}
        />
      </div>
    );
  };

  return (
    <DataTable
      data={investors}
      columns={columns}
      itemsPerPage={itemsPerPage}
      itemName="investors"
      getRowId={(investor) => investor.id}
      expandedContent={expandedContent}
      expandedRows={expandedRows}
    />
  );
}
