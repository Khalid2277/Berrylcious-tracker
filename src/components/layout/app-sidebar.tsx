'use client';

import {
  BarChart3,
  ShoppingBag,
  Package,
  Calculator,
  Beef,
  CreditCard,
  Cherry,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Dashboard',
    icon: BarChart3,
  },
  {
    title: 'Sales Log',
    icon: ShoppingBag,
  },
  {
    title: 'Products & Costs',
    icon: Package,
  },
  {
    title: 'Fixed Costs',
    icon: Calculator,
  },
  {
    title: 'Ingredients',
    icon: Beef,
  },
  {
    title: 'Transaction Classifier',
    icon: CreditCard,
  },
];

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  return (
    <Sidebar className="border-r-0 bg-sidebar">
      <SidebarHeader className="p-5 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-foreground">
            <Cherry className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-sidebar-foreground tracking-tight">
              Berrylicious
            </h2>
            <p className="text-xs text-sidebar-foreground/50">Kiosk Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-sidebar-foreground/40 font-medium mb-2 px-3">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const viewId = item.title.toLowerCase().replace(/\s+/g, '-');
                const isActive = activeView === viewId;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => onViewChange(viewId)}
                      isActive={isActive}
                      className={`h-11 rounded-xl px-4 transition-all duration-200 ${
                        isActive 
                          ? 'bg-sidebar-accent text-sidebar-foreground font-medium' 
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto">
        <div className="rounded-xl bg-sidebar-accent/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground/70">
              <span className="text-lg">🍓</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground">
                Track your profits
              </p>
              <p className="text-xs text-sidebar-foreground/50 mt-0.5">
                Keep logging sales to see insights
              </p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-sidebar-foreground/30 text-center mt-4">
          Berrylicious Dashboard v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
