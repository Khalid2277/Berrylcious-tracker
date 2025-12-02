'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AppState, 
  Product, 
  Sale, 
  FixedCost, 
  Ingredient, 
  IngredientBatch,
  StrawberryBatch,
  WasteEntry,
  DashboardStats,
  IngredientUsage,
  IngredientInventory
} from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import * as db from '@/lib/database';

const STORAGE_KEY = 'berryDashboard_v4';

const defaultIngredients: Record<string, Ingredient> = {
  cup: { id: 'cup', name: 'Cup', unit: 'units', defaultBulkQty: 50, defaultBulkCost: 61.5 },
  chocolate: { id: 'chocolate', name: 'Chocolate', unit: 'g', defaultBulkQty: 1000, defaultBulkCost: 78.5 },
  kunafa: { id: 'kunafa', name: 'Pistachio Kunafa', unit: 'g', defaultBulkQty: 2000, defaultBulkCost: 130 },
  sticks: { id: 'sticks', name: 'Sticks', unit: 'units', defaultBulkQty: 100, defaultBulkCost: 21 },
  strawberry: { id: 'strawberry', name: 'Strawberry', unit: 'g', defaultBulkQty: 1000, defaultBulkCost: 40 },
};

const defaultProducts: Record<string, Product> = {
    normal: {
      id: 'normal',
      name: 'Strawberry Chocolate',
      price: 30.0,
    useManualCost: false,
    manualCostPerCup: 0,
      strawberriesPerCup: 8,
      chocolatePerCup: 60,
      kunafaPerCup: 0,
    cupsPerCup: 1,
    sticksPerCup: 1,
    },
    kunafa: {
      id: 'kunafa',
      name: 'Dubai Chocolate Strawberry',
      price: 35.0,
    useManualCost: false,
    manualCostPerCup: 0,
      strawberriesPerCup: 8,
      chocolatePerCup: 60,
      kunafaPerCup: 30,
    cupsPerCup: 1,
    sticksPerCup: 1,
    },
    rocky: {
      id: 'rocky',
      name: 'Rocky Road',
      price: 55.0,
    useManualCost: true,
    manualCostPerCup: 50.0,
      strawberriesPerCup: 0,
      chocolatePerCup: 0,
      kunafaPerCup: 0,
    cupsPerCup: 0,
    sticksPerCup: 0,
    },
    tips: {
      id: 'tips',
      name: 'Tips',
      price: 1.0,
    useManualCost: true,
    manualCostPerCup: 0,
      strawberriesPerCup: 0,
      chocolatePerCup: 0,
      kunafaPerCup: 0,
    cupsPerCup: 0,
    sticksPerCup: 0,
    },
    cookies: {
      id: 'cookies',
      name: 'Cookies',
      price: 15.0,
    useManualCost: true,
    manualCostPerCup: 7.67,
      strawberriesPerCup: 0,
      chocolatePerCup: 0,
      kunafaPerCup: 0,
    cupsPerCup: 0,
    sticksPerCup: 0,
  },
};

const defaultState: AppState = {
  posFeePercent: 0,
  posFeeManual: 0,
  useManualPosFee: false,
  products: defaultProducts,
  sales: [],
  fixedCosts: [
    { id: 'fc1', name: 'Kiosk / Booth', amount: 5650 },
    { id: 'fc2', name: 'Fridge', amount: 1100 },
    { id: 'fc3', name: 'Machinery / Equipment', amount: 3150 },
    { id: 'fc4', name: 'Kiosk Delivery', amount: 450 },
  ],
  ingredients: defaultIngredients,
  ingredientBatches: [],
  strawberryBatches: [],
  wasteEntries: [],
  manualInventoryAdjustments: {},
};

