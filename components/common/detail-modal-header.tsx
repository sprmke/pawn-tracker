'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle, Wallet, Eye } from 'lucide-react';

interface DetailModalHeaderProps {
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  editDisabledReason?: string;
  onComplete?: () => void;
  showComplete?: boolean;
  onPayBalance?: () => void;
  showPayBalance?: boolean;
  onViewLoan?: () => void;
  showViewLoan?: boolean;
}

export function DetailModalHeader({
  onEdit,
  onDelete,
  canEdit = true,
  editDisabledReason,
  onComplete,
  showComplete = false,
  onPayBalance,
  showPayBalance = false,
  onViewLoan,
  showViewLoan = false,
}: DetailModalHeaderProps) {
  return (
    <div className="flex gap-2">
      {canEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}
      {showPayBalance && onPayBalance && (
        <Button
          variant="default"
          size="sm"
          onClick={onPayBalance}
          className="bg-yellow-500 hover:bg-yellow-600"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Pay Balance
        </Button>
      )}
      {showComplete && onComplete && (
        <Button
          variant="default"
          size="sm"
          onClick={onComplete}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete
        </Button>
      )}
      {showViewLoan && onViewLoan && (
        <Button variant="outline" size="sm" onClick={onViewLoan}>
          <Eye className="h-4 w-4 mr-2" />
          View Loan
        </Button>
      )}
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  );
}
