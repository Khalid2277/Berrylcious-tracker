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
import { Cloud, CloudOff } from 'lucide-react';

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
        {/* Responsive Header */}
        <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <SidebarTrigger className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-muted transition-colors shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">
                {pageInfo.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate hidden xs:block">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Connection Status */}
            <div
              className={`flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
                useSupabase
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
              }`}
            >
              {useSupabase ? (
                <>
                  <Cloud className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline font-medium">Synced</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline font-medium">Offline</span>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar - hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 sm:ml-2 border-l border-border">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-medium text-primary">K</span>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-foreground">Khalid</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Responsive Main Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] scrollbar-thin">
          <div className="mx-auto max-w-7xl animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {renderView()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
