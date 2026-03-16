import { useState, useEffect } from 'react';
import { Building2, MessageSquare, Target, CalendarClock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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

interface FollowUp {
  id: string;
  follow_up_date: string;
  subject: string | null;
  type: string;
  business_id: string;
  business_name: string;
}

function useStats() {
  const [stats, setStats] = useState<DashStats>({
    totalBusinesses: 0,
    contactedThisWeek: 0,
    needsIdentified: 0,
    pendingFollowUps: 0,
  });
  const [needsChart, setNeedsChart] = useState<NeedsByCategory[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
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

      // Pending follow-ups: follow_up_date >= today (upcoming and today)
      const today = new Date().toISOString().split('T')[0];
      const { count: followUpCount } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true })
        .gte('follow_up_date', today)
        .not('follow_up_date', 'is', null);

      setStats({
        totalBusinesses: bizCount ?? 0,
        contactedThisWeek: weekCount ?? 0,
        needsIdentified: needsCount ?? 0,
        pendingFollowUps: followUpCount ?? 0,
      });

      // Fetch upcoming follow-ups with business name for the list
      const { data: followUpData, error: followUpError } = await supabase
        .from('interactions')
        .select('id, follow_up_date, subject, type, business_id, businesses(name)')
        .gte('follow_up_date', today)
        .not('follow_up_date', 'is', null)
        .order('follow_up_date', { ascending: true })
        .limit(10);

      if (followUpError) {
        console.error('[Dashboard] followUps:', followUpError.message);
      } else if (followUpData) {
        setFollowUps(
          followUpData.map((row) => ({
            id: row.id,
            follow_up_date: row.follow_up_date!,
            subject: row.subject,
            type: row.type,
            business_id: row.business_id,
            business_name: (row.businesses as unknown as { name: string })?.name || 'Unknown',
          }))
        );
      }

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

  return { stats, needsChart, followUps, loading };
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { stats, needsChart, followUps, loading: statsLoading } = useStats();
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

      {/* Pending Follow-ups Section */}
      <ErrorBoundary>
        <div className="dash-follow-ups border border-border rounded-lg p-4">
          <h2 className="font-bold mb-4">Upcoming Follow-ups</h2>
          {statsLoading ? (
            <LoadingSpinner />
          ) : followUps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No upcoming follow-ups. Great — you're all caught up!
            </p>
          ) : (
            <div className="space-y-2">
              {followUps.map(fu => {
                const dueDate = new Date(fu.follow_up_date + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays < 0;
                const isToday = diffDays === 0;

                return (
                  <Link
                    key={fu.id}
                    to={`/businesses/${fu.business_id}`}
                    className="dash-follow-up-item flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/50 transition-colors text-sm"
                  >
                    <div className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                      isOverdue ? 'bg-red-100 text-red-700' :
                      isToday ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {isOverdue ? 'Overdue' : isToday ? 'Today' : dueDate.toLocaleDateString()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fu.business_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {fu.type} — {fu.subject || 'No subject'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </ErrorBoundary>
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
