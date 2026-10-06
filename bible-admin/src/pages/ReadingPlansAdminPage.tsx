import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/useToast';
import {
  fetchAdminPlans,
  publishPlan,
  schedulePlan,
  deletePlan,
  fetchPlanProgress,
  type AdminReadingPlan,
} from '@/services/readingPlanAdminService';

const PLAN_TEMPLATES = [
  { key: '365-days', label: '365 Days', duration: 365, desc: 'Entire Bible in one year' },
  { key: '90-days', label: '90 Days', duration: 90, desc: 'Whole Bible in 90 days' },
  { key: '30-days', label: '30 Days', duration: 30, desc: '30 selected passages' },
  { key: 'chronological', label: 'Chronological', duration: 365, desc: 'Bible in chronological order' },
  { key: 'custom', label: 'Custom', duration: 0, desc: 'Build your own' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function ReadingPlansAdminPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['adminReadingPlans'], queryFn: fetchAdminPlans });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const filtered = plans.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const publish = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => publishPlan(id, publish),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminReadingPlans'] }),
  });

  const schedule = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string | null }) => schedulePlan(id, date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminReadingPlans'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReadingPlans'] });
      setSelectedPlanId(null);
      showToast('Plan deleted', 'success');
    },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reading Plans</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create, publish, schedule, and track reading plans.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Plan
        </Button>
      </div>

      {showCreate && (
        <CreatePlanForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void queryClient.invalidateQueries({ queryKey: ['adminReadingPlans'] });
            showToast('Plan created', 'success');
          }}
        />
      )}

      <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-hover)] px-3 py-2">
        <BookOpen size={16} className="text-[var(--text-tertiary)]" />
        <Input
          placeholder="Search plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 bg-transparent p-0 focus:ring-0"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {isLoading && <p className="text-sm text-[var(--text-secondary)]">Loading plans...</p>}
          {filtered.map((plan) => (
            <motion.div key={plan.id} variants={item}>
              <Card
                className={cn(
                  'cursor-pointer p-4 transition-colors hover:border-[var(--accent)]',
                  selectedPlanId === plan.id && 'border-[var(--accent)] bg-[var(--accent-soft)]'
                )}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{plan.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{plan.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.is_public ? (
                      <Badge variant="success"><Eye size={10} className="mr-1" /> Published</Badge>
                    ) : (
                      <Badge variant="default"><EyeOff size={10} className="mr-1" /> Draft</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  <span className="rounded-md bg-[var(--bg-hover)] px-2 py-1">{plan.duration_days} days</span>
                  {plan.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-[var(--bg-hover)] px-2 py-1 capitalize">{tag}</span>
                  ))}
                  {plan.scheduled_at && (
                    <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
                      Scheduled {format(parseISO(plan.scheduled_at), 'MMM d')}
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div variants={item}>
          {selectedPlan ? (
            <PlanDetailCard
              plan={selectedPlan}
              onPublish={() => void publish.mutate({ id: selectedPlan.id, publish: !selectedPlan.is_public })}
              onSchedule={(date) => void schedule.mutate({ id: selectedPlan.id, date })}
              onDelete={() => void remove.mutate(selectedPlan.id)}
            />
          ) : (
            <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
              <BookOpen size={32} className="mb-3 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">Select a plan to view progress, publish, or schedule.</p>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function PlanDetailCard({
  plan,
  onPublish,
  onSchedule,
  onDelete,
}: {
  plan: AdminReadingPlan;
  onPublish: () => void;
  onSchedule: (date: string | null) => void;
  onDelete: () => void;
}) {
  const { data: progress } = useQuery({
    queryKey: ['planProgress', plan.id],
    queryFn: () => fetchPlanProgress(plan.id),
    enabled: Boolean(plan.id),
  });
  const [scheduleDate, setScheduleDate] = useState(plan.scheduled_at ? format(parseISO(plan.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '');

  const completionRate = progress && progress.totalDays ? Math.round((progress.completedDays / progress.totalDays) * 100) : 0;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">{plan.name}</h2>
          <p className="text-xs text-[var(--text-tertiary)]">{plan.description}</p>
        </div>
        <Badge variant={plan.is_public ? 'success' : 'default'}>{plan.is_public ? 'Live' : 'Draft'}</Badge>
      </div>

      {progress && (
        <div className="mb-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatBox icon={Users} label="Participants" value={progress.participants} />
            <StatBox icon={CheckCircle} label="Completions" value={progress.completions} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Overall progress</span>
              <span className="font-medium text-[var(--accent)]">{completionRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-hover)]">
              <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Schedule publish</label>
          <Input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="text-sm"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => onSchedule(scheduleDate || null)}>
              <Clock size={14} /> Save Schedule
            </Button>
            {plan.scheduled_at && (
              <Button size="sm" variant="ghost" onClick={() => { setScheduleDate(''); onSchedule(null); }}>
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1" onClick={onPublish}>
            {plan.is_public ? <EyeOff size={14} /> : <Eye size={14} />}
            {plan.is_public ? 'Unpublish' : 'Publish'}
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-hover)] p-3">
      <div className="mb-1 flex items-center gap-2 text-[var(--text-tertiary)]">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-[var(--text-primary)]">{value.toLocaleString()}</p>
    </div>
  );
}

function CreatePlanForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [template, setTemplate] = useState(PLAN_TEMPLATES[0]);
  const [name, setName] = useState(PLAN_TEMPLATES[0].label);
  const [description, setDescription] = useState(PLAN_TEMPLATES[0].desc);
  const [duration, setDuration] = useState(PLAN_TEMPLATES[0].duration);

  const handleTemplate = (key: string) => {
    const t = PLAN_TEMPLATES.find((x) => x.key === key) ?? PLAN_TEMPLATES[0];
    setTemplate(t);
    setName(t.label);
    setDescription(t.desc);
    setDuration(t.duration);
  };

  const create = () => {
    // In production, call service to create plan
    onCreated();
  };

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-[var(--text-primary)]">Create Reading Plan</h3>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTemplate(t.key)}
            className={cn(
              'rounded-xl border p-3 text-left transition-colors',
              template.key === t.key ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-subtle)] bg-[var(--bg-hover)]'
            )}
          >
            <p className="font-medium text-[var(--text-primary)]">{t.label}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{t.desc}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Plan name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" placeholder="Duration (days)" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} />
      </div>
      <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-3" />
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={create}><ArrowRight size={14} /> Create</Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </Card>
  );
}
