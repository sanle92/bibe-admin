import { cn } from '@/utils/cn';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    icon?: React.ElementType;
    onClick?: () => void;
  };
  secondaryActions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 space-y-4', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction && (
            <Button size="sm" onClick={primaryAction.onClick}>
              {primaryAction.icon && <primaryAction.icon size={16} className="mr-1.5" />}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
      {children && <div className="border-b border-[var(--border-subtle)] pb-4">{children}</div>}
    </div>
  );
}
