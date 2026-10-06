import { HandHeart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function PrayersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Prayers</h1>
        <Button size="sm">Moderate</Button>
      </div>
      <Card className="p-8 text-center">
        <HandHeart size={32} className="mx-auto mb-3 text-[var(--accent)]" />
        <p className="text-[var(--text-secondary)]">Prayer request moderation panel coming soon.</p>
      </Card>
    </div>
  );
}
