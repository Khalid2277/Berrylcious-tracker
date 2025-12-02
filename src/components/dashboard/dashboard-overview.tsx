'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppState } from '@/hooks/use-app-state';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { DollarSign, TrendingUp, ShoppingCart, Target, Coffee, Cherry, Cookie, Calculator, Package, AlertTriangle, Info } from 'lucide-react';
import { DashboardChart } from './dashboard-chart';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function DashboardOverview() {
  const { state, calculateDashboardStats, calculateInventory, calculateCostPerCup, formatCurrency, isLoaded } = useAppState();
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [variableCostDialogOpen, setVariableCostDialogOpen] = useState(false);
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  
  if (!isLoaded) {
    return <DashboardSkeleton />;
  }

  const stats = calculateDashboardStats();
  const inventory = calculateInventory();

  // Calculate COGS (Cost of Goods Sold) based on actual usage ratio
  // COGS = For each ingredient: (used / purchased) × total cost
  const calculateActualCOGS = () => {
    let cogs = 0;
    
    for (const inv of inventory) {
      if (inv.totalPurchased > 0 && inv.totalUsed > 0) {
        // Only count what was actually purchased, proportional to usage
        const usageRatio = Math.min(inv.totalUsed / inv.totalPurchased, 1); // Cap at 100%
        cogs += inv.totalCost * usageRatio;
      }
    }
    
    // Add manual cost products (Rocky, Cookies, etc.)
    state.sales.forEach(sale => {
      const product = state.products[sale.productId];
      if (product?.useManualCost) {
        cogs += sale.qty * (product.manualCostPerCup || 0);
      }
    });
    
    return cogs;
  };
  
  const totalCOGS = calculateActualCOGS();

  // Calculate profit based on COGS
  const grossProfitCOGS = stats.totalRevenue - totalCOGS;
  const netProfitCOGS = grossProfitCOGS - stats.fixedTotal;
  const remainingToBreakevenCOGS = netProfitCOGS >= 0 ? 0 : Math.abs(netProfitCOGS);

  // Calculate amount left to cover fixed costs only
  const remainingForFixedCosts = Math.max(0, stats.fixedTotal - grossProfitCOGS);

  // Calculate average profit per cup for strawberry products only (normal & kunafa)
  // Use COGS proportional to strawberry product sales
  const strawberryProductIds = ['normal', 'kunafa'];
  const strawberrySales = state.sales.filter(s => strawberryProductIds.includes(s.productId));
  const strawberryCupsTotal = strawberrySales.reduce((sum, s) => sum + s.qty, 0);
  const strawberryRevenue = strawberrySales.reduce((sum, s) => sum + (s.qty * s.unitPrice), 0);
  
  // Calculate strawberry product COGS proportionally
  const totalCupsAll = state.sales.reduce((sum, s) => {
    const p = state.products[s.productId];
    return p && !p.useManualCost ? sum + s.qty : sum;
  }, 0);
  const strawberryCOGSRatio = totalCupsAll > 0 ? strawberryCupsTotal / totalCupsAll : 0;
  const ingredientCOGS = inventory.reduce((sum, inv) => {
    if (inv.totalPurchased > 0 && inv.totalUsed > 0) {
      const usageRatio = Math.min(inv.totalUsed / inv.totalPurchased, 1);
      return sum + inv.totalCost * usageRatio;
    }
    return sum;
  }, 0);
  const strawberryCost = ingredientCOGS * strawberryCOGSRatio;
  const strawberryProfit = strawberryRevenue - strawberryCost;
  const avgProfitPerStrawberryCup = strawberryCupsTotal > 0 ? strawberryProfit / strawberryCupsTotal : 0;

  const revenueCards = [
    {
      id: 'net-revenue',
      title: 'Net Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: 'Tap to see breakdown',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-foreground',
      clickable: true,
    },
    {
      id: 'var-cost',
      title: 'Total Variable Cost',
      value: formatCurrency(stats.totalVarCost),
      icon: Package,
      description: 'Tap to see breakdown',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      valueColor: 'text-foreground',
      clickable: true,
    },
    {
      id: 'sales',
      title: 'Total Sales',
      value: stats.totalCups.toLocaleString(),
      icon: ShoppingCart,
      description: 'Tap to see summary',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-foreground',
      clickable: true,
    },
    {
      id: 'profit',
      title: 'Net Profit',
      value: formatCurrency(netProfitCOGS),
      icon: TrendingUp,
      description: 'After all expenses',
      iconBg: netProfitCOGS >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30',
      iconColor: netProfitCOGS >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      valueColor: 'text-foreground',
      clickable: false,
    },
  ];

  // Prepare data for charts
  const salesByProduct = Object.values(state.products).map(product => {
    const productSales = state.sales
      .filter(sale => sale.productId === product.id)
      .reduce((sum, sale) => sum + sale.qty, 0);
    
    return {
      name: product.name,
      value: productSales,
      revenue: productSales * product.price,
    };
  }).filter(item => item.value > 0);

  const salesOverTime = state.sales
    .reduce((acc, sale) => {
      const date = sale.date;
      const existingEntry = acc.find(entry => entry.date === date);
      const revenue = sale.qty * sale.unitPrice;
      
      if (existingEntry) {
        existingEntry.revenue += revenue;
        existingEntry.units += sale.qty;
      } else {
        acc.push({
          date,
          revenue,
          units: sale.qty,
        });
      }
      return acc;
    }, [] as { date: string; revenue: number; units: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Track your Berrylicious kiosk performance and metrics
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {revenueCards.map((card, index) => (
          <Card 
            key={card.id} 
            className={`transition-all hover:shadow-md ${card.clickable ? 'cursor-pointer' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => {
              if (card.id === 'net-revenue') setRevenueDialogOpen(true);
              if (card.id === 'var-cost') setVariableCostDialogOpen(true);
              if (card.id === 'sales') setSalesDialogOpen(true);
            }}
          >
            <CardContent className="p-3 sm:p-4 md:pt-6 md:px-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.iconColor}`} />
        </div>
                {card.clickable && (
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                )}
      </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">{card.title}</p>
              <div className={`text-lg sm:text-xl md:text-2xl font-bold ${card.valueColor} truncate`}>{card.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate hidden sm:block">{card.description}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Extra Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => setCostDialogOpen(true)}
        >
          <CardContent className="p-3 sm:p-4 md:pt-6 md:px-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Total Costs</p>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {formatCurrency(stats.fixedTotal + stats.totalVarCost)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Fixed + Variable • Tap for details</p>
          </CardContent>
        </Card>
        {/* Breakeven Card */}
        <Card>
          <CardContent className="p-3 sm:p-4 md:pt-6 md:px-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl ${remainingToBreakevenCOGS === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'} flex items-center justify-center`}>
                <Target className={`h-4 w-4 sm:h-5 sm:w-5 ${remainingToBreakevenCOGS === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">To Break-even</p>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${remainingToBreakevenCOGS === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {remainingToBreakevenCOGS === 0 ? '✓ Achieved!' : formatCurrency(remainingToBreakevenCOGS)}
            </div>
            {remainingToBreakevenCOGS > 0 && avgProfitPerStrawberryCup > 0 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                ~{Math.ceil(remainingToBreakevenCOGS / avgProfitPerStrawberryCup)} cups to go
              </p>
            )}
            </CardContent>
          </Card>
      </div>

      {/* Cost Breakdown Dialog */}
      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Breakdown Summary
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of all costs
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Fixed Costs Section */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">FIXED COSTS</h4>
              <div className="space-y-2">
                {state.fixedCosts.length > 0 ? (
                  state.fixedCosts.map((cost) => (
                    <div key={cost.id} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                      <span>{cost.name}</span>
                      <span className="font-medium">{formatCurrency(cost.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No fixed costs recorded</p>
                )}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t font-semibold">
                <span>Total Fixed Costs</span>
                <span className="text-blue-600">{formatCurrency(stats.fixedTotal)}</span>
              </div>
            </div>

            <Separator />

            {/* Variable Costs Section - Total Spent on Ingredients */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">VARIABLE COSTS (PURCHASES)</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>Strawberries</span>
                  <span className="font-medium">
                    {formatCurrency(inventory.find(i => i.ingredientId === 'strawberry')?.totalCost || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>Chocolate</span>
                  <span className="font-medium">
                    {formatCurrency(inventory.find(i => i.ingredientId === 'chocolate')?.totalCost || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>Kunafa</span>
                  <span className="font-medium">
                    {formatCurrency(inventory.find(i => i.ingredientId === 'kunafa')?.totalCost || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>Cups</span>
                  <span className="font-medium">
                    {formatCurrency(inventory.find(i => i.ingredientId === 'cup')?.totalCost || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>Sticks</span>
                  <span className="font-medium">
                    {formatCurrency(inventory.find(i => i.ingredientId === 'sticks')?.totalCost || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t font-semibold">
                <span>Total Variable Costs</span>
                <span className="text-red-600">{formatCurrency(stats.totalVarCost)}</span>
              </div>
            </div>

            <Separator />

            {/* Deductions Section */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">DEDUCTIONS FROM REVENUE</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>POS Fees ({state.useManualPosFee ? 'Manual' : `${state.posFeePercent}%`})</span>
                  <span className="font-medium">{formatCurrency(stats.posFees)}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>Rocky Road Deductions (50 AED each)</span>
                  <span className="font-medium">{formatCurrency(stats.rockyDeduction)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t font-semibold">
                <span>Total Deductions</span>
                <span className="text-orange-600">{formatCurrency(stats.posFees + stats.rockyDeduction)}</span>
              </div>
            </div>

            <Separator />

            {/* Grand Total */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">TOTAL COSTS</span>
                <span className="font-bold text-2xl text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(stats.fixedTotal + stats.totalVarCost)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Fixed ({formatCurrency(stats.fixedTotal)}) + Variable ({formatCurrency(stats.totalVarCost)})
              </p>
            </div>

            {/* Profit Summary */}
            <div className={`p-4 rounded-xl ${stats.netAfterFixed >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Gross Revenue</span>
                  <span>{formatCurrency(stats.grossRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>− Deductions (POS + Rocky)</span>
                  <span>-{formatCurrency(stats.posFees + stats.rockyDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>= Net Revenue</span>
                  <span>{formatCurrency(stats.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>− Variable Costs</span>
                  <span>-{formatCurrency(stats.totalVarCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>= Gross Profit</span>
                  <span>{formatCurrency(stats.profitBeforeFixed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>− Fixed Costs</span>
                  <span>-{formatCurrency(stats.fixedTotal)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Profit</span>
                  <span className={stats.netAfterFixed >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(stats.netAfterFixed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakeven Status */}
            <div className={`p-4 rounded-xl ${remainingToBreakevenCOGS === 0 ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/40 dark:to-emerald-950/40 border-2 border-green-400' : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-400'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base">
                    {remainingToBreakevenCOGS === 0 ? '🎉 Breakeven Achieved!' : '📊 Breakeven Status'}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {remainingToBreakevenCOGS === 0 
                      ? 'You have covered all your costs!'
                      : 'Amount needed to cover all costs'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-2xl ${remainingToBreakevenCOGS === 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {remainingToBreakevenCOGS === 0 
                      ? '✓' 
                      : formatCurrency(remainingToBreakevenCOGS)}
                  </span>
                  {remainingToBreakevenCOGS > 0 && (
                    <p className="text-xs text-muted-foreground">remaining</p>
                  )}
                </div>
              </div>
              {/* Amount left to cover fixed costs */}
              {remainingForFixedCosts > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-300/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Amount left to cover fixed costs</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                        {formatCurrency(remainingForFixedCosts)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {remainingToBreakevenCOGS > 0 && avgProfitPerStrawberryCup > 0 && (
                <div className={`mt-3 pt-3 border-t border-amber-300/50 ${remainingForFixedCosts > 0 ? '' : 'mt-0 pt-0 border-0'}`}>
                  <div className="flex justify-between text-sm">
                    <span>Avg profit per cup (Strawberry products)</span>
                    <span>{formatCurrency(avgProfitPerStrawberryCup)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Estimated cups to breakeven</span>
                    <span className="font-medium">
                      ~{Math.ceil(remainingToBreakevenCOGS / avgProfitPerStrawberryCup)} cups
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revenue Breakdown Dialog */}
      <Dialog open={revenueDialogOpen} onOpenChange={setRevenueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Net Revenue Breakdown
            </DialogTitle>
            <DialogDescription>
              How your net revenue is calculated
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <span className="font-medium">Gross Revenue (Sales)</span>
                <span className="font-bold text-emerald-600">{formatCurrency(stats.grossRevenue)}</span>
              </div>
              
              <div className="text-center text-muted-foreground text-sm">minus</div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                <span>POS Fees ({state.useManualPosFee ? 'Manual' : `${state.posFeePercent}%`})</span>
                <span className="text-red-600">-{formatCurrency(stats.posFees)}</span>
              </div>

              {stats.autoPosFees > 0 && (
                <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>Auto POS Fees (AED 1 + 2.6%)</span>
                  <span className="text-red-600">-{formatCurrency(stats.autoPosFees)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                <span>Rocky Road Deductions</span>
                <span className="text-red-600">-{formatCurrency(stats.rockyDeduction)}</span>
              </div>
            </div>

            <Separator />

            <div className="bg-primary/10 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Net Revenue</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(stats.grossRevenue)} - {formatCurrency(stats.posFees + stats.autoPosFees)} - {formatCurrency(stats.rockyDeduction)}
              </p>
            </div>

            {stats.tipsRevenue > 0 && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p><strong>Note:</strong> Gross revenue includes tips of {formatCurrency(stats.tipsRevenue)}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Variable Cost Breakdown Dialog */}
      <Dialog open={variableCostDialogOpen} onOpenChange={setVariableCostDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Total Variable Cost Breakdown
            </DialogTitle>
            <DialogDescription>
              Total amount spent on variable items (ingredients)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">INGREDIENT PURCHASES</h4>
              {inventory.map((inv) => (
                <div key={inv.ingredientId} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <span>{inv.name}</span>
                  <span className="font-medium">
                    {formatCurrency(inv.totalCost)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="bg-primary/10 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Variable Cost</span>
                <span className="font-bold text-2xl text-red-600">{formatCurrency(stats.totalVarCost)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Sum of all ingredient purchases
              </p>
            </div>

            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p><strong>Note:</strong> This represents the total amount spent on variable items (ingredients), not the cost of goods sold (COGS) based on usage.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales Summary Dialog */}
      <Dialog open={salesDialogOpen} onOpenChange={setSalesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sales Summary
            </DialogTitle>
            <DialogDescription>
              Breakdown of sales by product
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">SALES BY PRODUCT</h4>
              {salesByProduct.map((product) => (
                <div key={product.name} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <p className="text-xs text-muted-foreground">{product.value} units</p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(product.revenue)}</span>
                    <p className="text-xs text-muted-foreground">
                      {product.value > 0 ? formatCurrency(product.revenue / product.value) : '0'} per unit
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="bg-primary/10 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total Sales</span>
                <span className="font-bold text-2xl text-blue-600">{stats.totalCups.toLocaleString()} units</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total units sold across all products
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                <span>Total Revenue</span>
                <span className="font-medium text-emerald-600">{formatCurrency(stats.grossRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                <span>Average Price per Unit</span>
                <span className="font-medium">
                  {stats.totalCups > 0 ? formatCurrency(stats.grossRevenue / stats.totalCups) : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Charts */}
      {(salesByProduct.length > 0 || salesOverTime.length > 0) && (
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
          {salesByProduct.length > 0 && (
            <DashboardChart
              title="Sales by Product"
              description="Distribution of units sold by product type"
              data={salesByProduct}
              type="pie"
            />
          )}
          {salesOverTime.length > 0 && (
            <DashboardChart
              title="Sales Over Time"
              description="Revenue and units sold over time"
              data={salesOverTime}
              type="line"
            />
          )}
        </div>
      )}

      {/* Ingredients Usage */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Coffee className="h-5 w-5" />
          Ingredients Usage
        </h3>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Strawberries Used</CardTitle>
              <Cherry className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.strawberriesUsedPcs.toLocaleString()} pcs</div>
              <p className="text-xs text-muted-foreground">{stats.strawberriesUsedG.toLocaleString()} g</p>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chocolate Used</CardTitle>
              <Coffee className="h-4 w-4 text-amber-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">{stats.chocolateUsedG.toLocaleString()} g</div>
              <p className="text-xs text-muted-foreground">Grams consumed</p>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kunafa Used</CardTitle>
              <Cookie className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.kunafaUsedG.toLocaleString()} g</div>
              <p className="text-xs text-muted-foreground">Grams consumed</p>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cups Used</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.cupsUsed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Packaging cups</p>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sticks Used</CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.sticksUsed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Units</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inventory Remaining */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Remaining
        </h3>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {inventory.map((inv) => {
            const isLow = inv.remaining < inv.totalPurchased * 0.2 && inv.remaining > 0;
            const isNegative = inv.remaining < 0;

            return (
              <Card 
                key={inv.ingredientId} 
                className={`transition-all hover:shadow-md ${isNegative ? 'border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20' : isLow ? 'border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{inv.name}</CardTitle>
                  {isNegative && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {!isNegative && isLow && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isNegative ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                    {inv.remaining.toLocaleString()} {inv.unit}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inv.totalPurchased > 0 
                      ? `${((inv.remaining / inv.totalPurchased) * 100).toFixed(0)}% of purchased`
                      : 'No purchases recorded'
                    }
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center pt-4">
        <Badge 
          variant={stats.netAfterFixed >= 0 ? "default" : "destructive"} 
          className={`text-sm px-6 py-2 ${stats.netAfterFixed >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25' : ''}`}
        >
          {stats.netAfterFixed >= 0 ? "✓ Profitable" : "⚠ Operating at Loss"}
        </Badge>
      </div>
    </div>
  );
}
