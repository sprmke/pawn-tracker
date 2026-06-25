'use client';

import { InvestorWithLoans, LoanWithInvestors, LoanType } from '@/lib/types';
import { DataTable, ColumnDef } from './data-table';
import { ActionButtonsGroup } from './action-buttons';
import { formatCurrencyCompact, formatText, formatPercentage } from '@/lib/format';
import { getTodayAtMidnight, normalizeToMidnight } from '@/lib/date-utils';
import {
  calculateInvestorStats,
  calculateAverageRate,
} from '@/lib/calculations';
import {
  CompletedLoansCard,
  PastDueLoansCard,
  PendingDisbursementsCard,
  MaturingLoansCard,
} from './';
import { addDays, isAfter, isBefore, isPast } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useNavigationProgress } from './navigation-progress';

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
  const router = useRouter();
  const { startProgress } = useNavigationProgress();

  const columns: ColumnDef<InvestorWithLoans>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (investor) => (
        <span
          className="block truncate font-medium"
          title={formatText(investor.name)}
        >
          {formatText(investor.name)}
        </span>
      ),
    },
    {
      id: 'totalCapital',
      header: 'Capital',
      accessorFn: (investor) => calculateInvestorStats(investor).totalCapital,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateInvestorStats(a).totalCapital;
        const bValue = calculateInvestorStats(b).totalCapital;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (investor) => (
        <span className="font-medium tabular-nums">
          {formatCurrencyCompact(calculateInvestorStats(investor).totalCapital)}
        </span>
      ),
    },
    {
      id: 'avgRate',
      header: 'Rate',
      accessorFn: (investor) => calculateAverageRate(investor.loanInvestors),
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateAverageRate(a.loanInvestors);
        const bValue = calculateAverageRate(b.loanInvestors);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (investor) => (
        <span className="tabular-nums">
          {formatPercentage(calculateAverageRate(investor.loanInvestors))}
        </span>
      ),
    },
    {
      id: 'totalInterest',
      header: 'Interest',
      accessorFn: (investor) => calculateInvestorStats(investor).totalInterest,
      sortable: true,
      sortFn: (a, b, direction) => {
        const aValue = calculateInvestorStats(a).totalInterest;
        const bValue = calculateInvestorStats(b).totalInterest;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      },
      cell: (investor) => (
        <span className="font-medium tabular-nums">
          {formatCurrencyCompact(calculateInvestorStats(investor).totalInterest)}
        </span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Amount',
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
          <span className="font-semibold tabular-nums">
            {formatCurrencyCompact(stats.totalCapital + stats.totalInterest)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      className: 'hidden 2xl:table-cell w-[5%]',
      headerClassName: 'hidden 2xl:table-cell w-[5%] text-center',
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
    },
  ];

  const expandedContent = (investor: InvestorWithLoans) => {
    // Calculate activity data for this investor
    const activityData = (() => {
      const now = new Date();
      const fourteenDaysFromNow = addDays(now, 14);

      // Get investor's loan IDs
      const investorLoanIds = new Set(
        investor.loanInvestors.map((li) => li.loan.id),
      );

      // Filter loans to only those this investor is part of
      const investorLoans = allLoans.filter((loan) =>
        investorLoanIds.has(loan.id),
      );

      // Completed loans
      const completedLoans = investorLoans
        .filter((loan) => loan.status === 'Completed')
        .sort(
          (a, b) =>
            new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
        );

      // Overdue loans
      const overdueLoans = investorLoans
        .filter(
          (loan) =>
            loan.status === 'Overdue' ||
            (loan.status !== 'Completed' && isPast(new Date(loan.dueDate))),
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );

      // Pending disbursements
      const unpaidLoanTransactions: Array<{
        id: number;
        loanId: number;
        loanName: string;
        loanType: LoanType;
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
              loanType: loan.type,
              investorName: li.investor.name,
              amount: li.amount,
              sentDate: li.sentDate,
            });
          });
      });

      const pendingDisbursements = unpaidLoanTransactions.sort(
        (a, b) =>
          new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime(),
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
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );

      return {
        completedLoans,
        overdueLoans,
        pendingDisbursements,
        maturingLoans,
      };
    })();

    const hasActivity =
      activityData.maturingLoans.length > 0 ||
      activityData.overdueLoans.length > 0 ||
      activityData.pendingDisbursements.length > 0 ||
      activityData.completedLoans.length > 0;

    if (!hasActivity) {
      return null;
    }

    return (
      <div className="grid gap-2 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
        <MaturingLoansCard
          loans={activityData.maturingLoans}
          investorId={investor.id}
        />
        <PastDueLoansCard
          loans={activityData.overdueLoans}
          investorId={investor.id}
        />
        <PendingDisbursementsCard
          disbursements={activityData.pendingDisbursements}
        />
        <CompletedLoansCard
          loans={activityData.completedLoans}
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
      onRowClick={(investor) => {
        startProgress();
        router.push(`/investors/${investor.id}`);
      }}
      rowClickOnMobileOnly={true}
    />
  );
}
