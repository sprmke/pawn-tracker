'use client';

import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { LoanWithInvestors } from '@/lib/types';
import { getLoanStatusBadge, getLoanTypeBadge } from '@/lib/badge-config';

interface LoanEventCardBaseProps {
  loan: LoanWithInvestors;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
}

interface LoanSentEventCardProps extends LoanEventCardBaseProps {
  investors: Array<{ name: string; amount: number }>;
  totalAmount: number;
  size?: 'sm' | 'md' | 'lg';
  isFuture?: boolean;
}

interface LoanDueEventCardProps extends LoanEventCardBaseProps {
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
  size?: 'sm' | 'md' | 'lg';
}

interface LoanInterestDueEventCardProps extends LoanEventCardBaseProps {
  investorName: string;
  principal: number;
  interest: number;
  totalAmount: number;
  size?: 'sm' | 'md' | 'lg';
}

export function LoanSentEventCard({
  loan,
  onClick,
  formatCurrency,
  investors,
  totalAmount,
  size = 'md',
  isFuture = false,
}: LoanSentEventCardProps) {
  const sizeClasses = {
    sm: {
      container: 'p-2 text-xs',
      icon: 'w-4 h-4',
      iconSize: 'h-3 w-3',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-[11px]',
      investor: 'text-[10px]',
      total: 'text-[11px] px-1.5 py-0.5',
    },
    md: {
      container: 'p-3 text-sm',
      icon: 'w-6 h-6',
      iconSize: 'h-4 w-4',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-sm',
      investor: 'text-xs',
      total: 'text-sm px-2 py-1',
    },
    lg: {
      container: 'p-3 text-sm',
      icon: 'w-6 h-6',
      iconSize: 'h-4 w-4',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-sm',
      investor: 'text-xs',
      total: 'text-sm px-2 py-1',
    },
  };

  const classes = sizeClasses[size];
  const colorClasses = isFuture
    ? 'from-yellow-50 to-yellow-100 border-yellow-500 bg-yellow-500 text-yellow-500'
    : 'from-red-50 to-red-100 border-red-500 bg-red-500 text-red-500';

  return (
    <button
      onClick={onClick}
      className={`cursor-pointer w-full text-left rounded-lg hover:shadow-lg transition-all bg-gradient-to-br border-l-4 shadow-md ${classes.container} ${colorClasses}`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center rounded-full flex-shrink-0 ${
              classes.icon
            } ${isFuture ? 'bg-yellow-500' : 'bg-red-500'}`}
          >
            <ArrowUp className={`${classes.iconSize} text-white`} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className={`font-bold text-gray-900 ${classes.title}`}>
              {loan.loanName}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge
                variant={getLoanTypeBadge(loan.type).variant}
                className={`${classes.badge} leading-none ${
                  getLoanTypeBadge(loan.type).className || ''
                }`}
              >
                {loan.type}
              </Badge>
              <Badge
                variant={getLoanStatusBadge(loan.status).variant}
                className={`${classes.badge} leading-none ${
                  getLoanStatusBadge(loan.status).className
                }`}
              >
                {loan.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className={size === 'sm' ? 'space-y-1' : 'pl-8 space-y-1'}>
          <div className={`text-gray-700 space-y-0.5 ${classes.investor}`}>
            {investors.map((inv, idx) => (
              <div key={idx} className="flex items-start gap-1">
                <span
                  className={`font-bold ${
                    isFuture ? 'text-yellow-500' : 'text-red-500'
                  }`}
                >
                  •
                </span>
                <span className="truncate">
                  <span className="font-semibold">{inv.name}:</span>{' '}
                  {formatCurrency(inv.amount)}
                </span>
              </div>
            ))}
          </div>
          <div
            className={`font-bold text-gray-900 bg-white/60 rounded inline-block mt-1 ${classes.total}`}
          >
            {isFuture ? 'Send:' : 'Sent:'} {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>
    </button>
  );
}

export function LoanDueEventCard({
  loan,
  onClick,
  formatCurrency,
  totalPrincipal,
  totalInterest,
  totalAmount,
  size = 'md',
}: LoanDueEventCardProps) {
  const sizeClasses = {
    sm: {
      container: 'p-2 text-xs',
      icon: 'w-4 h-4',
      iconSize: 'h-3 w-3',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-[11px]',
      detail: 'text-[10px]',
      total: 'text-[11px] px-1.5 py-0.5',
    },
    md: {
      container: 'p-3 text-sm',
      icon: 'w-6 h-6',
      iconSize: 'h-4 w-4',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-sm',
      detail: 'text-xs',
      total: 'text-sm px-2 py-1',
    },
    lg: {
      container: 'p-3 text-sm',
      icon: 'w-6 h-6',
      iconSize: 'h-4 w-4',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-sm',
      detail: 'text-xs',
      total: 'text-sm px-2 py-1',
    },
  };

  const classes = sizeClasses[size];

  return (
    <button
      onClick={onClick}
      className={`cursor-pointer w-full text-left rounded-lg hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600 shadow-md ${classes.container}`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center rounded-full bg-green-600 flex-shrink-0 ${classes.icon}`}
          >
            <ArrowDown className={`${classes.iconSize} text-white`} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className={`font-bold text-gray-900 ${classes.title}`}>
              {loan.loanName}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge
                variant={getLoanTypeBadge(loan.type).variant}
                className={`${classes.badge} leading-none ${
                  getLoanTypeBadge(loan.type).className || ''
                }`}
              >
                {loan.type}
              </Badge>
              <Badge
                variant={getLoanStatusBadge(loan.status).variant}
                className={`${classes.badge} leading-none ${
                  getLoanStatusBadge(loan.status).className
                }`}
              >
                {loan.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className={size === 'sm' ? 'space-y-1' : 'pl-8 space-y-1'}>
          <div
            className={`font-bold text-gray-900 bg-white/60 rounded inline-block ${classes.total}`}
          >
            Due: {formatCurrency(totalAmount)}
          </div>
          <div className={`text-gray-700 space-y-0.5 ${classes.detail}`}>
            <div
              className={`flex items-center ${
                size === 'sm' ? 'gap-1' : 'justify-between'
              }`}
            >
              <span className="font-medium">Principal:</span>
              <span className="font-semibold">
                {formatCurrency(totalPrincipal)}
              </span>
            </div>
            <div
              className={`flex items-center ${
                size === 'sm' ? 'gap-1' : 'justify-between'
              }`}
            >
              <span className="font-medium">Interest:</span>
              <span className="font-semibold">
                {formatCurrency(totalInterest)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function LoanInterestDueEventCard({
  loan,
  onClick,
  formatCurrency,
  investorName,
  principal,
  interest,
  totalAmount,
  size = 'md',
}: LoanInterestDueEventCardProps) {
  const sizeClasses = {
    sm: {
      container: 'p-2 text-xs',
      icon: 'w-3 h-3',
      iconSize: 'h-2 w-2',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-[11px]',
      detail: 'text-[10px]',
      total: 'text-[11px] px-1.5 py-0.5',
    },
    md: {
      container: 'p-3 text-sm',
      icon: 'w-6 h-6',
      iconSize: 'h-4 w-4',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-sm',
      detail: 'text-xs',
      total: 'text-sm px-2 py-1',
    },
    lg: {
      container: 'p-3 text-sm',
      icon: 'w-6 h-6',
      iconSize: 'h-4 w-4',
      badge: 'text-[8px] h-3.5 px-1 py-0',
      title: 'text-sm',
      detail: 'text-xs',
      total: 'text-sm px-2 py-1',
    },
  };

  const classes = sizeClasses[size];

  return (
    <button
      onClick={onClick}
      className={`cursor-pointer w-full text-left rounded-lg hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600 shadow-md ${classes.container}`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center rounded-full bg-blue-600 flex-shrink-0 ${classes.icon}`}
          >
            <ArrowDown className={`${classes.iconSize} text-white`} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className={`font-bold text-gray-900 ${classes.title}`}>
              {loan.loanName}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge
                variant={getLoanTypeBadge(loan.type).variant}
                className={`${classes.badge} leading-none ${
                  getLoanTypeBadge(loan.type).className || ''
                }`}
              >
                {loan.type}
              </Badge>
              <Badge
                variant={getLoanStatusBadge(loan.status).variant}
                className={`${classes.badge} leading-none ${
                  getLoanStatusBadge(loan.status).className
                }`}
              >
                {loan.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className={size === 'sm' ? 'space-y-1' : 'pl-8 space-y-1'}>
          <div className={`text-gray-700 font-semibold ${classes.detail}`}>
            {investorName}
          </div>
          <div
            className={`font-bold text-gray-900 bg-white/60 rounded inline-block ${classes.total}`}
          >
            Interest Due: {formatCurrency(totalAmount)}
          </div>
          <div className={`text-gray-700 space-y-0.5 ${classes.detail}`}>
            <div
              className={`flex items-center ${
                size === 'sm' ? 'gap-1' : 'justify-between'
              }`}
            >
              <span className="font-medium">Principal:</span>
              <span className="font-semibold">{formatCurrency(principal)}</span>
            </div>
            <div
              className={`flex items-center ${
                size === 'sm' ? 'gap-1' : 'justify-between'
              }`}
            >
              <span className="font-medium">Interest:</span>
              <span className="font-semibold">{formatCurrency(interest)}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
