import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ProgressBarProps = {
  value: number; // 0..100
  text?: string;
  onCancel?: () => void;
  className?: string;
};

export function ProgressBar({ value, text, onCancel, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.floor(value)));

  return (
    <div
      role="group"
      aria-label="progress"
      className={cn('flex w-full max-w-xl flex-col gap-3', className)}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium" aria-live="polite">
          {text ?? 'Processing...'}
        </div>
        <div className="text-xs tabular-nums opacity-70" aria-label="percent">
          {pct}%
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--gray-blue)]/60">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: 'var(--main-blue)',
            transition: 'width 200ms ease',
          }}
        />
      </div>
      {onCancel ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}
