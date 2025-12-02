'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/use-app-state';
import { toast } from '@/components/ui/sonner';
import { ShoppingCart, Plus, Minus, Trash2, Send, Cherry, Cookie, Candy, Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from 'next-themes';

interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
}

export default function POSPage() {
  const { state, addSale, isLoaded } = useAppState();
  const [order, setOrder] = useState<OrderItem[]>([]);
  const { theme, setTheme } = useTheme();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
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

    // Add each item as a separate sale (marked as POS source for automatic fee calculation)
    for (const item of order) {
      const saleData = {
        date: today,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice,
        source: 'pos' as const, // Explicitly set as 'pos' type
      };
      await addSale(saleData);
    }

    toast.success('Order submitted!', {
      description: `${totalItems} item${totalItems > 1 ? 's' : ''} added`,
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Fixed */}
      <div className="p-4 pb-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">🍓</span> Berrylicious
            </h1>
            <p className="text-muted-foreground text-sm">Tap products to add</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Product Grid - Scrollable */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {sellableProducts.map((product) => {
              const Icon = getProductIcon(product.id);
              const colorClass = getProductColor(product.id);
              const inOrder = order.find(item => item.productId === product.id);
              
              return (
                <button
                  key={product.id}
                  onClick={() => addToOrder(product.id)}
                  className={`relative p-4 rounded-2xl bg-gradient-to-br ${colorClass} text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98] min-h-[100px]`}
                >
                  {inOrder && (
                    <div className="absolute -top-2 -right-2 h-7 w-7 bg-white text-foreground rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      {inOrder.qty}
                    </div>
                  )}
                  <Icon className="h-8 w-8 mx-auto mb-1" />
                  <p className="font-bold text-sm">{product.name}</p>
                  <p className="text-white/90 text-lg font-bold">
                    {product.price} AED
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart - Fixed at bottom */}
      <div className="p-4 pt-0">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-2">
            <CardContent className="p-3">
              {order.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-sm">No items yet</p>
                  <p className="text-xs">Tap products above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Order Items */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {order.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.unitPrice} AED each
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQty(item.productId, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQty(item.productId, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <p className="font-bold w-16 text-right text-sm">
                            {item.qty * item.unitPrice} AED
                          </p>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive rounded-full"
                            onClick={() => removeFromOrder(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total & Actions */}
                  <div className="border-t pt-2 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
                      <p className="text-2xl font-bold">{totalAmount} AED</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearOrder}>
                        Clear
                      </Button>
                      <Button 
                        size="sm"
                        onClick={submitOrder}
                        className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                      >
                        <Send className="h-4 w-4" />
                        Submit
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Footer */}
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
