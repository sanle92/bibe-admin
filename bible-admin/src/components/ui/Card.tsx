import { cn } from '@/utils/cn';
import { type HTMLAttributes, forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
