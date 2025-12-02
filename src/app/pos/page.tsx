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
  const { state, addSale, formatCurrency, isLoaded } = useAppState();
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
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
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

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {sellableProducts.map((product) => {
            const Icon = getProductIcon(product.id);
            const colorClass = getProductColor(product.id);
            const inOrder = order.find(item => item.productId === product.id);
            
            return (
              <button
                key={product.id}
                onClick={() => addToOrder(product.id)}
                className={`relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br ${colorClass} text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[120px] sm:min-h-[140px]`}
              >
                {inOrder && (
                  <div className="absolute -top-2 -right-2 h-8 w-8 bg-white text-foreground rounded-full flex items-center justify-center font-bold text-base shadow-lg border-2 border-current">
                    {inOrder.qty}
                  </div>
                )}
                <Icon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2" />
                <p className="font-bold text-base sm:text-lg">{product.name}</p>
                <p className="text-white/90 text-xl sm:text-2xl font-bold mt-1">
                  {product.price} AED
                </p>
              </button>
            );
          })}
        </div>

        {/* Current Order - Fixed at bottom on mobile */}
        <Card className="sticky bottom-4 shadow-xl border-2">
          <CardContent className="p-4">
            {order.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No items yet</p>
                <p className="text-sm">Tap products above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Order Items */}
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {order.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.unitPrice} AED each
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={() => updateQty(item.productId, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-lg">{item.qty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={() => updateQty(item.productId, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="font-bold w-20 text-right">
                          {item.qty * item.unitPrice} AED
                        </p>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive rounded-full"
                          onClick={() => removeFromOrder(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Actions */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
                      <p className="text-3xl font-bold">{totalAmount} AED</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="lg" onClick={clearOrder}>
                        Clear
                      </Button>
                      <Button 
                        size="lg"
                        onClick={submitOrder}
                        className="bg-emerald-600 hover:bg-emerald-700 gap-2 px-6"
                      >
                        <Send className="h-5 w-5" />
                        Submit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
    </div>
  );
}

