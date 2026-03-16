import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Target,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/businesses', icon: Building2, label: 'Businesses' },
  { to: '/needs', icon: Target, label: 'Needs Tracker' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { signOut, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="lay-sidebar-header p-4 border-b border-border">
        <h1 className="text-lg font-bold">RotaryConnect</h1>
        <p className="text-xs text-muted-foreground mt-1">Business Outreach CRM</p>
      </div>

      <nav className="lay-sidebar-nav flex-1 p-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="lay-sidebar-footer p-4 border-t border-border">
        <div className="text-sm font-medium truncate">{profile?.full_name}</div>
        <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lay-mobile-nav fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-background border border-border"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`lay-sidebar fixed top-0 left-0 z-40 h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
