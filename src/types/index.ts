export interface Product {
  id: string;
  name: string;
  price: number;
  // Manual cost override - if set, this is used instead of calculating from ingredients
  manualCostPerCup?: number;
  useManualCost: boolean;
  // Ingredients per cup (only used if useManualCost is false)
  strawberriesPerCup: number; // pieces
  chocolatePerCup: number; // grams
  kunafaPerCup: number; // grams
  cupsPerCup: number; // units (packaging cups used)
  sticksPerCup: number; // units
}

export interface Sale {
  id: string;
  date: string;
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
}

// Base ingredient definition
export interface Ingredient {
  id: string;
  name: string;
  unit: 'g' | 'pcs' | 'units'; // grams, pieces, or units
  // For calculating cost per unit from bulk purchases
  defaultBulkQty: number;
  defaultBulkCost: number;
}

// Ingredient purchase/batch for tracking inventory
export interface IngredientBatch {
  id: string;
  ingredientId: string;
  name: string; // batch name/date identifier
  date: string;
  bulkQty: number; // total quantity purchased
  bulkCost: number; // total cost
  // For strawberries specifically
  avgWeightPerPiece?: number; // grams per strawberry
}

// Strawberry batch with specific fields
export interface StrawberryBatch {
  id: string;
  name: string;
  date: string;
  bulkWeightKg: number;
  bulkWeightG: number;
  bulkCost: number;
  avgWeightPerStrawberry: number; // grams
  costPerGram: number;
  costPerStrawberry: number;
}

// Waste entry for tracking spoiled/unused items
export interface WasteEntry {
  id: string;
  date: string;
  ingredientId: string;
  qty: number;
  reason: string;
  estimatedCost: number;
}

export interface AppState {
  posFeePercent: number;
  posFeeManual: number; // Manual POS fee amount (used if > 0)
  useManualPosFee: boolean; // Whether to use manual POS fee
  products: Record<string, Product>;
  sales: Sale[];
  fixedCosts: FixedCost[];
  // Enhanced ingredients system
  ingredients: Record<string, Ingredient>;
  ingredientBatches: IngredientBatch[];
  strawberryBatches: StrawberryBatch[];
  wasteEntries: WasteEntry[];
}

export interface ProductCombo {
  rocky: number;
  strawberry: number;
  dubai: number;
  cookies: number;
}

export interface Transaction {
  amount: number;
  combo: ProductCombo;
}

export interface TransactionClassifierState {
  transactions: Transaction[];
  totals: {
    rocky: number;
    strawberry: number;
    dubai: number;
    cookies: number;
  };
}

export interface IngredientUsage {
  strawberriesG: number;
  strawberriesPcs: number;
  chocolateG: number;
  kunafaG: number;
  cupsUsed: number;
  sticksUsed: number;
}

export interface IngredientInventory {
  ingredientId: string;
  name: string;
  totalPurchased: number;
  totalUsed: number;
  totalWasted: number;
  remaining: number;
  unit: string;
  totalCost: number;
  costPerUnit: number;
}

export interface DashboardStats {
  grossRevenue: number;  // Before POS fees
  totalRevenue: number;  // After POS fees and Rocky deduction (net revenue)
  totalRevenueExcludingRocky: number;  // Excludes Rocky, includes tips, minus proportional POS fees
  tipsRevenue: number;
  rockyDeduction: number;  // 50 AED per Rocky Road transaction
  totalVarCost: number;
  posFees: number;
  profitBeforeFixed: number;
  fixedTotal: number;
  netAfterFixed: number;
  totalCups: number;
  remainingToBreakeven: number;
  // Ingredient usage
  strawberriesUsedG: number;
  strawberriesUsedPcs: number;
  chocolateUsedG: number;
  kunafaUsedG: number;
  cupsUsed: number;
  sticksUsed: number;
  // Inventory tracking
  strawberryRemainingG: number;
  chocolateRemainingG: number;
  kunafaRemainingG: number;
  cupsRemaining: number;
  sticksRemaining: number;
  // Waste
  totalWasteCost: number;
}
