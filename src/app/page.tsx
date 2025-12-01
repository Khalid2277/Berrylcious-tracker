'use client';

import { useState, Suspense } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { SalesLog } from '@/components/views/sales-log';
import { ProductsCosts } from '@/components/views/products-costs';
import { FixedCostsView } from '@/components/views/fixed-costs';
import { IngredientsView } from '@/components/views/ingredients';
import { WasteTracking } from '@/components/views/waste-tracking';
import { TransactionClassifier } from '@/components/views/transaction-classifier';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAppState } from '@/hooks/use-app-state';
import { DashboardSkeleton, PageSkeleton } from '@/components/ui/loading-skeleton';
import { CherryIcon, Cloud, CloudOff, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function LoadingFallback({ view }: { view: string }) {
  if (view === 'dashboard') {
    return <DashboardSkeleton />;
  }
  return <PageSkeleton />;
}

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const { useSupabase, isLoaded } = useAppState();

  const renderView = () => {
    if (!isLoaded) {
      return <LoadingFallback view={activeView} />;
    }

    const ViewComponent = (() => {
      switch (activeView) {
        case 'dashboard':
          return DashboardOverview;
        case 'sales-log':
          return SalesLog;
        case 'products-&-costs':
          return ProductsCosts;
        case 'fixed-costs':
          return FixedCostsView;
        case 'ingredients':
          return IngredientsView;
        case 'waste-tracking':
          return WasteTracking;
        case 'transaction-classifier':
          return TransactionClassifier;
        default:
          return DashboardOverview;
      }
    })();

    return (
      <ErrorBoundary key={activeView}>
        <Suspense fallback={<LoadingFallback view={activeView} />}>
          <ViewComponent />
        </Suspense>
      </ErrorBoundary>
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-gradient-to-r from-rose-50/95 to-pink-50/95 dark:from-rose-950/95 dark:to-pink-950/95 backdrop-blur-sm supports-[backdrop-filter]:bg-rose-50/60">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20 transition-transform hover:scale-105">
                <CherryIcon className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-1.5">
                  Berrylicious
                  <Sparkles className="h-3 w-3 text-amber-500" />
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-1">Kiosk Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <Badge
              variant="secondary"
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 transition-colors ${
                useSupabase
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {useSupabase ? (
                <>
                  <Cloud className="h-3 w-3" />
                  <span className="hidden sm:inline">Cloud Sync</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </Badge>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950/10 min-h-[calc(100vh-4rem)] scrollbar-thin">
          <div className="mx-auto max-w-7xl animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {renderView()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
