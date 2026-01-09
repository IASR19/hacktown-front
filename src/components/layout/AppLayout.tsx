import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-hacktown-cyan/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-hacktown-pink/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hacktown-purple/5 rounded-full blur-3xl" />
        </div>
        
        <AppSidebar />
        <main className="flex-1 flex flex-col relative z-10">
          <header className="h-16 glass-strong flex items-center px-6 sticky top-0 z-20">
            <SidebarTrigger className="mr-4 text-foreground hover:text-hacktown-cyan transition-colors" />
            <div className="flex items-center gap-0">
              <span className="text-2xl font-bold text-hacktown-cyan tracking-tight">HACK</span>
              <span className="text-2xl font-bold text-hacktown-pink tracking-tight">TOWN</span>
              <span className="ml-2 text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/50 border border-border">
                SRS
              </span>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
