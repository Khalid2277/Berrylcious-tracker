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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppState } from '@/hooks/use-app-state';
import { toast } from '@/components/ui/sonner';
import { PageSkeleton } from '@/components/ui/loading-skeleton';
import { Beef, Plus, Trash2, Package, AlertTriangle, Cherry, Download } from 'lucide-react';
import { format } from 'date-fns';

export function IngredientsView() {
  const { 
    state, 
    addIngredient,
    deleteIngredient,
    addIngredientBatch, 
    deleteIngredientBatch,
    addStrawberryBatch,
    deleteStrawberryBatch,
    getActiveStrawberryBatch,
    calculateInventory,
    formatCurrency, 
    isLoaded 
  } = useAppState();

  // New ingredient form
  const [newIngName, setNewIngName] = useState('');
  const [newIngUnit, setNewIngUnit] = useState<'g' | 'pcs' | 'units'>('g');
  const [newIngBulkQty, setNewIngBulkQty] = useState('');
  const [newIngBulkCost, setNewIngBulkCost] = useState('');

  // Ingredient batch form
  const [batchIngredientId, setBatchIngredientId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchDate, setBatchDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [batchQty, setBatchQty] = useState('');
  const [batchCost, setBatchCost] = useState('');

  // Strawberry batch form
  const [sbName, setSbName] = useState('');
  const [sbDate, setSbDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sbWeightKg, setSbWeightKg] = useState('');
  const [sbCost, setSbCost] = useState('');
  const [sbAvgWeight, setSbAvgWeight] = useState('20');

  if (!isLoaded) {
    return <PageSkeleton />;
  }

  const activeBatch = getActiveStrawberryBatch();
  const inventory = calculateInventory();

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;
    
    addIngredient({
      name: newIngName.trim(),
      unit: newIngUnit,
      defaultBulkQty: parseFloat(newIngBulkQty) || 0,
      defaultBulkCost: parseFloat(newIngBulkCost) || 0,
    });

    toast.success('Ingredient added', {
      description: `${newIngName.trim()} (${newIngUnit})`,
    });

    setNewIngName('');
    setNewIngUnit('g');
    setNewIngBulkQty('');
    setNewIngBulkCost('');
  };

  const handleDeleteIngredient = (ingredientId: string, ingredientName: string) => {
    deleteIngredient(ingredientId);
    toast.success('Ingredient deleted', {
      description: `Removed ${ingredientName}`,
    });
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchIngredientId || !batchQty || !batchCost) return;

    const ingredient = state.ingredients[batchIngredientId];
    addIngredientBatch({
      ingredientId: batchIngredientId,
      name: batchName || `${ingredient?.name || ''} - ${batchDate}`,
      date: batchDate,
      bulkQty: parseFloat(batchQty),
      bulkCost: parseFloat(batchCost),
    });

    toast.success('Batch added', {
      description: `${ingredient?.name || batchIngredientId} - ${formatCurrency(parseFloat(batchCost))}`,
    });

    setBatchIngredientId('');
    setBatchName('');
    setBatchQty('');
    setBatchCost('');
  };

  const handleDeleteBatch = (batchId: string, batchName: string) => {
    deleteIngredientBatch(batchId);
    toast.success('Batch deleted', {
      description: `Removed ${batchName}`,
    });
  };

  const handleAddStrawberryBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const weightKg = parseFloat(sbWeightKg);
    const cost = parseFloat(sbCost);
    const avgWeight = parseFloat(sbAvgWeight);

    if (isNaN(weightKg) || isNaN(cost) || isNaN(avgWeight)) return;

    addStrawberryBatch({
      name: sbName || `Batch - ${sbDate}`,
      date: sbDate,
      bulkWeightKg: weightKg,
      bulkWeightG: weightKg * 1000,
      bulkCost: cost,
      avgWeightPerStrawberry: avgWeight,
    });

    toast.success('Strawberry batch added', {
      description: `${sbName || sbDate} - ${weightKg}kg @ ${formatCurrency(cost)}`,
    });

    setSbName('');
    setSbWeightKg('');
    setSbCost('');
    setSbAvgWeight('20');
  };

  const handleDeleteStrawberryBatch = (batchId: string, batchName: string) => {
    deleteStrawberryBatch(batchId);
    toast.success('Strawberry batch deleted', {
      description: `Removed ${batchName}`,
    });
  };

  const exportInventoryToCSV = () => {
    const headers = ['Ingredient', 'Purchased', 'Used', 'Wasted', 'Remaining', 'Unit', 'Total Cost', 'Cost/Unit'];
    const rows = inventory.map(inv => [
      inv.name,
      inv.totalPurchased,
      inv.totalUsed,
      inv.totalWasted,
      inv.remaining,
      inv.unit,
      inv.totalCost.toFixed(2),
      inv.costPerUnit.toFixed(4),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berrylicious-inventory-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Export complete', {
      description: 'Inventory data downloaded as CSV',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
              <Beef className="h-5 w-5" />
            </div>
            Ingredients & Inventory
          </h2>
          <p className="text-muted-foreground mt-2">
            Manage ingredients, track batches, and monitor inventory levels
          </p>
        </div>
        <Button variant="outline" onClick={exportInventoryToCSV} className="shrink-0">
          <Download className="h-4 w-4 mr-2" />
          Export Inventory
        </Button>
      </div>

      {/* Active Strawberry Info */}
      {activeBatch && (
        <Card className="border-rose-200 bg-gradient-to-r from-rose-50/80 to-pink-50/80 dark:border-rose-900/50 dark:from-rose-950/30 dark:to-pink-950/30">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Cherry className="h-6 w-6 text-rose-500" />
              <div>
                <p className="font-medium text-rose-800 dark:text-rose-300">Active Strawberry Batch: {activeBatch.name}</p>
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  Cost per gram: {activeBatch.costPerGram.toFixed(4)} AED | 
                  Cost per strawberry: {formatCurrency(activeBatch.costPerStrawberry)} | 
                  Avg weight: {activeBatch.avgWeightPerStrawberry}g
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="strawberries">Strawberry Batches</TabsTrigger>
          <TabsTrigger value="batches">Other Batches</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Current Inventory Levels
              </CardTitle>
              <CardDescription>
                Real-time tracking of ingredient usage and remaining stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventory.map((inv) => {
                  const isLow = inv.remaining < inv.totalPurchased * 0.2;
                  const isNegative = inv.remaining < 0;

                  return (
                    <Card key={inv.ingredientId} className={`transition-all hover:shadow-md ${isNegative ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30' : isLow ? 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{inv.name}</CardTitle>
                          {isNegative && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {!isNegative && isLow && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Purchased</span>
                          <span>{inv.totalPurchased.toLocaleString()} {inv.unit}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Used</span>
                          <span className="text-blue-600">{inv.totalUsed.toLocaleString()} {inv.unit}</span>
                        </div>
                        {inv.totalWasted > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Wasted</span>
                            <span className="text-red-600">{inv.totalWasted.toLocaleString()} {inv.unit}</span>
                          </div>
                        )}
                        <div className="border-t pt-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Remaining</span>
                            <span className={isNegative ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}>
                              {inv.remaining.toLocaleString()} {inv.unit}
                            </span>
                          </div>
                        </div>
                        {inv.costPerUnit > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Cost per {inv.unit}: {inv.costPerUnit.toFixed(4)} AED
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strawberry Batches Tab */}
        <TabsContent value="strawberries" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-rose-50/80 to-pink-50/80 dark:from-rose-950/30 dark:to-pink-950/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Strawberry Batch
              </CardTitle>
              <CardDescription>
                Track strawberry purchases with weight-based costing
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddStrawberryBatch} className="grid gap-4 md:grid-cols-6">
                <div className="space-y-2">
                  <Label>Batch Name</Label>
                  <Input
                    value={sbName}
                    onChange={(e) => setSbName(e.target.value)}
                    placeholder="e.g. First Batch"
                    className="transition-colors focus:border-rose-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={sbDate}
                    onChange={(e) => setSbDate(e.target.value)}
                    className="transition-colors focus:border-rose-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sbWeightKg}
                    onChange={(e) => setSbWeightKg(e.target.value)}
                    placeholder="20"
                    className="transition-colors focus:border-rose-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sbCost}
                    onChange={(e) => setSbCost(e.target.value)}
                    placeholder="1600"
                    className="transition-colors focus:border-rose-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avg Weight/Strawberry (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    value={sbAvgWeight}
                    onChange={(e) => setSbAvgWeight(e.target.value)}
                    placeholder="20"
                    className="transition-colors focus:border-rose-500"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 transition-all hover:shadow-rose-500/40">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Batch
                  </Button>
                </div>
              </form>
              
              {sbWeightKg && sbCost && sbAvgWeight && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 animate-in fade-in-50 slide-in-from-bottom-4">
                  <p className="text-sm text-muted-foreground">Preview:</p>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Weight (g):</span>
                      <span className="ml-2 font-medium">{(parseFloat(sbWeightKg) * 1000).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost/gram:</span>
                      <span className="ml-2 font-medium">
                        {(parseFloat(sbCost) / (parseFloat(sbWeightKg) * 1000)).toFixed(4)} AED
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost/strawberry:</span>
                      <span className="ml-2 font-medium">
                        {((parseFloat(sbCost) / (parseFloat(sbWeightKg) * 1000)) * parseFloat(sbAvgWeight)).toFixed(2)} AED
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Strawberry Batches</CardTitle>
              <CardDescription>
                {state.strawberryBatches.length} batch{state.strawberryBatches.length !== 1 ? 'es' : ''} recorded
                (latest batch is used for cost calculations)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.strawberryBatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Cherry className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No strawberry batches yet</p>
                  <p className="text-sm mt-1">Add your first batch above!</p>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Weight (kg)</TableHead>
                        <TableHead className="text-right">Weight (g)</TableHead>
                        <TableHead className="text-right">Cost (AED)</TableHead>
                        <TableHead className="text-right">Avg Weight/pc (g)</TableHead>
                        <TableHead className="text-right">Cost/gram</TableHead>
                        <TableHead className="text-right">Cost/strawberry</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.strawberryBatches.map((batch, index) => {
                        const isActive = index === state.strawberryBatches.length - 1;
                        return (
                          <TableRow key={batch.id} className={`transition-colors ${isActive ? 'bg-rose-50 dark:bg-rose-950/30' : ''}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {batch.name}
                                {isActive && <Badge className="bg-rose-500">Active</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>{batch.date}</TableCell>
                            <TableCell className="text-right">{batch.bulkWeightKg}</TableCell>
                            <TableCell className="text-right">{batch.bulkWeightG.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{formatCurrency(batch.bulkCost)}</TableCell>
                            <TableCell className="text-right">{batch.avgWeightPerStrawberry}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{batch.costPerGram.toFixed(4)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(batch.costPerStrawberry)}</TableCell>
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
                                    <AlertDialogTitle>Delete this strawberry batch?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove &quot;{batch.name}&quot; from your strawberry batches. This may affect cost calculations for existing sales.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteStrawberryBatch(batch.id, batch.name)}
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
        </TabsContent>

        {/* Other Batches Tab */}
        <TabsContent value="batches" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Ingredient Batch/Purchase
              </CardTitle>
              <CardDescription>
                Record ingredient purchases to track inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddBatch} className="grid gap-4 md:grid-cols-6">
                <div className="space-y-2">
                  <Label>Ingredient</Label>
                  <Select value={batchIngredientId} onValueChange={setBatchIngredientId}>
                    <SelectTrigger className="transition-colors focus:border-amber-500">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(state.ingredients)
                        .filter(ing => ing.id !== 'strawberry')
                        .map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Batch Name (optional)</Label>
                  <Input
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. Week 1"
                    className="transition-colors focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="transition-colors focus:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={batchQty}
                    onChange={(e) => setBatchQty(e.target.value)}
                    placeholder="1000"
                    className="transition-colors focus:border-amber-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={batchCost}
                    onChange={(e) => setBatchCost(e.target.value)}
                    placeholder="78.50"
                    className="transition-colors focus:border-amber-500"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Batch
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingredient Batches</CardTitle>
              <CardDescription>
                {state.ingredientBatches.length} batch{state.ingredientBatches.length !== 1 ? 'es' : ''} recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.ingredientBatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No ingredient batches yet</p>
                  <p className="text-sm mt-1">Add purchases above!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Cost (AED)</TableHead>
                      <TableHead className="text-right">Cost/Unit</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.ingredientBatches.map((batch) => {
                      const ingredient = state.ingredients[batch.ingredientId];
                      const costPerUnit = batch.bulkQty > 0 ? batch.bulkCost / batch.bulkQty : 0;
                      
                      return (
                        <TableRow key={batch.id} className="transition-colors">
                          <TableCell className="font-medium">{ingredient?.name || batch.ingredientId}</TableCell>
                          <TableCell>{batch.name}</TableCell>
                          <TableCell>{batch.date}</TableCell>
                          <TableCell className="text-right">
                            {batch.bulkQty.toLocaleString()} {ingredient?.unit || ''}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(batch.bulkCost)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {costPerUnit.toFixed(4)} AED/{ingredient?.unit || 'unit'}
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
                                  <AlertDialogTitle>Delete this batch?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the batch &quot;{batch.name}&quot; from your inventory records.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBatch(batch.id, batch.name)}
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
        </TabsContent>

        {/* Ingredients Tab */}
        <TabsContent value="ingredients" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Ingredient
              </CardTitle>
              <CardDescription>
                Define a new ingredient type for tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddIngredient} className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newIngName}
                    onChange={(e) => setNewIngName(e.target.value)}
                    placeholder="e.g. Whipped Cream"
                    className="transition-colors focus:border-violet-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={newIngUnit} onValueChange={(v: 'g' | 'pcs' | 'units') => setNewIngUnit(v)}>
                    <SelectTrigger className="transition-colors focus:border-violet-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Bulk Qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newIngBulkQty}
                    onChange={(e) => setNewIngBulkQty(e.target.value)}
                    placeholder="1000"
                    className="transition-colors focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Bulk Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newIngBulkCost}
                    onChange={(e) => setNewIngBulkCost(e.target.value)}
                    placeholder="50"
                    className="transition-colors focus:border-violet-500"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Defined Ingredients</CardTitle>
              <CardDescription>
                {Object.keys(state.ingredients).length} ingredient{Object.keys(state.ingredients).length !== 1 ? 's' : ''} defined
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Default Bulk Qty</TableHead>
                    <TableHead className="text-right">Default Bulk Cost</TableHead>
                    <TableHead className="text-right">Default Cost/Unit</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(state.ingredients).map((ing) => {
                    const costPerUnit = ing.defaultBulkQty > 0 ? ing.defaultBulkCost / ing.defaultBulkQty : 0;
                    const isBuiltIn = ['cup', 'chocolate', 'kunafa', 'sticks', 'strawberry'].includes(ing.id);
                    
                    return (
                      <TableRow key={ing.id} className="transition-colors">
                        <TableCell className="font-medium">{ing.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ing.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{ing.defaultBulkQty.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ing.defaultBulkCost)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {costPerUnit.toFixed(4)} AED
                        </TableCell>
                        <TableCell>
                          {!isBuiltIn && (
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
                                  <AlertDialogTitle>Delete this ingredient?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove &quot;{ing.name}&quot; from your ingredients. Any existing batches for this ingredient will also be affected.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
