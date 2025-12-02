import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  Product, 
  Sale, 
  FixedCost, 
  Ingredient, 
  IngredientBatch, 
  StrawberryBatch, 
  WasteEntry,
  AppState 
} from '@/types';

// Helper to generate IDs
const generateId = (prefix: string) => 
  `${prefix}${Date.now()}${Math.random().toString(16).slice(2)}`;

// ============================================
// SETTINGS
// ============================================

export async function getSettings(): Promise<{
  posFeePercent: number;
  posFeeManual: number;
  useManualPosFee: boolean;
} | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  const settings: Record<string, string> = {};
    if (data) {
      for (const row of data) {
    settings[row.key] = row.value;
      }
    }

  return {
    posFeePercent: parseFloat(settings.pos_fee_percent || '0'),
    posFeeManual: parseFloat(settings.pos_fee_manual || '0'),
    useManualPosFee: settings.use_manual_pos_fee === 'true',
  };
  } catch {
    return null;
  }
}

export async function updateSetting(key: string, value: string | number | boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: String(value) }, { onConflict: 'key' });

  if (error) {
    console.error('Error updating setting:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

// ============================================
// PRODUCTS
// ============================================

export async function getProducts(): Promise<Record<string, Product> | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('Error fetching products:', error);
    return null;
  }

  const products: Record<string, Product> = {};
    if (data) {
      for (const row of data) {
    products[row.id] = {
      id: row.id,
      name: row.name,
      price: row.price,
      useManualCost: row.use_manual_cost,
      manualCostPerCup: row.manual_cost_per_cup,
      strawberriesPerCup: row.strawberries_per_cup,
      chocolatePerCup: row.chocolate_per_cup,
      kunafaPerCup: row.kunafa_per_cup,
      cupsPerCup: row.cups_per_cup,
      sticksPerCup: row.sticks_per_cup,
    };
      }
    }

  return products;
  } catch {
    return null;
  }
}

export async function upsertProduct(product: Product): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('products')
    .upsert({
      id: product.id,
      name: product.name,
      price: product.price,
      use_manual_cost: product.useManualCost,
      manual_cost_per_cup: product.manualCostPerCup || 0,
      strawberries_per_cup: product.strawberriesPerCup,
      chocolate_per_cup: product.chocolatePerCup,
      kunafa_per_cup: product.kunafaPerCup,
      cups_per_cup: product.cupsPerCup,
      sticks_per_cup: product.sticksPerCup,
    });

  if (error) {
    console.error('Error upserting product:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

// ============================================
// SALES
// ============================================

export async function getSales(): Promise<Sale[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching sales:', error);
    return null;
  }

  return data?.map(row => ({
    id: row.id,
    date: row.date,
    productId: row.product_id,
    qty: row.qty,
    unitPrice: row.unit_price,
      source: (row.source as 'pos' | 'manual') || 'manual', // Default to 'manual' for existing sales
  })) || [];
  } catch {
    return null;
  }
}

export async function addSale(sale: Omit<Sale, 'id'>): Promise<Sale | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const id = generateId('s');
  // Explicitly set source field - ensure it's not undefined
  const sourceValue: 'pos' | 'manual' = sale.source === 'pos' ? 'pos' : 'manual';
  
  const { error } = await supabase
    .from('sales')
    .insert({
      id,
      date: sale.date,
      product_id: sale.productId,
      qty: sale.qty,
      unit_price: sale.unitPrice,
      source: sourceValue, // Explicitly set source value
    });

  if (error) {
    console.error('Error adding sale:', error.message, error.details, error.hint);
    return null;
  }

  return { id, ...sale };
  } catch {
    return null;
  }
}

export async function deleteSale(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting sale:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

// ============================================
// FIXED COSTS
// ============================================

export async function getFixedCosts(): Promise<FixedCost[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const { data, error } = await supabase
    .from('fixed_costs')
    .select('*');

  if (error) {
    console.error('Error fetching fixed costs:', error);
    return null;
  }

  return data?.map(row => ({
    id: row.id,
    name: row.name,
    amount: row.amount,
  })) || [];
  } catch {
    return null;
  }
}

