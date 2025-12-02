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
import { Cloud, CloudOff, Settings, Bell } from 'lucide-react';

function LoadingFallback({ view }: { view: string }) {
  if (view === 'dashboard') {
    return <DashboardSkeleton />;
  }
  return <PageSkeleton />;
}

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const { useSupabase, isLoaded } = useAppState();

  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return { title: 'Welcome back!', subtitle: 'Here\'s your business overview' };
      case 'sales-log':
        return { title: 'Sales Log', subtitle: 'Track and manage your sales' };
      case 'products-&-costs':
        return { title: 'Products & Costs', subtitle: 'Manage your product pricing' };
      case 'fixed-costs':
        return { title: 'Fixed Costs', subtitle: 'Track monthly expenses' };
      case 'ingredients':
        return { title: 'Ingredients', subtitle: 'Manage inventory and batches' };
      case 'waste-tracking':
        return { title: 'Waste Tracking', subtitle: 'Monitor and reduce waste' };
      case 'transaction-classifier':
        return { title: 'Transaction Classifier', subtitle: 'Categorize POS transactions' };
      default:
        return { title: 'Dashboard', subtitle: 'Business overview' };
    }
  };

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

  const pageInfo = getPageTitle();

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 px-6 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-muted transition-colors" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {pageInfo.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors ${
                useSupabase
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
              }`}
            >
              {useSupabase ? (
                <>
                  <Cloud className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Synced</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Offline</span>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <button className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Settings */}
            <button className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-2 pl-2 ml-2 border-l border-border">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">K</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground">Khalid</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 min-h-[calc(100vh-4rem)] scrollbar-thin">
          <div className="mx-auto max-w-7xl animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {renderView()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
