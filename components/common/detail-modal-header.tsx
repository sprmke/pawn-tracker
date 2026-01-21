'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle, Wallet, Eye, X, Copy } from 'lucide-react';

// Common styles for responsive icon buttons
const btnClass = 'flex-shrink-0 h-8 px-2 md:px-3';
const iconClass = 'h-4 w-4 md:mr-1.5';

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
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {canEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className={btnClass}>
          <Pencil className={iconClass} />
          <span className="hidden md:inline text-xs">Edit</span>
        </Button>
      )}
      {showDuplicate && onDuplicate && (
        <Button variant="outline" size="sm" onClick={onDuplicate} className={btnClass}>
          <Copy className={iconClass} />
          <span className="hidden md:inline text-xs">Duplicate</span>
        </Button>
      )}
      {showPayBalance && onPayBalance && (
        <Button
          variant="default"
          size="sm"
          onClick={onPayBalance}
          className={`bg-yellow-500 hover:bg-yellow-600 ${btnClass}`}
        >
          <Wallet className={iconClass} />
          <span className="hidden md:inline text-xs">Pay</span>
        </Button>
      )}
      {showComplete && onComplete && (
        <Button
          variant="default"
          size="sm"
          onClick={onComplete}
          className={`bg-blue-600 hover:bg-blue-700 ${btnClass}`}
        >
          <CheckCircle className={iconClass} />
          <span className="hidden md:inline text-xs">Complete</span>
        </Button>
      )}
      {showViewLoan && onViewLoan && (
        <Button variant="outline" size="sm" onClick={onViewLoan} className={btnClass}>
          <Eye className={iconClass} />
          <span className="hidden md:inline text-xs">Loan</span>
        </Button>
      )}
      <Button variant="destructive" size="sm" onClick={onDelete} className={btnClass}>
        <Trash2 className={iconClass} />
        <span className="hidden md:inline text-xs">Delete</span>
      </Button>
      {onClose && (
        <Button variant="outline" size="sm" onClick={onClose} className={btnClass}>
          <X className={iconClass} />
          <span className="hidden md:inline text-xs">Close</span>
        </Button>
      )}
    </div>
  );
}
