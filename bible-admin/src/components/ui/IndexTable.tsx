import { cn } from '@/utils/cn';

export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode;
}

interface IndexTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  selectedRowKey?: string;
  className?: string;
}

export function IndexTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyText = 'No results found.',
  selectedRowKey,
  className,
}: IndexTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'whitespace-nowrap pb-3 pt-1 font-medium',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center'
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {rows.map((row) => {
            const key = getRowKey(row);
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors',
                  onRowClick ? 'cursor-pointer' : '',
                  selectedRowKey === key ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-hover)]'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'py-3 align-top',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-sm text-[var(--text-secondary)]"
              >
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
