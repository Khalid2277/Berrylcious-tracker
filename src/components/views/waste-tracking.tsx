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
import { Trash, Plus, Trash2, AlertTriangle, Download } from 'lucide-react';
import { format } from 'date-fns';

export function WasteTracking() {
  const { 
    state, 
    addWasteEntry, 
    deleteWasteEntry,
    getIngredientCostPerUnit,
    getActiveStrawberryBatch,
    formatCurrency, 
    isLoaded 
  } = useAppState();

  const [wasteDate, setWasteDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [ingredientId, setIngredientId] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  if (!isLoaded) {
    return <PageSkeleton />;
  }

  const activeBatch = getActiveStrawberryBatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(qty);
    if (!ingredientId || isNaN(qtyNum) || qtyNum <= 0) return;

    let costPerUnit = 0;
    if (ingredientId === 'strawberry') {
      costPerUnit = activeBatch?.costPerGram || 0;
    } else {
      costPerUnit = getIngredientCostPerUnit(ingredientId);
    }

    const ingredient = ingredientId === 'strawberry'
      ? { name: 'Strawberry', unit: 'g' }
      : state.ingredients[ingredientId];

    addWasteEntry({
      date: wasteDate,
      ingredientId,
      qty: qtyNum,
      reason: reason.trim() || 'Spoiled/Expired',
      estimatedCost: qtyNum * costPerUnit,
    });

    toast.success('Waste recorded', {
      description: `${qtyNum} ${ingredient?.unit || ''} of ${ingredient?.name || ingredientId}`,
    });

    setIngredientId('');
    setQty('');
    setReason('');
  };

  const handleDeleteWaste = (entryId: string, ingredientName: string) => {
    deleteWasteEntry(entryId);
    toast.success('Waste entry deleted', {
      description: `Removed ${ingredientName} waste entry`,
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Ingredient', 'Quantity', 'Unit', 'Reason', 'Estimated Cost'];
    const rows = state.wasteEntries.map(entry => {
      const ingredient = entry.ingredientId === 'strawberry'
        ? { name: 'Strawberry', unit: 'g' }
        : state.ingredients[entry.ingredientId];
      return [
        entry.date,
        ingredient?.name || entry.ingredientId,
        entry.qty,
        ingredient?.unit || '',
        entry.reason,
        entry.estimatedCost.toFixed(2),
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berrylicious-waste-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Export complete', {
      description: 'Waste data downloaded as CSV',
    });
  };

  const totalWasteCost = state.wasteEntries.reduce((sum, w) => sum + w.estimatedCost, 0);

  // Group waste by ingredient
  const wasteByIngredient = state.wasteEntries.reduce((acc, w) => {
    const key = w.ingredientId;
    if (!acc[key]) {
      acc[key] = { qty: 0, cost: 0 };
    }
    acc[key].qty += w.qty;
    acc[key].cost += w.estimatedCost;
    return acc;
  }, {} as Record<string, { qty: number; cost: number }>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/25">
              <Trash className="h-5 w-5" />
            </div>
            Waste Tracking
          </h2>
          <p className="text-muted-foreground mt-2">
            Track spoiled or wasted ingredients to improve inventory accuracy
          </p>
        </div>
        {state.wasteEntries.length > 0 && (
          <Button variant="outline" onClick={exportToCSV} className="shrink-0">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Total Waste Summary */}
      {totalWasteCost > 0 && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:border-red-900/50 dark:from-red-950/30 dark:to-orange-950/30">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">-{formatCurrency(totalWasteCost)}</p>
              <p className="text-sm text-red-700 dark:text-red-400">Total waste value</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Waste Form */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-950/30 dark:to-orange-950/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Record Waste
          </CardTitle>
          <CardDescription>
            Track spoiled, expired, or wasted ingredients
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={wasteDate}
                onChange={(e) => setWasteDate(e.target.value)}
                className="transition-colors focus:border-red-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ingredient</Label>
              <Select value={ingredientId} onValueChange={setIngredientId}>
                <SelectTrigger className="transition-colors focus:border-red-500">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strawberry">Strawberry (g)</SelectItem>
                  {Object.values(state.ingredients)
                    .filter(ing => ing.id !== 'strawberry')
                    .map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Amount wasted"
                className="transition-colors focus:border-red-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Spoiled, Dropped"
                className="transition-colors focus:border-red-500"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-lg shadow-red-500/25 transition-all hover:shadow-red-500/40">
                <Plus className="h-4 w-4 mr-2" />
                Record
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Waste by Ingredient */}
      {Object.keys(wasteByIngredient).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(wasteByIngredient).map(([ingId, data]) => {
            const ingredient = ingId === 'strawberry' 
              ? { name: 'Strawberry', unit: 'g' }
              : state.ingredients[ingId];
            
            return (
              <Card key={ingId} className="border-red-100 dark:border-red-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{ingredient?.name || ingId}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-600">
                    {data.qty.toLocaleString()} {ingredient?.unit || ''}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Value: {formatCurrency(data.cost)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Waste Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Waste Log</CardTitle>
          <CardDescription>
            {state.wasteEntries.length} waste entr{state.wasteEntries.length !== 1 ? 'ies' : 'y'} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.wasteEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trash className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No waste entries recorded</p>
              <p className="text-sm mt-1">Hopefully it stays that way! 🎉</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...state.wasteEntries].reverse().map((entry) => {
                  const ingredient = entry.ingredientId === 'strawberry'
                    ? { name: 'Strawberry', unit: 'g' }
                    : state.ingredients[entry.ingredientId];
                  
                  return (
                    <TableRow key={entry.id} className="transition-colors">
                      <TableCell className="font-medium">{entry.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ingredient?.name || entry.ingredientId}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.qty.toLocaleString()} {ingredient?.unit || ''}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{entry.reason}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        -{formatCurrency(entry.estimatedCost)}
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
                              <AlertDialogTitle>Delete this waste entry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the waste entry for {entry.qty} {ingredient?.unit || ''} of {ingredient?.name || entry.ingredientId}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteWaste(entry.id, ingredient?.name || entry.ingredientId)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
