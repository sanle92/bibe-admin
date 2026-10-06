import { cn } from '@/utils/cn';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90': variant === 'primary',
            'bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-active)]': variant === 'secondary',
            'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
