import { BookText } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function JournalPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Journal</h1>
      <Card className="p-8 text-center">
        <BookText size={32} className="mx-auto mb-3 text-[var(--accent)]" />
        <p className="text-[var(--text-secondary)]">Journal review tools coming soon.</p>
      </Card>
    </div>
  );
}
