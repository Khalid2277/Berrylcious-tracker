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
import { Calculator, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export function FixedCostsView() {
  const { state, addFixedCost, deleteFixedCost, updateFixedCost, formatCurrency, isLoaded } = useAppState();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  if (!isLoaded) {
    return <PageSkeleton />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    
    if (!name.trim() || isNaN(amountNum)) return;

    addFixedCost({
      name: name.trim(),
      amount: amountNum,
    });

    toast.success('Fixed cost added', {
      description: `${name.trim()} - ${formatCurrency(amountNum)}`,
    });

    setName('');
    setAmount('');
  };

  const handleDelete = (costId: string, costName: string) => {
    deleteFixedCost(costId);
    toast.success('Fixed cost deleted', {
      description: `Removed ${costName}`,
    });
  };

  const startEditing = (cost: { id: string; name: string; amount: number }) => {
    setEditingId(cost.id);
    setEditName(cost.name);
    setEditAmount(cost.amount.toString());
  };

  const saveEdit = (costId: string) => {
    const amountNum = parseFloat(editAmount);
    if (!editName.trim() || isNaN(amountNum)) {
      toast.error('Invalid input', {
        description: 'Please enter a valid name and amount',
      });
      return;
    }

    updateFixedCost(costId, {
      name: editName.trim(),
      amount: amountNum,
    });

    toast.success('Fixed cost updated', {
      description: `${editName.trim()} - ${formatCurrency(amountNum)}`,
    });

    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditAmount('');
  };

  const totalFixedCosts = state.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25">
            <Calculator className="h-5 w-5" />
          </div>
          Fixed Costs
        </h2>
        <p className="text-muted-foreground mt-2">
          Track your fixed expenses like kiosk rental, equipment, and delivery costs
        </p>
      </div>

      {/* Add Fixed Cost Form */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Fixed Cost
          </CardTitle>
          <CardDescription>Record a new fixed expense</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-2 flex-1 w-full">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kiosk Rental"
                className="transition-colors focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-2 w-full sm:w-48">
              <Label htmlFor="amount">Amount (AED)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="transition-colors focus:border-blue-500"
                required
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40">
              <Plus className="h-4 w-4 mr-2" />
              Add Cost
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Fixed Costs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Fixed Costs List</CardTitle>
              <CardDescription>
                {state.fixedCosts.length} fixed cost{state.fixedCosts.length !== 1 ? 's' : ''} recorded
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 w-fit">
              Total: {formatCurrency(totalFixedCosts)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {state.fixedCosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No fixed costs recorded yet</p>
              <p className="text-sm mt-1">Add your first cost above to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Amount (AED)</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.fixedCosts.map((cost, index) => {
                  const percentage = totalFixedCosts > 0
                    ? ((cost.amount / totalFixedCosts) * 100).toFixed(1)
                    : '0.0';
                  const isEditing = editingId === cost.id;

                  return (
                    <TableRow key={cost.id} className="transition-colors">
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{cost.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-8 w-28 ml-auto text-right"
                          />
                        ) : (
                          <span className="font-medium">{formatCurrency(cost.amount)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">{percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => saveEdit(cost.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-blue-600 transition-colors"
                                onClick={() => startEditing(cost)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
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
                                    <AlertDialogTitle>Delete this fixed cost?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove &quot;{cost.name}&quot; ({formatCurrency(cost.amount)}) from your fixed costs. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(cost.id, cost.name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Fixed Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalFixedCosts)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Largest Expense</CardTitle>
          </CardHeader>
          <CardContent>
            {state.fixedCosts.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.max(...state.fixedCosts.map(c => c.amount)))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {state.fixedCosts.find(
                    c => c.amount === Math.max(...state.fixedCosts.map(c => c.amount))
                  )?.name}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No costs yet</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Number of Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.fixedCosts.length}</div>
            <p className="text-xs text-muted-foreground">Fixed cost entries</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
