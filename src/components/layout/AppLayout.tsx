import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lay-app min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