export async function addFixedCost(cost: Omit<FixedCost, 'id'>): Promise<FixedCost | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const id = generateId('f');
  const { error } = await supabase
    .from('fixed_costs')
    .insert({
      id,
      name: cost.name,
      amount: cost.amount,
    });

  if (error) {
    console.error('Error adding fixed cost:', error.message, error.details, error.hint);
    return null;
  }

  return { id, ...cost };
  } catch {
    return null;
  }
}

export async function updateFixedCost(id: string, updates: Partial<FixedCost>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('fixed_costs')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.amount !== undefined && { amount: updates.amount }),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating fixed cost:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

export async function deleteFixedCost(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('fixed_costs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting fixed cost:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

// ============================================
// INGREDIENTS
// ============================================

export async function getIngredients(): Promise<Record<string, Ingredient> | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*');

  if (error) {
    console.error('Error fetching ingredients:', error);
    return null;
  }

  const ingredients: Record<string, Ingredient> = {};
    if (data) {
      for (const row of data) {
    ingredients[row.id] = {
      id: row.id,
      name: row.name,
      unit: row.unit as 'g' | 'pcs' | 'units',
      defaultBulkQty: row.default_bulk_qty,
      defaultBulkCost: row.default_bulk_cost,
    };
      }
    }

  return ingredients;
  } catch {
    return null;
  }
}

export async function upsertIngredient(ingredient: Ingredient): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('ingredients')
    .upsert({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      default_bulk_qty: ingredient.defaultBulkQty,
      default_bulk_cost: ingredient.defaultBulkCost,
    });

  if (error) {
    console.error('Error upserting ingredient:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

export async function addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const id = generateId('ing');
  const { error } = await supabase
    .from('ingredients')
    .insert({
      id,
      name: ingredient.name,
      unit: ingredient.unit,
      default_bulk_qty: ingredient.defaultBulkQty,
      default_bulk_cost: ingredient.defaultBulkCost,
    });

  if (error) {
    console.error('Error adding ingredient:', error);
    return null;
  }

  return { id, ...ingredient };
  } catch {
    return null;
  }
}

export async function deleteIngredient(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ingredient:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

// ============================================
// INGREDIENT BATCHES
// ============================================

export async function getIngredientBatches(): Promise<IngredientBatch[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const { data, error } = await supabase
    .from('ingredient_batches')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching ingredient batches:', error);
    return null;
  }

  return data?.map(row => ({
    id: row.id,
    ingredientId: row.ingredient_id,
    name: row.name || '',
    date: row.date,
    bulkQty: row.bulk_qty,
    bulkCost: row.bulk_cost,
  })) || [];
  } catch {
    return null;
  }
}

export async function addIngredientBatch(batch: Omit<IngredientBatch, 'id'>): Promise<IngredientBatch | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const id = generateId('ib');
    const { error } = await supabase
    .from('ingredient_batches')
    .insert({
      id,
      ingredient_id: batch.ingredientId,
      name: batch.name || null,
      date: batch.date,
      bulk_qty: batch.bulkQty,
      bulk_cost: batch.bulkCost,
      });

  if (error) {
    console.error('Error adding ingredient batch:', error.message, error.details, error.hint);
    return null;
  }

  return { id, ...batch };
  } catch {
    return null;
  }
}

export async function deleteIngredientBatch(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('ingredient_batches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ingredient batch:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

// ============================================
// STRAWBERRY BATCHES
// ============================================

export async function getStrawberryBatches(): Promise<StrawberryBatch[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const { data, error } = await supabase
    .from('strawberry_batches')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching strawberry batches:', error);
    return null;
  }

  return data?.map(row => ({
    id: row.id,
    name: row.name || '',
    date: row.date,
    bulkWeightKg: row.bulk_weight_kg,
    bulkWeightG: row.bulk_weight_g,
    bulkCost: row.bulk_cost,
    avgWeightPerStrawberry: row.avg_weight_per_strawberry,
    costPerGram: row.cost_per_gram,
    costPerStrawberry: row.cost_per_strawberry,
  })) || [];
  } catch {
    return null;
  }
}

