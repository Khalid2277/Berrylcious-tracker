'use client';

import {
  BarChart3,
  ShoppingBag,
  Package,
  Calculator,
  Beef,
  CreditCard,
  Cherry,
  Trash,
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
    color: 'text-rose-500',
  },
  {
    title: 'Sales Log',
    icon: ShoppingBag,
    color: 'text-pink-500',
  },
  {
    title: 'Products & Costs',
    icon: Package,
    color: 'text-violet-500',
  },
  {
    title: 'Fixed Costs',
    icon: Calculator,
    color: 'text-blue-500',
  },
  {
    title: 'Ingredients',
    icon: Beef,
    color: 'text-amber-500',
  },
  {
    title: 'Waste Tracking',
    icon: Trash,
    color: 'text-red-500',
  },
  {
    title: 'Transaction Classifier',
    icon: CreditCard,
    color: 'text-emerald-500',
  },
];

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-rose-100 dark:border-rose-900/30">
      <SidebarHeader className="border-b border-rose-100 dark:border-rose-900/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20">
            <Cherry className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Berrylicious
            </h2>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Kiosk Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const viewId = item.title.toLowerCase().replace(/\s+/g, '-');
                const isActive = activeView === viewId;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => onViewChange(viewId)}
                      isActive={isActive}
                      className={`transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 border-l-2 border-rose-500' 
                          : 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                      }`}
                    >
                      <item.icon className={`${isActive ? item.color : 'text-muted-foreground'} transition-colors`} />
                      <span className={isActive ? 'font-medium' : ''}>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-rose-100 dark:border-rose-900/30 p-4">
        <div className="text-center space-y-1">
          <p className="text-[10px] text-muted-foreground">
            Berrylicious Dashboard v1.0
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            Data stored locally & synced to cloud
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
