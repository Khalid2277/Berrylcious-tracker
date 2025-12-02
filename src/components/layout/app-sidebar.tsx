'use client';

import {
  BarChart3,
  ShoppingBag,
  Package,
  Calculator,
  Beef,
  CreditCard,
  Cherry,
  Store,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
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
      <SidebarFooter className="p-4 mt-auto space-y-3">
        <Link 
          href="/pos" 
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              Worker POS
            </p>
            <p className="text-xs text-white/70">
              Open quick sale view
            </p>
          </div>
          <ExternalLink className="h-4 w-4 opacity-70" />
        </Link>
        <p className="text-[10px] text-sidebar-foreground/30 text-center">
          Berrylicious Dashboard v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
