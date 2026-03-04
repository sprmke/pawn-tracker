'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Wallet,
  ExternalLink,
  Copy,
  MoreVertical,
} from 'lucide-react';

// Common styles for responsive icon buttons
const btnClass = 'flex-shrink-0 h-8 px-2 md:px-3';
const iconClass = 'h-4 w-4 md:mr-1.5';

interface DetailHeaderProps {
  title: string;
  description?: string;
  backLabel: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete: () => Promise<void>;
  deleteTitle: string;
  deleteDescription: string;
  canEdit?: boolean;
  editDisabledReason?: string;
  canDelete?: boolean;
  deleteWarning?: string;
  onComplete?: () => Promise<void>;
  showComplete?: boolean;
  completeTitle?: string;
  completeDescription?: string;
  onPayBalance?: () => void;
  showPayBalance?: boolean;
  onViewLoan?: () => void;
  showViewLoan?: boolean;
  onDuplicate?: () => void;
  showDuplicate?: boolean;
}

export function DetailHeader({
  title,
  description,
  backLabel,
  onBack,
  onEdit,
  onDelete,
  deleteTitle,
  deleteDescription,
  canEdit = true,
  editDisabledReason,
  canDelete = true,
  deleteWarning,
  onComplete,
  showComplete = false,
  completeTitle = 'Complete Loan',
  completeDescription = 'Are you sure you want to mark this loan as completed?',
  onPayBalance,
  showPayBalance = false,
  onViewLoan,
  showViewLoan = false,
  onDuplicate,
  showDuplicate = false,
}: DetailHeaderProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    setIsCompleting(true);
    try {
      await onComplete();
      setShowCompleteConfirm(false);
    } catch (error) {
      console.error('Error completing:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const actionItems = [
    ...(onEdit && canEdit
      ? [
          { label: 'Edit', onClick: onEdit, icon: <Edit className="h-4 w-4" /> },
        ]
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
            onClick: () => setShowCompleteConfirm(true),
            icon: <CheckCircle className="h-4 w-4" />,
          },
        ]
      : []),
    ...(showViewLoan && onViewLoan
      ? [
          {
            label: 'View Loan',
            onClick: onViewLoan,
            icon: <ExternalLink className="h-4 w-4" />,
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: 'Delete',
            onClick: () => setShowDeleteConfirm(true),
            icon: <Trash2 className="h-4 w-4" />,
            destructive: true,
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            </div>
            {description && (
              <p className="text-sm sm:text-base text-muted-foreground">
                {description}
              </p>
            )}
          </div>
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
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {deleteTitle}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {canDelete ? deleteDescription : <span>{deleteWarning}</span>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              {canDelete ? 'Cancel' : 'Close'}
            </Button>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Dialog */}
      <Dialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              {completeTitle}
            </DialogTitle>
            <DialogDescription>{completeDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteConfirm(false)}
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? 'Completing...' : 'Yes, Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
