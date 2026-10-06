import { cn } from '@/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        {
          'bg-[var(--bg-hover)] text-[var(--text-secondary)]': variant === 'default',
          'bg-green-500/10 text-green-500': variant === 'success',
          'bg-yellow-500/10 text-yellow-500': variant === 'warning',
          'bg-red-500/10 text-red-500': variant === 'danger',
          'bg-[var(--accent-soft)] text-[var(--accent)]': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
