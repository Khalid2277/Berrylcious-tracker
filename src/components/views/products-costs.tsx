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
import { Package, Percent, Save, Plus, Info, Trash2, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';

export function ProductsCosts() {
  const { 
    state, 
    updatePosFeePercent,
    updatePosFeeManual,
    updateUseManualPosFee,
    updateProduct,
    addProduct,
    deleteProduct,
    calculateCostPerCup,
    getActiveStrawberryBatch,
    getIngredientCostPerUnit,
    formatCurrency, 
    isLoaded 
  } = useAppState();
  
  const [posFee, setPosFee] = useState(state.posFeePercent.toString());
  const [posFeeManualInput, setPosFeeManualInput] = useState(state.posFeeManual.toString());
  
  // New product form
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUseManual, setNewUseManual] = useState(false);
  const [newManualCost, setNewManualCost] = useState('');
  const [newStrawberries, setNewStrawberries] = useState('0');
  const [newChocolate, setNewChocolate] = useState('0');
  const [newKunafa, setNewKunafa] = useState('0');
  const [newCups, setNewCups] = useState('1');
  const [newSticks, setNewSticks] = useState('1');

  if (!isLoaded) {
    return <PageSkeleton />;
  }

  const activeBatch = getActiveStrawberryBatch();

  const handleSavePosFee = () => {
    const value = parseFloat(posFee);
    updatePosFeePercent(!isNaN(value) && value >= 0 ? value : 0);
    toast.success('POS fee updated', {
      description: `Set to ${value}% of revenue`,
    });
  };

  const handleSaveManualPosFee = () => {
    const value = parseFloat(posFeeManualInput);
    updatePosFeeManual(!isNaN(value) && value >= 0 ? value : 0);
    toast.success('POS fee updated', {
      description: `Set to ${formatCurrency(value)} manual deduction`,
    });
  };

  const handleProductChange = (productId: string, field: string, value: string | boolean) => {
    if (typeof value === 'boolean') {
      updateProduct(productId, { [field]: value });
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updateProduct(productId, { [field]: numValue });
      }
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    deleteProduct(productId);
    toast.success('Product deleted', {
      description: `Removed ${productName}`,
    });
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    addProduct({
      name: newName.trim(),
      price: parseFloat(newPrice),
      useManualCost: newUseManual,
      manualCostPerCup: parseFloat(newManualCost) || 0,
      strawberriesPerCup: newUseManual ? 0 : parseFloat(newStrawberries) || 0,
      chocolatePerCup: newUseManual ? 0 : parseFloat(newChocolate) || 0,
      kunafaPerCup: newUseManual ? 0 : parseFloat(newKunafa) || 0,
      cupsPerCup: newUseManual ? 0 : parseFloat(newCups) || 0,
      sticksPerCup: newUseManual ? 0 : parseFloat(newSticks) || 0,
    });

    toast.success('Product added', {
      description: `${newName.trim()} @ ${formatCurrency(parseFloat(newPrice))}`,
    });

    setNewName('');
    setNewPrice('');
    setNewUseManual(false);
    setNewManualCost('');
    setNewStrawberries('0');
    setNewChocolate('0');
    setNewKunafa('0');
    setNewCups('1');
    setNewSticks('1');
  };

  // Get ingredient costs for display
  const cupCost = getIngredientCostPerUnit('cup');
  const chocolateCost = getIngredientCostPerUnit('chocolate');
  const kunafaCost = getIngredientCostPerUnit('kunafa');
  const sticksCost = getIngredientCostPerUnit('sticks');
  const strawberryCostPerPiece = activeBatch?.costPerStrawberry || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
            <Package className="h-5 w-5" />
          </div>
          Products & Costs
        </h2>
        <p className="text-muted-foreground mt-2">
          Manage products with auto-calculated or manual costs
        </p>
      </div>

      {/* Active Ingredient Costs Info */}
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-purple-950/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-violet-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-violet-800 dark:text-violet-300">Current Ingredient Costs (for auto-calculation)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Strawberry:</span>
                  <span className="ml-1 font-medium">{formatCurrency(strawberryCostPerPiece)}/pc</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Chocolate:</span>
                  <span className="ml-1 font-medium">{chocolateCost.toFixed(4)} AED/g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kunafa:</span>
                  <span className="ml-1 font-medium">{kunafaCost.toFixed(4)} AED/g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cup:</span>
                  <span className="ml-1 font-medium">{formatCurrency(cupCost)}/unit</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sticks:</span>
                  <span className="ml-1 font-medium">{formatCurrency(sticksCost)}/unit</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POS Fee Card */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            POS Fee Configuration
          </CardTitle>
          <CardDescription>
            Set POS fees as a percentage of revenue OR enter a manual total amount
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle between percentage and manual */}
          <div className="flex flex-wrap items-center gap-4">
            <Label>Fee Type:</Label>
            <Button
              variant="outline"
              size="sm"
              className={`transition-all ${!state.useManualPosFee ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : ''}`}
              onClick={() => {
                updateUseManualPosFee(false);
                toast.info('Using percentage-based POS fee');
              }}
            >
              <Percent className="h-4 w-4 mr-2" />
              Percentage
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`transition-all ${state.useManualPosFee ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : ''}`}
              onClick={() => {
                updateUseManualPosFee(true);
                toast.info('Using manual POS fee amount');
              }}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Manual Amount
            </Button>
          </div>

          {/* Percentage input */}
          {!state.useManualPosFee && (
            <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
              <div className="space-y-2 flex-1 w-full">
                <Label htmlFor="posFee">POS Fee (%)</Label>
                <Input
                  id="posFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={posFee}
                  onChange={(e) => setPosFee(e.target.value)}
                  className="transition-colors focus:border-violet-500"
                />
              </div>
              <Button onClick={handleSavePosFee} className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}

          {/* Manual amount input */}
          {state.useManualPosFee && (
            <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
              <div className="space-y-2 flex-1 w-full">
                <Label htmlFor="posFeeManual">Total POS Fee Deduction (AED)</Label>
                <Input
                  id="posFeeManual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={posFeeManualInput}
                  onChange={(e) => setPosFeeManualInput(e.target.value)}
                  placeholder="e.g. 229.50"
                  className="transition-colors focus:border-orange-500"
                />
              </div>
              <Button 
                onClick={handleSaveManualPosFee}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {state.useManualPosFee 
              ? <>Current: <span className="font-medium text-orange-600">{formatCurrency(state.posFeeManual)}</span> (manual entry)</>
              : <>Current rate: <span className="font-medium">{state.posFeePercent}%</span> of revenue</>
            }
          </p>
        </CardContent>
      </Card>

      {/* Add Product Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Product
          </CardTitle>
          <CardDescription>
            Define a new product - choose between manual cost or ingredient-based calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Product name"
                  className="transition-colors focus:border-violet-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="30"
                  className="transition-colors focus:border-violet-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cost Type</Label>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full justify-start transition-all ${newUseManual ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-green-500 bg-green-50 dark:bg-green-950/30'}`}
                  onClick={() => setNewUseManual(!newUseManual)}
                >
                  {newUseManual ? (
                    <>
                      <ToggleRight className="h-4 w-4 mr-2 text-orange-600" />
                      <span className="text-orange-700 dark:text-orange-400">Manual Cost</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-green-700 dark:text-green-400">From Ingredients</span>
                    </>
                  )}
                </Button>
              </div>
              {newUseManual && (
                <div className="space-y-2">
                  <Label>Cost per Unit (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newManualCost}
                    onChange={(e) => setNewManualCost(e.target.value)}
                    placeholder="7.67"
                    className="transition-colors focus:border-orange-500"
                    required={newUseManual}
                  />
                </div>
              )}
            </div>
            
            {!newUseManual && (
              <div className="grid gap-4 md:grid-cols-5 pt-2">
                <div className="space-y-2">
                  <Label>Strawberries (pcs)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newStrawberries}
                    onChange={(e) => setNewStrawberries(e.target.value)}
                    className="transition-colors focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chocolate (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newChocolate}
                    onChange={(e) => setNewChocolate(e.target.value)}
                    className="transition-colors focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kunafa (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newKunafa}
                    onChange={(e) => setNewKunafa(e.target.value)}
                    className="transition-colors focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cups</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newCups}
                    onChange={(e) => setNewCups(e.target.value)}
                    className="transition-colors focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sticks</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newSticks}
                    onChange={(e) => setNewSticks(e.target.value)}
                    className="transition-colors focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Configuration</CardTitle>
          <CardDescription>
            Toggle between manual cost (for supplier products) or ingredient-based calculation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price (AED)</TableHead>
                  <TableHead className="text-center">Cost Type</TableHead>
                  <TableHead className="text-right">Manual Cost</TableHead>
                  <TableHead className="text-right">🍓 pcs</TableHead>
                  <TableHead className="text-right">🍫 g</TableHead>
                  <TableHead className="text-right">Kunafa g</TableHead>
                  <TableHead className="text-right">Cups</TableHead>
                  <TableHead className="text-right">Sticks</TableHead>
                  <TableHead className="text-right">Cost/Cup</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(state.products).map((product) => {
                  const costPerCup = calculateCostPerCup(product);
                  const profitPerCup = product.price - costPerCup;
                  const margin = product.price > 0
                    ? ((profitPerCup / product.price) * 100).toFixed(1)
                    : '0.0';
                  const isBuiltIn = ['normal', 'kunafa', 'rocky', 'tips', 'cookies'].includes(product.id);

                  return (
                    <TableRow key={product.id} className="transition-colors">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-20 ml-auto text-right h-8"
                          defaultValue={product.price}
                          onBlur={(e) => handleProductChange(product.id, 'price', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2 transition-colors ${product.useManualCost ? 'text-orange-600' : 'text-green-600'}`}
                          onClick={() => handleProductChange(product.id, 'useManualCost', !product.useManualCost)}
                        >
                          {product.useManualCost ? (
                            <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/30">
                              Manual
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30">
                              Auto
                            </Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`w-20 ml-auto text-right h-8 transition-opacity ${!product.useManualCost ? 'opacity-30' : ''}`}
                          defaultValue={product.manualCostPerCup || 0}
                          disabled={!product.useManualCost}
                          onBlur={(e) => handleProductChange(product.id, 'manualCostPerCup', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          className={`w-14 ml-auto text-right h-8 transition-opacity ${product.useManualCost ? 'opacity-30' : ''}`}
                          defaultValue={product.strawberriesPerCup}
                          disabled={product.useManualCost}
                          onBlur={(e) => handleProductChange(product.id, 'strawberriesPerCup', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          className={`w-14 ml-auto text-right h-8 transition-opacity ${product.useManualCost ? 'opacity-30' : ''}`}
                          defaultValue={product.chocolatePerCup}
                          disabled={product.useManualCost}
                          onBlur={(e) => handleProductChange(product.id, 'chocolatePerCup', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          className={`w-14 ml-auto text-right h-8 transition-opacity ${product.useManualCost ? 'opacity-30' : ''}`}
                          defaultValue={product.kunafaPerCup}
                          disabled={product.useManualCost}
                          onBlur={(e) => handleProductChange(product.id, 'kunafaPerCup', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          className={`w-12 ml-auto text-right h-8 transition-opacity ${product.useManualCost ? 'opacity-30' : ''}`}
                          defaultValue={product.cupsPerCup}
                          disabled={product.useManualCost}
                          onBlur={(e) => handleProductChange(product.id, 'cupsPerCup', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          className={`w-12 ml-auto text-right h-8 transition-opacity ${product.useManualCost ? 'opacity-30' : ''}`}
                          defaultValue={product.sticksPerCup}
                          disabled={product.useManualCost}
                          onBlur={(e) => handleProductChange(product.id, 'sticksPerCup', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatCurrency(costPerCup)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${profitPerCup >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(profitPerCup)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`${
                          parseFloat(margin) >= 50
                            ? 'bg-green-500'
                            : parseFloat(margin) >= 25
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}>
                          {margin}%
                        </Badge>
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
                                <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove &quot;{product.name}&quot; from your products. Any existing sales with this product will remain but may show incorrect data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProduct(product.id, product.name)}
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
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Highest Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {formatCurrency(Math.max(...Object.values(state.products).map(p => p.price)))}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.values(state.products).find(
                p => p.price === Math.max(...Object.values(state.products).map(p => p.price))
              )?.name}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Best Margin Product</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const products = Object.values(state.products).filter(p => p.price > 0);
              const margins = products.map(p => ({
                product: p,
                margin: ((p.price - calculateCostPerCup(p)) / p.price) * 100
              }));
              const best = margins.reduce((a, b) => a.margin > b.margin ? a : b, margins[0]);
              return best ? (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {best.margin.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">{best.product.name}</p>
                </>
              ) : <p className="text-muted-foreground">No products</p>;
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Average Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(Object.values(state.products)
                .filter(p => p.price > 0)
                .reduce((sum, p) => {
                  const cost = calculateCostPerCup(p);
                  return sum + ((p.price - cost) / p.price * 100);
                }, 0) /
                Object.values(state.products).filter(p => p.price > 0).length
              ).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
