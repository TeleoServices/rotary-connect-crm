import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
      </h1>
      <p className="text-muted-foreground">
        Dashboard stats and activity feed will be built in Milestone 6.
      </p>
    </div>
  );
}
