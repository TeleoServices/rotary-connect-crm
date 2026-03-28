import { useState, useEffect } from 'react';
import { UserPlus, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QueryError } from '@/components/common/QueryError';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';


export default function Team() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { members, loading, error, updateMember, refetch } = useTeam();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Record<string, number>>({});

  // Fetch activity counts for leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      const { data } = await supabase
        .from('interactions')
        .select('user_id');

      if (data) {
        const counts: Record<string, number> = {};
        for (const row of data) {
          if (row.user_id) {
            counts[row.user_id] = (counts[row.user_id] || 0) + 1;
          }
        }
        setLeaderboard(counts);
      }
    }
    fetchLeaderboard();
  }, []);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Admin Only</h2>
        <p className="text-muted-foreground">This page is restricted to administrators.</p>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteStatus(null);

    // For now, just send a magic link — the user will be auto-registered
    const { error } = await supabase.auth.signInWithOtp({
      email: inviteEmail,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    });

    setInviting(false);
    if (error) {
      setInviteStatus(`Error: ${error.message}`);
    } else {
      setInviteStatus(`Magic link sent to ${inviteEmail}`);
      setInviteEmail('');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-sm text-muted-foreground">{members.length} team members</p>
        </div>
      </div>

      <ErrorBoundary>
      {/* Invite Form */}
      <div className="team-invite-form border border-border rounded-lg p-4 mb-6">
        <h3 className="font-medium text-sm mb-3">Invite New Member</h3>
        <form onSubmit={handleInvite} className="flex gap-2">
          <label htmlFor="team-invite-email" className="sr-only">Email address</label>
          <input
            id="team-invite-email"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </button>
        </form>
        {inviteStatus && (
          <p className={`text-sm mt-2 ${inviteStatus.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>
            {inviteStatus}
          </p>
        )}
      </div>

      {/* Members Table */}
      {error ? (
        <QueryError message={error} onRetry={refetch} />
      ) : loading ? (
        <LoadingSpinner />
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No team members yet</p>
          <p className="text-sm">Invite your first team member above.</p>
        </div>
      ) : (
        <div className="team-table border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Team</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Interactions</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                return (
                  <tr key={member.id} className="border-b border-border hover:bg-accent/50">
                    <td className="px-4 py-3 font-medium">{member.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{member.email || '--'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={member.role || 'member'}
                        onChange={e => updateMember(member.id, { role: e.target.value })}
                        aria-label={`Role for ${member.full_name}`}
                        className="px-2 py-1 border border-input rounded text-xs bg-background"
                      >
                        <option value="member">Member</option>
                        <option value="lead">Lead</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{member.team || '--'}</td>
                    <td className="px-4 py-3">
                      <span className="team-leaderboard text-sm font-medium">
                        {leaderboard[member.id] || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </ErrorBoundary>
    </div>
  );
}
