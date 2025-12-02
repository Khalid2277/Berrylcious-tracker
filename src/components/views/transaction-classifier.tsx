'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { CreditCard, Plus, Trash2, Calculator, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react';
import { Transaction, TransactionClassifierState, ProductCombo } from '@/types';

// Product prices for combination finding
const PRODUCT_PRICES = {
  rocky: 55,
  dubai: 35,
  strawberry: 30,
  cookies: 15,
};

// Find all valid product combinations for a given amount
function findCombinations(amount: number): ProductCombo[] {
  const combos: ProductCombo[] = [];
  
  // R = Rocky, D = Dubai, S = Strawberry, C = Cookies
  const maxRocky = Math.floor(amount / PRODUCT_PRICES.rocky);
  
  for (let R = 0; R <= maxRocky; R++) {
    const remainingAfterR = amount - PRODUCT_PRICES.rocky * R;
    const maxDubai = Math.floor(remainingAfterR / PRODUCT_PRICES.dubai);
    
    for (let D = 0; D <= maxDubai; D++) {
      const remainingAfterD = remainingAfterR - PRODUCT_PRICES.dubai * D;
      const maxStrawberry = Math.floor(remainingAfterD / PRODUCT_PRICES.strawberry);
      
      for (let S = 0; S <= maxStrawberry; S++) {
        const remainingAfterS = remainingAfterD - PRODUCT_PRICES.strawberry * S;
        
        if (remainingAfterS < 0) continue;
        if (remainingAfterS % PRODUCT_PRICES.cookies !== 0) continue;
        
        const C = remainingAfterS / PRODUCT_PRICES.cookies;
        
        combos.push({
          rocky: R,
          dubai: D,
          strawberry: S,
          cookies: C,
        });
      }
    }
  }
  
  // Filter out empty combos
  return combos.filter(c => c.rocky + c.dubai + c.strawberry + c.cookies > 0);
}

// Convert combo to readable text
function comboToText(combo: ProductCombo): string {
  const parts: string[] = [];
  if (combo.rocky) parts.push(`${combo.rocky} × Rocky Road`);
  if (combo.strawberry) parts.push(`${combo.strawberry} × Strawberry`);
  if (combo.dubai) parts.push(`${combo.dubai} × Dubai Chocolate`);
  if (combo.cookies) parts.push(`${combo.cookies} × Cookies`);
  return parts.join(', ') || 'No products';
}

