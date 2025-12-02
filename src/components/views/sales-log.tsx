'use client';

import { useState } from 'react';
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
import { ShoppingBag, Plus, Trash2, TrendingUp, TrendingDown, Target, Download } from 'lucide-react';
import { format } from 'date-fns';

export function SalesLog() {
  const { 
    state, 
    addSale, 
    deleteSale, 
    calculateCostPerCup,
    getStrawberryBatchForDate,
    formatCurrency, 
    isLoaded 
  } = useAppState();
  
  const [saleDate, setSaleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [error, setError] = useState('');

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
    const headers = ['Date', 'Product', 'Quantity', 'Unit Price', 'Revenue', 'Cost/Cup', 'Profit'];
    const rows = sortedSales.map(sale => {
      const product = state.products[sale.productId];
      const revenue = sale.qty * sale.unitPrice;
      const costPerCup = product ? calculateCostPerCup(product, sale.date) : 0;
      const profit = revenue - (sale.qty * costPerCup);
      return [
        sale.date,
        product?.name || sale.productId,
        sale.qty,
        sale.unitPrice.toFixed(2),
        revenue.toFixed(2),
        costPerCup.toFixed(2),
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
  
  let cumulativeRevenue = 0;
  let cumulativeProfit = 0;
  
  const salesWithCalculations = sortedSales.map((sale, index) => {
    const product = state.products[sale.productId];
    const revenue = sale.qty * sale.unitPrice;
    // Use the sale date to get the correct batch for cost calculation
    const costPerCup = product ? calculateCostPerCup(product, sale.date) : 0;
    const varCost = sale.qty * costPerCup;
    const profitBeforeFixed = revenue - varCost;
    
    cumulativeRevenue += revenue;
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

    return {
      sale,
      index: index + 1,
      product,
      revenue,
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
    };
  });

  // Reverse for display (newest first)
  const displaySales = [...salesWithCalculations].reverse();

  // Calculate preview cost using selected date
  const previewCost = productId && saleDate
    ? calculateCostPerCup(state.products[productId], saleDate)
    : 0;

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
            Add New Sale
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Record a new sale - costs use batch prices from sale date</CardDescription>
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
          <CardTitle className="text-base">Sales History</CardTitle>
          <CardDescription>
            {sortedSales.length} sale{sortedSales.length !== 1 ? 's' : ''} recorded with full P&L tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No sales recorded yet</p>
              <p className="text-sm mt-1">Add your first sale above to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Cups</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cost/Cup</TableHead>
                    <TableHead className="text-right">Var. Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Cum. Profit</TableHead>
                    <TableHead className="text-right">Net (Fixed)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">To Break-even</TableHead>
                    <TableHead className="text-right">🍓 g</TableHead>
                    <TableHead className="text-right">🍫 g</TableHead>
                    <TableHead className="text-right">Kunafa g</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displaySales.map((row) => (
                    <TableRow key={row.sale.id} className={`transition-colors ${row.isBreakeven ? 'bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                      <TableCell className="text-muted-foreground">{row.index}</TableCell>
                      <TableCell className="font-medium">{row.sale.date}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                            {row.product?.name || row.sale.productId}
                          </Badge>
                          {row.product?.useManualCost && (
                            <span className="text-[10px] text-orange-600">Manual cost</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row.sale.qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.sale.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {formatCurrency(row.costPerCup)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(row.varCost)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${row.profitBeforeFixed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(row.profitBeforeFixed)}
                      </TableCell>
                      <TableCell className={`text-right ${row.cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(row.cumulativeProfit)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${row.netAfterFixed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(row.netAfterFixed)}
                      </TableCell>
                      <TableCell>
                        {row.isBreakeven ? (
                          <Badge className="bg-green-500 flex items-center gap-1 w-fit">
                            <TrendingUp className="h-3 w-3" />
                            Break-even
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <TrendingDown className="h-3 w-3" />
                            Below
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={`text-right ${row.remainingToBreakeven > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {formatCurrency(row.remainingToBreakeven)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {row.strawberryG > 0 ? row.strawberryG.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {row.chocolateG > 0 ? row.chocolateG.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {row.kunafaG > 0 ? row.kunafaG.toLocaleString() : '-'}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {sortedSales.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(salesWithCalculations[salesWithCalculations.length - 1]?.cumulativeRevenue || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Profit (Before Fixed)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(salesWithCalculations[salesWithCalculations.length - 1]?.cumulativeProfit || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Fixed Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(fixedTotal)}
              </div>
            </CardContent>
          </Card>
          <Card className={salesWithCalculations[salesWithCalculations.length - 1]?.isBreakeven ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Break-even Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${salesWithCalculations[salesWithCalculations.length - 1]?.isBreakeven ? 'text-green-600' : 'text-amber-600'}`}>
                {salesWithCalculations[salesWithCalculations.length - 1]?.isBreakeven 
                  ? '✓ Achieved!'
                  : formatCurrency(salesWithCalculations[salesWithCalculations.length - 1]?.remainingToBreakeven || fixedTotal)
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {salesWithCalculations[salesWithCalculations.length - 1]?.isBreakeven 
                  ? 'Profitable zone reached'
                  : 'Remaining to break-even'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