export function useAppState() {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      // Try Supabase first
      if (isSupabaseConfigured()) {
        const supabaseData = await db.loadAllData();
        if (supabaseData) {
          setState(prev => ({
            ...defaultState,
            ...supabaseData,
            products: { ...defaultProducts, ...supabaseData.products },
            ingredients: { ...defaultIngredients, ...supabaseData.ingredients },
            manualInventoryAdjustments: supabaseData.manualInventoryAdjustments || {},
          }));
          setUseSupabase(true);
          setIsLoaded(true);
          console.log('✓ Connected to Supabase');
          return;
        }
      }

      // Fall back to localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
          const mergedProducts: Record<string, Product> = {};
          Object.keys({ ...defaultProducts, ...parsed.products }).forEach(key => {
            mergedProducts[key] = {
              ...defaultProducts[key],
              ...parsed.products?.[key],
              useManualCost: parsed.products?.[key]?.useManualCost ?? defaultProducts[key]?.useManualCost ?? false,
              manualCostPerCup: parsed.products?.[key]?.manualCostPerCup ?? defaultProducts[key]?.manualCostPerCup ?? 0,
            };
          });
          
          // Ensure sales have source field (default to 'manual' if missing)
          const salesWithSource = (parsed.sales || []).map((sale: Sale) => ({
            ...sale,
            source: sale.source || 'manual',
          }));
          
          setState({
            ...defaultState,
            ...parsed,
            sales: salesWithSource,
            posFeeManual: parsed.posFeeManual ?? 0,
            useManualPosFee: parsed.useManualPosFee ?? false,
            ingredients: { ...defaultIngredients, ...parsed.ingredients },
            products: mergedProducts,
            manualInventoryAdjustments: parsed.manualInventoryAdjustments ?? {},
          });
        }
        console.log('Using localStorage (Supabase not configured)');
    } catch (error) {
      console.error('Failed to load state:', error);
    }
    setIsLoaded(true);
    };

    loadData();
  }, []);

  // Save to localStorage as backup
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // ============================================
  // POS FEE
  // ============================================

  const updatePosFeePercent = useCallback(async (percent: number) => {
    setState(prev => ({ ...prev, posFeePercent: percent }));
    if (useSupabase) {
      await db.updateSetting('pos_fee_percent', percent);
    }
  }, [useSupabase]);

  const updatePosFeeManual = useCallback(async (amount: number) => {
    setState(prev => ({ ...prev, posFeeManual: amount }));
    if (useSupabase) {
      await db.updateSetting('pos_fee_manual', amount);
    }
  }, [useSupabase]);

  const updateUseManualPosFee = useCallback(async (useManual: boolean) => {
    setState(prev => ({ ...prev, useManualPosFee: useManual }));
    if (useSupabase) {
      await db.updateSetting('use_manual_pos_fee', useManual);
    }
  }, [useSupabase]);

  // ============================================
  // PRODUCTS
  // ============================================

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    setState(prev => {
      const updatedProduct = { ...prev.products[productId], ...updates };
      if (useSupabase) {
        db.upsertProduct(updatedProduct);
      }
      return {
        ...prev,
        products: {
          ...prev.products,
          [productId]: updatedProduct,
        },
      };
    });
  }, [useSupabase]);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    const id = 'p' + Date.now() + Math.random().toString(16).slice(2);
    const newProduct = { ...product, id };
    
    setState(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [id]: newProduct,
      },
    }));

    if (useSupabase) {
      await db.upsertProduct(newProduct);
    }
  }, [useSupabase]);

  const deleteProduct = useCallback(async (productId: string) => {
    setState(prev => {
      const { [productId]: _, ...rest } = prev.products;
      return { ...prev, products: rest };
    });
    
    if (useSupabase) {
      await db.deleteProduct(productId);
    }
  }, [useSupabase]);

  // ============================================
  // SALES
  // ============================================

  const addSale = useCallback(async (sale: Omit<Sale, 'id'>) => {
    const id = 's' + Date.now() + Math.random().toString(16).slice(2);
    // Ensure source and transactionId fields are explicitly preserved
    const newSale: Sale = { 
      ...sale, 
      id,
      source: sale.source || 'manual', // Explicitly set source
      transactionId: sale.transactionId || undefined, // Explicitly preserve transactionId
    };
    
    setState(prev => ({
      ...prev,
      sales: [...prev.sales, newSale],
    }));

    if (useSupabase) {
      // Pass the sale with explicit source and transactionId fields
      await db.addSale({
        ...sale,
        source: sale.source || 'manual', // Explicitly ensure source is set
        transactionId: sale.transactionId || undefined, // Explicitly ensure transactionId is set
      });
    }
  }, [useSupabase]);

  const deleteSale = useCallback(async (saleId: string) => {
    setState(prev => ({
      ...prev,
      sales: prev.sales.filter(s => s.id !== saleId),
    }));

    if (useSupabase) {
      await db.deleteSale(saleId);
    }
  }, [useSupabase]);

  // ============================================
  // FIXED COSTS
  // ============================================

  const addFixedCost = useCallback(async (cost: Omit<FixedCost, 'id'>) => {
    const id = 'f' + Date.now() + Math.random().toString(16).slice(2);
    const newCost: FixedCost = { ...cost, id };
    
    setState(prev => ({
      ...prev,
      fixedCosts: [...prev.fixedCosts, newCost],
    }));

    if (useSupabase) {
      await db.addFixedCost(cost);
    }
  }, [useSupabase]);

  const deleteFixedCost = useCallback(async (costId: string) => {
    setState(prev => ({
      ...prev,
      fixedCosts: prev.fixedCosts.filter(c => c.id !== costId),
    }));

    if (useSupabase) {
      await db.deleteFixedCost(costId);
    }
  }, [useSupabase]);

  const updateFixedCost = useCallback(async (costId: string, updates: Partial<FixedCost>) => {
    setState(prev => ({
      ...prev,
      fixedCosts: prev.fixedCosts.map(c => 
        c.id === costId ? { ...c, ...updates } : c
      ),
    }));

    if (useSupabase) {
      await db.updateFixedCost(costId, updates);
    }
  }, [useSupabase]);

  // ============================================
  // INGREDIENTS
  // ============================================

  const updateIngredient = useCallback(async (ingredientId: string, updates: Partial<Ingredient>) => {
    setState(prev => {
      const updatedIngredient = { ...prev.ingredients[ingredientId], ...updates };
      if (useSupabase) {
        db.upsertIngredient(updatedIngredient);
      }
      return {
        ...prev,
        ingredients: {
          ...prev.ingredients,
          [ingredientId]: updatedIngredient,
        },
      };
    });
  }, [useSupabase]);

  const addIngredient = useCallback(async (ingredient: Omit<Ingredient, 'id'>) => {
    const id = 'ing' + Date.now() + Math.random().toString(16).slice(2);
    const newIngredient = { ...ingredient, id };
    
    setState(prev => ({
      ...prev,
      ingredients: {
        ...prev.ingredients,
        [id]: newIngredient,
      },
    }));

    if (useSupabase) {
      await db.addIngredient(ingredient);
    }
  }, [useSupabase]);

  const deleteIngredient = useCallback(async (ingredientId: string) => {
    setState(prev => {
      const { [ingredientId]: _, ...rest } = prev.ingredients;
      return { ...prev, ingredients: rest };
    });

    if (useSupabase) {
      await db.deleteIngredient(ingredientId);
    }
  }, [useSupabase]);

  // ============================================
  // INGREDIENT BATCHES
  // ============================================

  const addIngredientBatch = useCallback(async (batch: Omit<IngredientBatch, 'id'>) => {
    const id = 'ib' + Date.now() + Math.random().toString(16).slice(2);
    const newBatch: IngredientBatch = { ...batch, id };
    
    setState(prev => ({
      ...prev,
      ingredientBatches: [...prev.ingredientBatches, newBatch],
    }));

    if (useSupabase) {
      await db.addIngredientBatch(batch);
    }
  }, [useSupabase]);

  const deleteIngredientBatch = useCallback(async (batchId: string) => {
    setState(prev => ({
      ...prev,
      ingredientBatches: prev.ingredientBatches.filter(b => b.id !== batchId),
    }));

    if (useSupabase) {
      await db.deleteIngredientBatch(batchId);
    }
  }, [useSupabase]);

  // ============================================
  // STRAWBERRY BATCHES
  // ============================================

  const addStrawberryBatch = useCallback(async (batch: Omit<StrawberryBatch, 'id' | 'costPerGram' | 'costPerStrawberry'>) => {
    const costPerGram = batch.bulkWeightG > 0 ? batch.bulkCost / batch.bulkWeightG : 0;
    const costPerStrawberry = costPerGram * batch.avgWeightPerStrawberry;
    const id = 'sb' + Date.now() + Math.random().toString(16).slice(2);
    
    const newBatch: StrawberryBatch = {
      ...batch,
      id,
      costPerGram,
      costPerStrawberry,
    };
    
    setState(prev => ({
      ...prev,
      strawberryBatches: [...prev.strawberryBatches, newBatch],
    }));

    if (useSupabase) {
      await db.addStrawberryBatch(batch);
    }
  }, [useSupabase]);

  const deleteStrawberryBatch = useCallback(async (batchId: string) => {
    setState(prev => ({
      ...prev,
      strawberryBatches: prev.strawberryBatches.filter(b => b.id !== batchId),
    }));

    if (useSupabase) {
      await db.deleteStrawberryBatch(batchId);
    }
  }, [useSupabase]);

  const updateStrawberryBatch = useCallback(async (batchId: string, updates: Partial<StrawberryBatch>) => {
    setState(prev => ({
      ...prev,
      strawberryBatches: prev.strawberryBatches.map(b => {
        if (b.id !== batchId) return b;
        const updated = { ...b, ...updates };
        updated.costPerGram = updated.bulkWeightG > 0 ? updated.bulkCost / updated.bulkWeightG : 0;
        updated.costPerStrawberry = updated.costPerGram * updated.avgWeightPerStrawberry;
        return updated;
      }),
    }));

    if (useSupabase) {
      await db.updateStrawberryBatch(batchId, updates);
    }
  }, [useSupabase]);

  // ============================================
  // WASTE ENTRIES
  // ============================================

  const addWasteEntry = useCallback(async (entry: Omit<WasteEntry, 'id'>) => {
    const id = 'w' + Date.now() + Math.random().toString(16).slice(2);
    const newEntry: WasteEntry = { ...entry, id };
    
    setState(prev => ({
      ...prev,
      wasteEntries: [...prev.wasteEntries, newEntry],
    }));

    if (useSupabase) {
      await db.addWasteEntry(entry);
    }
  }, [useSupabase]);

  const deleteWasteEntry = useCallback(async (entryId: string) => {
    setState(prev => ({
      ...prev,
      wasteEntries: prev.wasteEntries.filter(e => e.id !== entryId),
    }));

    if (useSupabase) {
      await db.deleteWasteEntry(entryId);
    }
  }, [useSupabase]);

  // ============================================
  // RESET
  // ============================================

  const resetAllData = useCallback(() => {
    setState(defaultState);
    // Note: This only resets local state. For Supabase, you'd need to truncate tables.
  }, []);

  // ============================================
  // CALCULATION HELPERS
  // ============================================

  const getActiveStrawberryBatch = useCallback((): StrawberryBatch | null => {
    if (state.strawberryBatches.length === 0) return null;
    return state.strawberryBatches[state.strawberryBatches.length - 1];
  }, [state.strawberryBatches]);

  const getStrawberryBatchForDate = useCallback((saleDate: string): StrawberryBatch | null => {
    if (state.strawberryBatches.length === 0) return null;
    
    const sortedBatches = [...state.strawberryBatches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const saleDateObj = new Date(saleDate);
    let applicableBatch: StrawberryBatch | null = null;
    
    for (const batch of sortedBatches) {
      const batchDateObj = new Date(batch.date);
      if (batchDateObj <= saleDateObj) {
        applicableBatch = batch;
      } else {
        break;
      }
    }
    
    if (!applicableBatch && sortedBatches.length > 0) {
      applicableBatch = sortedBatches[0];
    }
    
    return applicableBatch;
  }, [state.strawberryBatches]);

  const getIngredientCostPerUnit = useCallback((ingredientId: string, forDate?: string): number => {
    const batches = state.ingredientBatches.filter(b => b.ingredientId === ingredientId);
    if (batches.length === 0) {
      const ingredient = state.ingredients[ingredientId];
      if (!ingredient) return 0;
      return ingredient.defaultBulkQty > 0 ? ingredient.defaultBulkCost / ingredient.defaultBulkQty : 0;
    }
    
    if (forDate) {
      const sortedBatches = [...batches].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const dateObj = new Date(forDate);
      let applicableBatch = sortedBatches[0];
      
      for (const batch of sortedBatches) {
        if (new Date(batch.date) <= dateObj) {
          applicableBatch = batch;
        } else {
          break;
        }
      }
      return applicableBatch.bulkQty > 0 ? applicableBatch.bulkCost / applicableBatch.bulkQty : 0;
    }
    
    const latestBatch = batches[batches.length - 1];
    return latestBatch.bulkQty > 0 ? latestBatch.bulkCost / latestBatch.bulkQty : 0;
  }, [state.ingredientBatches, state.ingredients]);

  const calculateCostPerCup = useCallback((product: Product, forDate?: string): number => {
    if (product.useManualCost) {
      return product.manualCostPerCup || 0;
    }
    
    const batch = forDate 
      ? getStrawberryBatchForDate(forDate)
      : getActiveStrawberryBatch();
    const strawberryCostPerPiece = batch?.costPerStrawberry || 0;
    
    const cupCost = getIngredientCostPerUnit('cup', forDate);
    const chocolateCost = getIngredientCostPerUnit('chocolate', forDate);
    const kunafaCost = getIngredientCostPerUnit('kunafa', forDate);
    const sticksCost = getIngredientCostPerUnit('sticks', forDate);

    return (
      (product.strawberriesPerCup * strawberryCostPerPiece) +
      (product.chocolatePerCup * chocolateCost) +
      (product.kunafaPerCup * kunafaCost) +
      (product.cupsPerCup * cupCost) +
      (product.sticksPerCup * sticksCost)
    );
  }, [getActiveStrawberryBatch, getStrawberryBatchForDate, getIngredientCostPerUnit]);

  const calculateIngredientUsage = useCallback((): IngredientUsage => {
    let usage: IngredientUsage = {
      strawberriesG: 0,
      strawberriesPcs: 0,
      chocolateG: 0,
      kunafaG: 0,
      cupsUsed: 0,
      sticksUsed: 0,
    };

    state.sales.forEach(sale => {
      const product = state.products[sale.productId];
      if (!product || product.useManualCost) return;

      const batch = getStrawberryBatchForDate(sale.date);
      const avgWeight = batch?.avgWeightPerStrawberry || 20;

      usage.strawberriesPcs += sale.qty * product.strawberriesPerCup;
      usage.strawberriesG += sale.qty * product.strawberriesPerCup * avgWeight;
      usage.chocolateG += sale.qty * product.chocolatePerCup;
      usage.kunafaG += sale.qty * product.kunafaPerCup;
      usage.cupsUsed += sale.qty * product.cupsPerCup;
      usage.sticksUsed += sale.qty * product.sticksPerCup;
    });

    return usage;
  }, [state.sales, state.products, getStrawberryBatchForDate]);

  const calculateInventory = useCallback((): IngredientInventory[] => {
    const usage = calculateIngredientUsage();
    const inventory: IngredientInventory[] = [];

    // Strawberry handling
    const strawberryPurchased = state.strawberryBatches.reduce((sum, b) => sum + b.bulkWeightG, 0);
    const strawberryWasted = state.wasteEntries
      .filter(w => w.ingredientId === 'strawberry')
      .reduce((sum, w) => sum + w.qty, 0);
    const strawberryCost = state.strawberryBatches.reduce((sum, b) => sum + b.bulkCost, 0);
    const strawberryIng = state.ingredients['strawberry'];
    
    // Use default cost if no batches exist
    const strawberryCostPerUnit = strawberryPurchased > 0 
      ? strawberryCost / strawberryPurchased 
      : (strawberryIng?.defaultBulkQty > 0 ? strawberryIng.defaultBulkCost / strawberryIng.defaultBulkQty : 0);
    
    const calculatedStrawberryRemaining = strawberryPurchased - usage.strawberriesG - strawberryWasted;
    const strawberryRemaining = state.manualInventoryAdjustments['strawberry'] !== undefined
      ? state.manualInventoryAdjustments['strawberry']
      : calculatedStrawberryRemaining;
    
    inventory.push({
      ingredientId: 'strawberry',
      name: 'Strawberry',
      totalPurchased: strawberryPurchased,
      totalUsed: usage.strawberriesG,
      totalWasted: strawberryWasted,
      remaining: strawberryRemaining,
      unit: 'g',
      totalCost: strawberryCost,
      costPerUnit: strawberryCostPerUnit,
    });

    const ingredientUsageMap: Record<string, number> = {
      chocolate: usage.chocolateG,
      kunafa: usage.kunafaG,
      cup: usage.cupsUsed,
      sticks: usage.sticksUsed,
    };

    Object.entries(state.ingredients).forEach(([id, ing]) => {
      if (id === 'strawberry') return;

      const batches = state.ingredientBatches.filter(b => b.ingredientId === id);
      const purchased = batches.reduce((sum, b) => sum + b.bulkQty, 0);
      const cost = batches.reduce((sum, b) => sum + b.bulkCost, 0);
      const wasted = state.wasteEntries
        .filter(w => w.ingredientId === id)
        .reduce((sum, w) => sum + w.qty, 0);
      const used = ingredientUsageMap[id] || 0;

      // Use default cost if no batches exist
      const costPerUnit = purchased > 0 
        ? cost / purchased 
        : (ing.defaultBulkQty > 0 ? ing.defaultBulkCost / ing.defaultBulkQty : 0);

      const calculatedRemaining = purchased - used - wasted;
      const remaining = state.manualInventoryAdjustments[id] !== undefined
        ? state.manualInventoryAdjustments[id]
        : calculatedRemaining;

      inventory.push({
        ingredientId: id,
        name: ing.name,
        totalPurchased: purchased,
        totalUsed: used,
        totalWasted: wasted,
        remaining: remaining,
        unit: ing.unit,
        totalCost: cost,
        costPerUnit: costPerUnit,
      });
    });

    return inventory;
  }, [state.ingredients, state.ingredientBatches, state.strawberryBatches, state.wasteEntries, state.manualInventoryAdjustments, calculateIngredientUsage]);

  const calculateDashboardStats = useCallback((): DashboardStats => {
    let grossRevenue = 0;
    let revenueExcludingRocky = 0;
    let tipsRevenue = 0;
    let rockyDeduction = 0;
    let totalCups = 0;
    let autoPosFees = 0;

    const usage = calculateIngredientUsage();
    const inventory = calculateInventory();

    // Calculate total variable cost as sum of all ingredient purchases
    const totalVarCost = inventory.reduce((sum, inv) => sum + inv.totalCost, 0);

    // Group POS sales by transactionId to calculate fees per transaction
    const posTransactions = new Map<string, number>();
    
    state.sales.forEach(sale => {
      const product = state.products[sale.productId];
      if (!product) return;

      const revenue = sale.qty * sale.unitPrice;

      grossRevenue += revenue;
      if (sale.productId === 'tips') {
        tipsRevenue += revenue;
      }
      if (sale.productId === 'rocky') {
        // Deduct 50 AED per Rocky Road transaction
        rockyDeduction += 50 * sale.qty;
      }
      // Revenue excluding Rocky (tips included)
      if (sale.productId !== 'rocky') {
        revenueExcludingRocky += revenue;
      }
      totalCups += sale.qty;

      // Track POS transaction revenue (group by transactionId, or use sale.id if no transactionId)
      if (sale.source === 'pos') {
        // Use transactionId if available, otherwise use sale.id as unique identifier
        const transactionKey = sale.transactionId || sale.id;
        const currentTotal = posTransactions.get(transactionKey) || 0;
        posTransactions.set(transactionKey, currentTotal + revenue);
      }
    });

    // Calculate automatic POS fees: AED 1 + 2.6% per transaction (not per item)
    // Fee is calculated once per transaction on the total transaction revenue
    posTransactions.forEach((transactionRevenue) => {
      const transactionFee = 1 + (transactionRevenue * 0.026);
      autoPosFees += transactionFee;
    });

    const posFees = state.useManualPosFee 
      ? state.posFeeManual 
      : (state.posFeePercent / 100) * grossRevenue;
    // Net revenue after manual POS fees, auto POS fees, and Rocky deduction
    const totalRevenue = grossRevenue - posFees - autoPosFees - rockyDeduction;
    
    // Calculate proportional POS fees for revenue excluding Rocky (tips included)
    const revenueExclRockyRatio = grossRevenue > 0 ? revenueExcludingRocky / grossRevenue : 0;
    const posFeesForExclRocky = posFees * revenueExclRockyRatio;
    const netRevenueExcludingRocky = revenueExcludingRocky - posFeesForExclRocky;
    
    const profitBeforeFixed = totalRevenue - totalVarCost;
    const fixedTotal = state.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const netAfterFixed = profitBeforeFixed - fixedTotal;
    const remainingToBreakeven = netAfterFixed >= 0 ? 0 : Math.abs(netAfterFixed);

    const totalWasteCost = state.wasteEntries.reduce((sum, w) => sum + w.estimatedCost, 0);

    const strawberryInv = inventory.find(i => i.ingredientId === 'strawberry');
    const chocolateInv = inventory.find(i => i.ingredientId === 'chocolate');
    const kunafaInv = inventory.find(i => i.ingredientId === 'kunafa');
    const cupInv = inventory.find(i => i.ingredientId === 'cup');
    const sticksInv = inventory.find(i => i.ingredientId === 'sticks');

    return {
      grossRevenue,
      totalRevenue,
      totalRevenueExcludingRocky: netRevenueExcludingRocky,
      tipsRevenue,
      rockyDeduction,
      totalVarCost,
      posFees,
      autoPosFees,
      profitBeforeFixed,
      fixedTotal,
      netAfterFixed,
      totalCups,
      remainingToBreakeven,
      strawberriesUsedG: usage.strawberriesG,
      strawberriesUsedPcs: usage.strawberriesPcs,
      chocolateUsedG: usage.chocolateG,
      kunafaUsedG: usage.kunafaG,
      cupsUsed: usage.cupsUsed,
      sticksUsed: usage.sticksUsed,
      strawberryRemainingG: strawberryInv?.remaining || 0,
      chocolateRemainingG: chocolateInv?.remaining || 0,
      kunafaRemainingG: kunafaInv?.remaining || 0,
      cupsRemaining: cupInv?.remaining || 0,
      sticksRemaining: sticksInv?.remaining || 0,
      totalWasteCost,
    };
  }, [state, calculateIngredientUsage, calculateInventory]);

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' AED';
  }, []);

  // ============================================
  // MANUAL INVENTORY ADJUSTMENTS
  // ============================================

  const updateManualInventory = useCallback(async (ingredientId: string, remaining: number | null) => {
    let newAdjustments: Record<string, number> = {};
    
    // Update state - this will trigger a re-render
    setState(prev => {
      // Create a completely new adjustments object
      newAdjustments = { ...prev.manualInventoryAdjustments };
      
      if (remaining === null || remaining === undefined) {
        // Remove manual adjustment to use calculated value
        const { [ingredientId]: _, ...rest } = newAdjustments;
        newAdjustments = rest;
      } else {
        newAdjustments = { ...newAdjustments, [ingredientId]: remaining };
      }
      
      console.log('Updating manual inventory:', ingredientId, remaining, newAdjustments);
      
      // Return completely new state object to ensure React detects the change
      return {
        ...prev,
        manualInventoryAdjustments: newAdjustments,
      };
    });

    // Save to localStorage - use the new adjustments
    try {
      const currentState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      currentState.manualInventoryAdjustments = { ...newAdjustments };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (error) {
      console.error('Failed to save manual inventory to localStorage:', error);
    }

    // Save to Supabase if configured
    if (useSupabase) {
      try {
        const success = await db.updateSetting('manual_inventory_adjustments', { ...newAdjustments });
        if (!success) {
          console.error('Failed to save manual inventory adjustments to Supabase');
        } else {
          console.log('✓ Manual inventory adjustments saved to Supabase');
        }
      } catch (error) {
        console.error('Error saving manual inventory adjustments to Supabase:', error);
      }
    }
  }, [useSupabase]);

  return {
    state,
    isLoaded,
    useSupabase,
    // POS
    updatePosFeePercent,
    updatePosFeeManual,
    updateUseManualPosFee,
    // Products
    updateProduct,
    addProduct,
    deleteProduct,
    // Sales
    addSale,
    deleteSale,
    // Fixed Costs
    addFixedCost,
    deleteFixedCost,
    updateFixedCost,
    // Ingredients
    updateIngredient,
    addIngredient,
    deleteIngredient,
    // Ingredient Batches
    addIngredientBatch,
    deleteIngredientBatch,
    // Strawberry Batches
    addStrawberryBatch,
    deleteStrawberryBatch,
    updateStrawberryBatch,
    getActiveStrawberryBatch,
    getStrawberryBatchForDate,
    // Waste
    addWasteEntry,
    deleteWasteEntry,
    // Calculations
    getIngredientCostPerUnit,
    calculateCostPerCup,
    calculateIngredientUsage,
    calculateInventory,
    calculateDashboardStats,
    formatCurrency,
    // Manual Inventory
    updateManualInventory,
    // Reset
    resetAllData,
  };
}
