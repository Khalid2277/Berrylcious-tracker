'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/hooks/use-app-state';
import { toast } from '@/components/ui/sonner';
import { PageSkeleton } from '@/components/ui/loading-skeleton';
import { ShoppingBag, Plus, Trash2, Target, Download, Filter, Store, Pencil } from 'lucide-react';
import { format } from 'date-fns';

export function SalesLog() {
  const { 
    state, 
    addSale, 
    deleteSale, 
    calculateCostPerCup,
    calculateInventory,
    getStrawberryBatchForDate,
    formatCurrency, 
    isLoaded 
  } = useAppState();
  
  const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Get unique dates from sales for filter - MUST be before early return
  const uniqueDates = useMemo(() => {
    if (!isLoaded) return [];
    const dates = [...new Set(state.sales.map(s => s.date))].sort().reverse();
    return dates;
  }, [state.sales, isLoaded]);

  if (!isLoaded) {
    return <PageSkeleton />;
  }

  const fixedTotal = state.fixedCosts.reduce((sum, c) => sum + c.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qtyNum = parseInt(qty, 10);
    const priceNum = parseFloat(unitPrice);

    if (!saleDate || !productId || !qty || qtyNum <= 0 || isNaN(priceNum)) {
      setError('Please fill all fields correctly.');
      return;
    }

    const product = state.products[productId];
    addSale({
      date: saleDate,
      productId,
      qty: qtyNum,
      unitPrice: priceNum,
      source: 'manual', // Manual entry from sales log
    });

    toast.success('Sale recorded', {
      description: `${qtyNum}x ${product?.name || productId} @ ${formatCurrency(priceNum)}`,
    });

    setProductId('');
    setQty('');
    setUnitPrice('');
  };

  const handleDeleteSale = (saleId: string, productName: string) => {
    deleteSale(saleId);
    toast.success('Sale deleted', {
      description: `Removed ${productName} from sales log`,
    });
  };

  const handleProductChange = (value: string) => {
    setProductId(value);
    const product = state.products[value];
    if (product) {
      setUnitPrice(product.price.toString());
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Product', 'Quantity', 'Unit Price', 'Revenue', 'Source', 'POS Fee', 'Net Revenue', 'Cost', 'Profit'];
    const rows = sortedSales.map(sale => {
      const product = state.products[sale.productId];
      const revenue = sale.qty * sale.unitPrice;
      const costPerCup = product ? calculateCostPerCup(product, sale.date) : 0;
      const posFee = sale.source === 'pos' ? (1 + revenue * 0.026) : 0;
      const netRevenue = revenue - posFee;
      const cost = sale.qty * costPerCup;
      const profit = netRevenue - cost;
      return [
        sale.date,
        product?.name || sale.productId,
        sale.qty,
        sale.unitPrice.toFixed(2),
        revenue.toFixed(2),
        sale.source || 'manual',
        posFee.toFixed(2),
        netRevenue.toFixed(2),
        cost.toFixed(2),
        profit.toFixed(2),
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berrylicious-sales-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Export complete', {
      description: 'Sales data downloaded as CSV',
    });
  };

  // Sort sales by date ascending for cumulative calculation
  const sortedSales = [...state.sales].sort((a, b) => a.date.localeCompare(b.date));
  
  // Group POS sales by transactionId to calculate fees per transaction
  // If transactionId exists, group by it. If not, treat each sale as its own transaction.
  const posTransactions = new Map<string, { sales: typeof sortedSales; totalRevenue: number }>();
  sortedSales.forEach(sale => {
    if (sale.source === 'pos') {
      // Use transactionId if available, otherwise use sale.id as unique identifier
      const transactionKey = sale.transactionId || sale.id;
      
      if (!posTransactions.has(transactionKey)) {
        posTransactions.set(transactionKey, { sales: [], totalRevenue: 0 });
      }
      const transaction = posTransactions.get(transactionKey)!;
      transaction.sales.push(sale);
      transaction.totalRevenue += sale.qty * sale.unitPrice;
    }
  });
  
  // Calculate fee per transaction: AED 1 + 2.6% of total transaction revenue
  const transactionFees = new Map<string, number>();
  posTransactions.forEach((transaction, transactionId) => {
    const fee = 1 + (transaction.totalRevenue * 0.026);
    transactionFees.set(transactionId, fee);
  });
  
  // Track which transactions have had their fee applied (to show fee only on first item)
  const transactionFeeApplied = new Set<string>();
  
  let cumulativeRevenue = 0;
  let cumulativeProfit = 0;
  
  const salesWithCalculations = sortedSales.map((sale, index) => {
    const product = state.products[sale.productId];
    const revenue = sale.qty * sale.unitPrice;
    
    // Calculate auto POS fee: only once per transaction, shown on first item
    let autoPosFee = 0;
    if (sale.source === 'pos') {
      // Use transactionId if available, otherwise use sale.id as unique identifier
      const transactionKey = sale.transactionId || sale.id;
      const transactionFee = transactionFees.get(transactionKey) || 0;
      // Show fee only on the first sale of each transaction
      if (!transactionFeeApplied.has(transactionKey)) {
        autoPosFee = transactionFee;
        transactionFeeApplied.add(transactionKey);
      }
    }
    
    const netRevenue = revenue - autoPosFee;
    
    // Use the sale date to get the correct batch for cost calculation
    const costPerCup = product ? calculateCostPerCup(product, sale.date) : 0;
    const varCost = sale.qty * costPerCup;
    const profitBeforeFixed = netRevenue - varCost;
    
    cumulativeRevenue += netRevenue;
    cumulativeProfit += profitBeforeFixed;
    
    const netAfterFixed = cumulativeProfit - fixedTotal;
    const isBreakeven = netAfterFixed >= 0;
    const remainingToBreakeven = isBreakeven ? 0 : Math.abs(netAfterFixed);
    
    // Get the batch used for this sale to show avg weight
    const batch = getStrawberryBatchForDate(sale.date);
    const avgWeight = batch?.avgWeightPerStrawberry || 20;
    
    // Calculate ingredient usage (only for products using ingredients)
    let strawberryG = 0;
    let chocolateG = 0;
    let kunafaG = 0;
    
    if (product && !product.useManualCost) {
      strawberryG = sale.qty * product.strawberriesPerCup * avgWeight;
      chocolateG = sale.qty * product.chocolatePerCup;
      kunafaG = sale.qty * product.kunafaPerCup;
    }

    // Determine if this is the first item in a transaction
    const transactionKey = sale.source === 'pos' ? (sale.transactionId || sale.id) : null;
    const isFirstInTransaction = transactionKey && !transactionFeeApplied.has(transactionKey);
    
    return {
      sale,
      index: index + 1,
      product,
      revenue,
      autoPosFee,
      netRevenue,
      costPerCup,
      varCost,
      profitBeforeFixed,
      cumulativeRevenue,
      cumulativeProfit,
      netAfterFixed,
      isBreakeven,
      remainingToBreakeven,
      strawberryG,
      chocolateG,
      kunafaG,
      batchUsed: batch?.name || 'Default',
      transactionKey, // Store transaction key for grouping display
      isFirstInTransaction, // Flag to show transaction indicator
    };
  });

  // Filter by date
  const filteredSales = dateFilter === 'all' 
    ? salesWithCalculations 
    : salesWithCalculations.filter(s => s.sale.date === dateFilter);

  // Reverse for display (newest first)
  const displaySales = [...filteredSales].reverse();
  
  // Count items per transaction to identify multi-item transactions
  const transactionCounts = new Map<string, number>();
  displaySales.forEach((row) => {
    if (row.transactionKey && row.sale.source === 'pos') {
      const count = transactionCounts.get(row.transactionKey) || 0;
      transactionCounts.set(row.transactionKey, count + 1);
    }
  });
  
  // Track which transactions we've seen to identify first item in each transaction
  const seenTransactions = new Set<string>();

  // Calculate preview cost using selected date
  const previewCost = productId && saleDate
    ? calculateCostPerCup(state.products[productId], saleDate)
    : 0;

  // Calculate totals for filtered view
  const filteredTotalRevenue = filteredSales.reduce((sum, s) => sum + s.netRevenue, 0);
  const filteredTotalPosFees = filteredSales.reduce((sum, s) => sum + s.autoPosFee, 0);
  
  // Total Variable Cost = sum of all ingredient purchases (not COGS)
  const inventory = calculateInventory();
  const filteredTotalCost = inventory.reduce((sum, inv) => sum + inv.totalCost, 0);
  
  const filteredTotalProfit = filteredSales.reduce((sum, s) => sum + s.profitBeforeFixed, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          Sales Log
        </h2>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Track daily sales with auto-calculated costs
          </p>
        </div>
        {sortedSales.length > 0 && (
          <Button variant="outline" onClick={exportToCSV} className="shrink-0 w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Add Sale Form */}
      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Sale (Manual)
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Manual entries don't have auto POS fees</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="transition-colors focus:border-rose-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={productId} onValueChange={handleProductChange}>
                <SelectTrigger id="product" className="w-full transition-colors focus:border-rose-500">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-50">
                  {Object.values(state.products).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({formatCurrency(product.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Cups Sold</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                className="transition-colors focus:border-rose-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Unit Price (AED)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="transition-colors focus:border-rose-500"
                required
              />
            </div>
            <div className="flex items-end col-span-2 md:col-span-1">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Sale
              </Button>
            </div>
          </form>
          {error && <p className="text-sm text-destructive mt-2 animate-in fade-in-50">{error}</p>}
          
          {/* Preview when product is selected */}
          {productId && qty && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 animate-in fade-in-50 slide-in-from-bottom-4">
              <p className="text-sm text-muted-foreground mb-2">Preview (using batch for {saleDate}):</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {formatCurrency(parseInt(qty) * parseFloat(unitPrice || '0'))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {formatCurrency(parseInt(qty) * previewCost)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Profit:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(
                      (parseInt(qty) * parseFloat(unitPrice || '0')) - 
                      (parseInt(qty) * previewCost)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost/Cup:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(previewCost)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
          <CardTitle className="text-base">Sales History</CardTitle>
          <CardDescription>
                {displaySales.length} sale{displaySales.length !== 1 ? 's' : ''} 
                {dateFilter !== 'all' && ` on ${dateFilter}`}
          </CardDescription>
            </div>
            
            {/* Date Filter */}
            {uniqueDates.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    {uniqueDates.map(date => (
                      <SelectItem key={date} value={date}>{date}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No sales recorded yet</p>
              <p className="text-sm mt-1">Add your first sale above to get started!</p>
            </div>
          ) : displaySales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-medium">No sales on this date</p>
              <p className="text-sm mt-1">Select a different date or "All dates"</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">POS Fee</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displaySales.map((row, displayIndex) => {
                    // Check if this is part of a multi-item transaction group
                    const transactionRowCount = row.transactionKey && row.sale.source === 'pos'
                      ? transactionCounts.get(row.transactionKey) || 0
                      : 0;
                    const isMultiItemTransaction = transactionRowCount > 1;
                    const isFirstInGroup = isMultiItemTransaction && !seenTransactions.has(row.transactionKey!);
                    if (isFirstInGroup) {
                      seenTransactions.add(row.transactionKey!);
                    }
                    
                    return (
                    <TableRow 
                      key={row.sale.id} 
                      className={`transition-colors ${
                        row.isBreakeven ? 'bg-green-50/50 dark:bg-green-950/20' : ''
                      } ${
                        isMultiItemTransaction ? 'border-l-2 border-l-emerald-400 dark:border-l-emerald-600' : ''
                      } ${
                        isFirstInGroup ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {isFirstInGroup ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{row.index}</span>
                            <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {transactionRowCount} items
                            </span>
                          </div>
                        ) : (
                          row.index
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{row.sale.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                            {row.product?.name || row.sale.productId}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        {row.sale.source === 'pos' ? (
                          <Badge variant="outline" className="text-xs gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                            <Store className="h-3 w-3" />
                            POS
                            {isFirstInGroup && (
                              <span className="ml-1 text-[10px]">({transactionRowCount})</span>
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
                            <Pencil className="h-3 w-3" />
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{row.sale.qty}</TableCell>
                      <TableCell className="text-right font-medium text-green-600 text-sm">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.autoPosFee > 0 ? (
                          <span className="text-orange-600">-{formatCurrency(row.autoPosFee)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-red-600 text-sm">
                        {formatCurrency(row.varCost)}
                      </TableCell>
                      <TableCell className={`text-right font-medium text-sm ${row.profitBeforeFixed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(row.profitBeforeFixed)}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the sale of {row.sale.qty}x {row.product?.name || row.sale.productId} on {row.sale.date}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSale(row.sale.id, row.product?.name || row.sale.productId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {displaySales.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {dateFilter !== 'all' ? 'Day Revenue' : 'Total Revenue'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredTotalRevenue)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Auto POS Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(filteredTotalPosFees)}
              </div>
              <p className="text-xs text-muted-foreground">AED 1 + 2.6%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Variable Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(filteredTotalCost)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {dateFilter !== 'all' ? 'Day Profit' : 'Total Profit'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${filteredTotalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(filteredTotalProfit)}
              </div>
            </CardContent>
          </Card>
          
          <Card className={salesWithCalculations[salesWithCalculations.length - 1]?.isBreakeven ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Break-even
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${salesWithCalculations[salesWithCalculations.length - 1]?.isBreakeven ? 'text-green-600' : 'text-amber-600'}`}>
                {salesWithCalculations[salesWithCalculations.length - 1]?.isBreakeven 
                  ? '✓ Yes!'
                  : formatCurrency(salesWithCalculations[salesWithCalculations.length - 1]?.remainingToBreakeven || fixedTotal)
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

