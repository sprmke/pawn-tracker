'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import {
  Pencil,
  Trash2,
  CheckCircle,
  Wallet,
  Eye,
  X,
  Copy,
  MoreVertical,
} from 'lucide-react';

// Common styles for responsive icon buttons
const btnClass = 'flex-shrink-0 h-8 px-2 md:px-3';
const iconClass = 'h-4 w-4';

interface DetailModalHeaderProps {
  onEdit: () => void;
  onDelete: () => void;
  onClose?: () => void;
  canEdit?: boolean;
  editDisabledReason?: string;
  onComplete?: () => void;
  showComplete?: boolean;
  onPayBalance?: () => void;
  showPayBalance?: boolean;
  onViewLoan?: () => void;
  showViewLoan?: boolean;
  onDuplicate?: () => void;
  showDuplicate?: boolean;
}

export function DetailModalHeader({
  onEdit,
  onDelete,
  onClose,
  canEdit = true,
  editDisabledReason,
  onComplete,
  showComplete = false,
  onPayBalance,
  showPayBalance = false,
  onViewLoan,
  showViewLoan = false,
  onDuplicate,
  showDuplicate = false,
}: DetailModalHeaderProps) {
  const actionItems = [
    ...(canEdit
      ? [{ label: 'Edit', onClick: onEdit, icon: <Pencil className="h-4 w-4" /> }]
      : []),
    ...(showDuplicate && onDuplicate
      ? [
          {
            label: 'Duplicate',
            onClick: onDuplicate,
            icon: <Copy className="h-4 w-4" />,
          },
        ]
      : []),
    ...(showPayBalance && onPayBalance
      ? [
          {
            label: 'Pay',
            onClick: onPayBalance,
            icon: <Wallet className="h-4 w-4" />,
          },
        ]
      : []),
    ...(showComplete && onComplete
      ? [
          {
            label: 'Complete',
            onClick: onComplete,
            icon: <CheckCircle className="h-4 w-4" />,
          },
        ]
      : []),
    ...(showViewLoan && onViewLoan
      ? [
          {
            label: 'View Loan',
            onClick: onViewLoan,
            icon: <Eye className="h-4 w-4" />,
          },
        ]
      : []),
    {
      label: 'Delete',
      onClick: onDelete,
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
    },
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {actionItems.length > 0 && (
        <DropdownMenu
          align="end"
          trigger={
            <Button variant="outline" size="sm" className={btnClass} title="Actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
          items={actionItems}
        />
      )}
      {onClose && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className={btnClass}
          title="Close"
        >
          <X className={iconClass} />
        </Button>
      )}
    </div>
  );
}
