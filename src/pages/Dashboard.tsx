import { useState, useEffect } from 'react';
import { Building2, MessageSquare, Target, CalendarClock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRecentActivity } from '@/hooks/useRealtime';
import { CATEGORY_LABELS } from '@/hooks/useNeeds';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DashStats {
  totalBusinesses: number;
  contactedThisWeek: number;
  needsIdentified: number;
  pendingFollowUps: number;
}

interface NeedsByCategory {
  category: string;
  count: number;
}

function useStats() {
  const [stats, setStats] = useState<DashStats>({
    totalBusinesses: 0,
    contactedThisWeek: 0,
    needsIdentified: 0,
    pendingFollowUps: 0,
  });
  const [needsChart, setNeedsChart] = useState<NeedsByCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { count: bizCount } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: weekCount } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true })
        .gte('date', weekAgo.toISOString().split('T')[0]);

      const { count: needsCount } = await supabase
        .from('business_needs')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: followUpCount } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true })
        .lte('follow_up_date', today)
        .not('follow_up_date', 'is', null);

      setStats({
        totalBusinesses: bizCount ?? 0,
        contactedThisWeek: weekCount ?? 0,
        needsIdentified: needsCount ?? 0,
        pendingFollowUps: followUpCount ?? 0,
      });

      const { data: needsData } = await supabase
        .from('business_needs')
        .select('category');

      if (needsData) {
        const counts: Record<string, number> = {};
        for (const n of needsData) {
          counts[n.category] = (counts[n.category] || 0) + 1;
        }
        setNeedsChart(
          Object.entries(counts)
            .map(([category, count]) => ({
              category: CATEGORY_LABELS[category] || category,
              count,
            }))
            .sort((a, b) => b.count - a.count)
        );
      }

      setLoading(false);
    }
    fetch();
  }, []);

  return { stats, needsChart, loading };
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { stats, needsChart, loading: statsLoading } = useStats();
  const { activities, loading: activityLoading } = useRecentActivity();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
      </h1>

      <ErrorBoundary>
        <div className="dash-stat-cards grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Building2} label="Total Businesses" value={stats.totalBusinesses} loading={statsLoading} />
          <StatCard icon={MessageSquare} label="Contacted This Week" value={stats.contactedThisWeek} loading={statsLoading} />
          <StatCard icon={Target} label="Needs Identified" value={stats.needsIdentified} loading={statsLoading} />
          <StatCard icon={CalendarClock} label="Pending Follow-ups" value={stats.pendingFollowUps} loading={statsLoading} />
        </div>
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <div className="dash-activity-feed border border-border rounded-lg p-4">
            <h2 className="font-bold mb-4">Recent Activity</h2>
            {activityLoading ? (
              <LoadingSpinner />
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet. Log your first interaction!
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map(a => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs capitalize whitespace-nowrap">{a.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{a.subject || a.notes || 'No details'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="dash-chart-container border border-border rounded-lg p-4">
            <h2 className="font-bold mb-4">Needs by Category</h2>
            {statsLoading ? (
              <LoadingSpinner />
            ) : needsChart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No needs data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={needsChart} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="oklch(0.646 0.222 41.116)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading }: {
  icon: typeof Building2; label: string; value: number; loading: boolean;
}) {
  return (
    <div className="dash-stat-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </div>
  );
}