export function TransactionClassifier() {
  const { state: appState, formatCurrency, addSale, isLoaded } = useAppState();
  
  const [state, setState] = useState<TransactionClassifierState>({
    transactions: [],
    totals: { rocky: 0, strawberry: 0, dubai: 0, cookies: 0 },
  });

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [pendingCombos, setPendingCombos] = useState<ProductCombo[]>([]);

  if (!isLoaded) {
    return <PageSkeleton />;
  }

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingAmount(null);
    setPendingCombos([]);

    const amountNum = parseInt(amount, 10);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const combos = findCombinations(amountNum);

    if (combos.length === 0) {
      setError('No valid product combination for this amount.');
      toast.error('Invalid amount', {
        description: 'No product combination matches this amount',
      });
      return;
    } else if (combos.length === 1) {
      // Only one valid combo - add automatically
      addTransaction(amountNum, combos[0]);
      setAmount('');
    } else {
      // Multiple combos - let user choose
      setPendingAmount(amountNum);
      setPendingCombos(combos);
      toast.info(`${combos.length} combinations found`, {
        description: 'Please select the correct combination',
      });
    }
  };

  const addTransaction = (txAmount: number, combo: ProductCombo) => {
    const newTransaction: Transaction = {
      amount: txAmount,
      combo,
    };

    setState(prev => ({
      transactions: [...prev.transactions, newTransaction],
      totals: {
        rocky: prev.totals.rocky + combo.rocky,
        strawberry: prev.totals.strawberry + combo.strawberry,
        dubai: prev.totals.dubai + combo.dubai,
        cookies: prev.totals.cookies + combo.cookies,
      },
    }));

    toast.success('Transaction added', {
      description: comboToText(combo),
    });
  };

  const selectCombo = (index: number) => {
    if (pendingAmount === null || !pendingCombos[index]) return;
    
    addTransaction(pendingAmount, pendingCombos[index]);
    setPendingAmount(null);
    setPendingCombos([]);
    setAmount('');
  };

  const handleDeleteTransaction = (index: number) => {
    const transaction = state.transactions[index];
    setState(prev => ({
      transactions: prev.transactions.filter((_, i) => i !== index),
      totals: {
        rocky: prev.totals.rocky - transaction.combo.rocky,
        strawberry: prev.totals.strawberry - transaction.combo.strawberry,
        dubai: prev.totals.dubai - transaction.combo.dubai,
        cookies: prev.totals.cookies - transaction.combo.cookies,
      },
    }));

    toast.success('Transaction removed');
  };

  const handleClearAll = () => {
    setState({
      transactions: [],
      totals: { rocky: 0, strawberry: 0, dubai: 0, cookies: 0 },
    });
    setPendingAmount(null);
    setPendingCombos([]);

    toast.success('All transactions cleared');
  };

  const handleAddToSales = () => {
    const today = new Date().toISOString().split('T')[0];
    let addedCount = 0;
    
    // Add each product type as a sale
    if (state.totals.rocky > 0) {
      addSale({
        date: today,
        productId: 'rocky',
        qty: state.totals.rocky,
        unitPrice: appState.products.rocky?.price || 55,
      });
      addedCount++;
    }
    if (state.totals.strawberry > 0) {
      addSale({
        date: today,
        productId: 'normal',
        qty: state.totals.strawberry,
        unitPrice: appState.products.normal?.price || 30,
      });
      addedCount++;
    }
    if (state.totals.dubai > 0) {
      addSale({
        date: today,
        productId: 'kunafa',
        qty: state.totals.dubai,
        unitPrice: appState.products.kunafa?.price || 35,
      });
      addedCount++;
    }
    if (state.totals.cookies > 0) {
      addSale({
        date: today,
        productId: 'cookies',
        qty: state.totals.cookies,
        unitPrice: appState.products.cookies?.price || 15,
      });
      addedCount++;
    }

    // Clear transactions after adding to sales
    setState({
      transactions: [],
      totals: { rocky: 0, strawberry: 0, dubai: 0, cookies: 0 },
    });

    toast.success('Sales added', {
      description: `${addedCount} product type${addedCount !== 1 ? 's' : ''} added to Sales Log`,
    });
  };

  const totalAmount = state.transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalUnits = state.totals.rocky + state.totals.strawberry + state.totals.dubai + state.totals.cookies;

  // Calculate expected revenue based on prices
  const expectedRevenue = 
    (state.totals.rocky * (appState.products.rocky?.price || 55)) +
    (state.totals.strawberry * (appState.products.normal?.price || 30)) +
    (state.totals.dubai * (appState.products.kunafa?.price || 35)) +
    (state.totals.cookies * (appState.products.cookies?.price || 15));

  const difference = totalAmount - expectedRevenue;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <CreditCard className="h-5 w-5" />
          </div>
          Transaction Classifier
        </h2>
        <p className="text-muted-foreground mt-2">
          Enter transaction amounts and automatically classify into products
        </p>
      </div>

      {/* Add Transaction Form */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </CardTitle>
          <CardDescription>
            Enter the POS transaction amount - the system will find matching product combinations
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="amount">Transaction Amount (AED)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                    setPendingAmount(null);
                    setPendingCombos([]);
                  }}
                  placeholder="e.g. 70"
                  className="text-lg font-medium transition-colors focus:border-emerald-500"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </div>
            
            {/* Price Reference */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Rocky Road: 55 AED</span>
              <span className="bg-muted px-2 py-1 rounded">Dubai Chocolate: 35 AED</span>
              <span className="bg-muted px-2 py-1 rounded">Strawberry: 30 AED</span>
              <span className="bg-muted px-2 py-1 rounded">Cookies: 15 AED</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm animate-in fade-in-50">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </form>

          {/* Combo Chooser */}
          {pendingAmount !== null && pendingCombos.length > 1 && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 animate-in fade-in-50 slide-in-from-bottom-4">
              <p className="font-semibold text-amber-800 dark:text-amber-200 mb-3">
                Multiple combinations found for {pendingAmount} AED. Choose what was sold:
              </p>
              <div className="flex flex-wrap gap-2">
                {pendingCombos.map((combo, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    onClick={() => selectCombo(index)}
                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {comboToText(combo)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Transactions</CardTitle>
              <CardDescription>
                {state.transactions.length} transaction{state.transactions.length !== 1 ? 's' : ''} recorded
              </CardDescription>
            </div>
            {state.transactions.length > 0 && (
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all transactions?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all {state.transactions.length} transactions. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAll}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button 
                  size="sm" 
                  onClick={handleAddToSales}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Add to Sales Log
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {state.transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No transactions recorded yet</p>
              <p className="text-sm mt-1">Add a transaction above to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Breakdown</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.transactions.map((transaction, index) => (
                  <TableRow key={index} className="transition-colors">
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {transaction.combo.rocky > 0 && (
                          <Badge variant="secondary">
                            {transaction.combo.rocky} × Rocky Road
                          </Badge>
                        )}
                        {transaction.combo.strawberry > 0 && (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                            {transaction.combo.strawberry} × Strawberry
                          </Badge>
                        )}
                        {transaction.combo.dubai > 0 && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            {transaction.combo.dubai} × Dubai Choc
                          </Badge>
                        )}
                        {transaction.combo.cookies > 0 && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                            {transaction.combo.cookies} × Cookies
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleDeleteTransaction(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {state.transactions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total POS Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Expected Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(expectedRevenue)}</div>
              <p className="text-xs text-muted-foreground">Based on product prices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Difference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
              </div>
              <p className="text-xs text-muted-foreground">
                {difference > 0 ? 'Tips / Overpayment' : difference < 0 ? 'Discounts given' : 'Exact match'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnits}</div>
              <p className="text-xs text-muted-foreground">
                Products classified
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Totals */}
      {state.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Totals Sold
            </CardTitle>
            <CardDescription>Summary of classified products ready for sales log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Rocky Road</p>
                  <p className="text-xs text-muted-foreground">@ {formatCurrency(55)}</p>
                </div>
                <Badge variant="secondary" className="text-lg">{state.totals.rocky}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                <div>
                  <p className="font-medium">Strawberry Chocolate</p>
                  <p className="text-xs text-muted-foreground">@ {formatCurrency(30)}</p>
                </div>
                <Badge className="text-lg bg-rose-500">{state.totals.strawberry}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <div>
                  <p className="font-medium">Dubai Chocolate</p>
                  <p className="text-xs text-muted-foreground">@ {formatCurrency(35)}</p>
                </div>
                <Badge className="text-lg bg-amber-500">{state.totals.dubai}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <div>
                  <p className="font-medium">Cookies</p>
                  <p className="text-xs text-muted-foreground">@ {formatCurrency(15)}</p>
                </div>
                <Badge className="text-lg bg-orange-500">{state.totals.cookies}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