export async function addStrawberryBatch(
  batch: Omit<StrawberryBatch, 'id' | 'costPerGram' | 'costPerStrawberry'>
): Promise<StrawberryBatch | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const id = generateId('sb');
  const costPerGram = batch.bulkWeightG > 0 ? batch.bulkCost / batch.bulkWeightG : 0;
  const costPerStrawberry = costPerGram * batch.avgWeightPerStrawberry;

  const { error } = await supabase
    .from('strawberry_batches')
    .insert({
      id,
      name: batch.name || null,
      date: batch.date,
      bulk_weight_kg: batch.bulkWeightKg,
      bulk_weight_g: batch.bulkWeightG,
      bulk_cost: batch.bulkCost,
      avg_weight_per_strawberry: batch.avgWeightPerStrawberry,
    });

  if (error) {
    console.error('Error adding strawberry batch:', error.message, error.details, error.hint);
    return null;
  }

  return { id, ...batch, costPerGram, costPerStrawberry };
  } catch {
    return null;
  }
}

export async function updateStrawberryBatch(id: string, updates: Partial<StrawberryBatch>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('strawberry_batches')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.date !== undefined && { date: updates.date }),
      ...(updates.bulkWeightKg !== undefined && { bulk_weight_kg: updates.bulkWeightKg }),
      ...(updates.bulkWeightG !== undefined && { bulk_weight_g: updates.bulkWeightG }),
      ...(updates.bulkCost !== undefined && { bulk_cost: updates.bulkCost }),
      ...(updates.avgWeightPerStrawberry !== undefined && { avg_weight_per_strawberry: updates.avgWeightPerStrawberry }),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating strawberry batch:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

export async function deleteStrawberryBatch(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('strawberry_batches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting strawberry batch:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

// ============================================
// WASTE ENTRIES
// ============================================

export async function getWasteEntries(): Promise<WasteEntry[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const { data, error } = await supabase
    .from('waste_entries')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching waste entries:', error);
    return null;
  }

  return data?.map(row => ({
    id: row.id,
    date: row.date,
    ingredientId: row.ingredient_id,
    qty: row.qty,
    reason: row.reason || '',
    estimatedCost: row.estimated_cost,
  })) || [];
  } catch {
    return null;
  }
}

export async function addWasteEntry(entry: Omit<WasteEntry, 'id'>): Promise<WasteEntry | null> {
  if (!isSupabaseConfigured()) return null;

  try {
  const id = generateId('w');
  const { error } = await supabase
    .from('waste_entries')
    .insert({
      id,
      date: entry.date,
      ingredient_id: entry.ingredientId,
      qty: entry.qty,
      reason: entry.reason || null,
      estimated_cost: entry.estimatedCost,
    });

  if (error) {
    console.error('Error adding waste entry:', error.message, error.details, error.hint);
    return null;
  }

  return { id, ...entry };
  } catch {
    return null;
  }
}

export async function deleteWasteEntry(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
  const { error } = await supabase
    .from('waste_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting waste entry:', error);
    return false;
  }
  return true;
  } catch {
    return false;
  }
}

// ============================================
// LOAD ALL DATA
// ============================================

export async function loadAllData(): Promise<Partial<AppState> | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const [
      settings,
      products,
      sales,
      fixedCosts,
      ingredients,
      ingredientBatches,
      strawberryBatches,
      wasteEntries,
    ] = await Promise.all([
      getSettings(),
      getProducts(),
      getSales(),
      getFixedCosts(),
      getIngredients(),
      getIngredientBatches(),
      getStrawberryBatches(),
      getWasteEntries(),
    ]);

    if (!products || !sales || !fixedCosts || !ingredients || 
        !ingredientBatches || !strawberryBatches || !wasteEntries) {
      console.error('Failed to load some data from Supabase');
      return null;
    }

    return {
      posFeePercent: settings?.posFeePercent || 0,
      posFeeManual: settings?.posFeeManual || 0,
      useManualPosFee: settings?.useManualPosFee || false,
      products,
      sales,
      fixedCosts,
      ingredients,
      ingredientBatches,
      strawberryBatches,
      wasteEntries,
    };
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    return null;
  }
}
