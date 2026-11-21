import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryActionLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onSecondaryAction?: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  secondaryActionLabel,
  danger = false,
  onConfirm,
  onSecondaryAction,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-6 shadow-xl">
        <h3
          id="confirm-dialog-title"
          className="text-base font-semibold text-[#2C211A] dark:text-[#F4EDE4]"
        >
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6E5C4E] dark:text-[#B8A898]">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[42px] px-4 py-2 text-sm font-medium rounded-xl border border-[#E6DDD1] dark:border-[#382E26] text-[#5C4B3E] dark:text-[#D5C6B7] hover:bg-[#F3EDE4] dark:hover:bg-[#29211B] transition-colors whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="min-h-[42px] px-4 py-2 text-sm font-medium rounded-xl bg-[#F3EDE4] dark:bg-[#2E251E] text-[#7C4D2B] dark:text-[#C89463] hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {secondaryActionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[42px] px-4 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
              danger
                ? 'bg-[#B93829] text-white hover:bg-[#9E2F22]'
                : 'bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F] hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
