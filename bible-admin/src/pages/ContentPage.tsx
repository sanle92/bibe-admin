import { useParams } from 'react-router-dom';
import { FileText, Mic, Bookmark, CalendarCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

const TYPE_META: Record<string, { label: string; icon: React.ElementType; singular: string }> = {
  notes: { label: 'Notes', icon: FileText, singular: 'note' },
  sermons: { label: 'Sermons', icon: Mic, singular: 'sermon' },
  highlights: { label: 'Highlights', icon: Bookmark, singular: 'highlight' },
  'reading-plans': { label: 'Reading Plans', icon: CalendarCheck, singular: 'reading plan' },
};

export function ContentPage() {
  const { type = 'notes' } = useParams<{ type: string }>();
  const meta = TYPE_META[type] ?? TYPE_META.notes;
  return (
    <div className="space-y-4">
      <PageHeader
        title={meta.label}
        description={`Manage ${meta.label.toLowerCase()} from one place.`}
        primaryAction={{ label: `New ${meta.singular}` }}
      />

      <Card className="p-8 text-center">
        <p className="text-[var(--text-secondary)]">{meta.label} management coming soon.</p>
      </Card>
    </div>
  );
}
