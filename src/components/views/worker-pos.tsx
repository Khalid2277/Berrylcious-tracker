'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/use-app-state';
import { PageSkeleton } from '@/components/ui/loading-skeleton';
import { toast } from '@/components/ui/sonner';
import { ShoppingCart, Plus, Minus, Trash2, Send, Cherry, Cookie, Candy } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
}

export function WorkerPOS() {
  const { state, addSale, formatCurrency, isLoaded } = useAppState();
  const [order, setOrder] = useState<OrderItem[]>([]);

  if (!isLoaded) {
    return <PageSkeleton />;
  }

  // Get products that workers can sell (exclude tips)
  const sellableProducts = Object.values(state.products).filter(p => p.id !== 'tips');

  const addToOrder = (productId: string) => {
    const product = state.products[productId];
    if (!product) return;

    setOrder(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        productId,
        productName: product.name,
        qty: 1,
        unitPrice: product.price,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setOrder(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const removeFromOrder = (productId: string) => {
    setOrder(prev => prev.filter(item => item.productId !== productId));
  };

  const clearOrder = () => {
    setOrder([]);
  };

  const totalAmount = order.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const totalItems = order.reduce((sum, item) => sum + item.qty, 0);

  const submitOrder = async () => {
    if (order.length === 0) {
      toast.error('No items in order');
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');

    // Add each item as a separate sale
    for (const item of order) {
      await addSale({
        date: today,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice,
      });
    }

    toast.success('Order submitted!', {
      description: `${totalItems} item${totalItems > 1 ? 's' : ''} added to sales log`,
    });

    clearOrder();
  };

  const getProductIcon = (productId: string) => {
    switch (productId) {
      case 'normal':
      case 'kunafa':
        return Cherry;
      case 'cookies':
        return Cookie;
      default:
        return Candy;
    }
  };

  const getProductColor = (productId: string) => {
    switch (productId) {
      case 'normal':
        return 'from-rose-500 to-pink-500';
      case 'kunafa':
        return 'from-amber-500 to-orange-500';
      case 'rocky':
        return 'from-stone-600 to-stone-700';
      case 'cookies':
        return 'from-amber-600 to-yellow-600';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">Quick Sale</h2>
        <p className="text-muted-foreground mt-1">Tap products to add to order</p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {sellableProducts.map((product) => {
          const Icon = getProductIcon(product.id);
          const colorClass = getProductColor(product.id);
          const inOrder = order.find(item => item.productId === product.id);
          
          return (
            <button
              key={product.id}
              onClick={() => addToOrder(product.id)}
              className={`relative p-4 sm:p-6 rounded-2xl bg-gradient-to-br ${colorClass} text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              {inOrder && (
                <div className="absolute -top-2 -right-2 h-7 w-7 bg-white text-foreground rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {inOrder.qty}
                </div>
              )}
              <Icon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3" />
              <p className="font-bold text-sm sm:text-base">{product.name}</p>
              <p className="text-white/80 text-lg sm:text-xl font-bold mt-1">
                {formatCurrency(product.price)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Current Order */}
      <Card className="sticky bottom-4">
        <CardContent className="p-4">
          {order.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No items in order</p>
              <p className="text-sm">Tap products above to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Order Items */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {order.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between bg-muted/50 rounded-lg p-2 sm:p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{item.productName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQty(item.productId, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQty(item.productId, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="font-bold w-20 sm:w-24 text-right text-sm sm:text-base">
                        {formatCurrency(item.qty * item.unitPrice)}
                      </p>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeFromOrder(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Actions */}
              <div className="border-t pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearOrder}>
                      Clear
                    </Button>
                    <Button 
                      onClick={submitOrder}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Submit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

