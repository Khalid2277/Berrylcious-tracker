// Database types for Supabase
// These match the SQL schema

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          use_manual_cost: boolean;
          manual_cost_per_cup: number;
          strawberries_per_cup: number;
          chocolate_per_cup: number;
          kunafa_per_cup: number;
          cups_per_cup: number;
          sticks_per_cup: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          price?: number;
          use_manual_cost?: boolean;
          manual_cost_per_cup?: number;
          strawberries_per_cup?: number;
          chocolate_per_cup?: number;
          kunafa_per_cup?: number;
          cups_per_cup?: number;
          sticks_per_cup?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          price?: number;
          use_manual_cost?: boolean;
          manual_cost_per_cup?: number;
          strawberries_per_cup?: number;
          chocolate_per_cup?: number;
          kunafa_per_cup?: number;
          cups_per_cup?: number;
          sticks_per_cup?: number;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          date: string;
          product_id: string;
          qty: number;
          unit_price: number;
          source: 'pos' | 'manual';
          transaction_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          date: string;
          product_id: string;
          qty: number;
          unit_price: number;
          source?: 'pos' | 'manual';
          transaction_id?: string | null;
          created_at?: string;
        };
        Update: {
          date?: string;
          product_id?: string;
          qty?: number;
          unit_price?: number;
          source?: 'pos' | 'manual';
          transaction_id?: string | null;
        };
      };
      fixed_costs: {
        Row: {
          id: string;
          name: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          amount?: number;
          updated_at?: string;
        };
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          unit: string;
          default_bulk_qty: number;
          default_bulk_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          unit?: string;
          default_bulk_qty?: number;
          default_bulk_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          unit?: string;
          default_bulk_qty?: number;
          default_bulk_cost?: number;
          updated_at?: string;
        };
      };
      ingredient_batches: {
        Row: {
          id: string;
          ingredient_id: string;
          name: string | null;
          date: string;
          bulk_qty: number;
          bulk_cost: number;
          created_at: string;
        };
        Insert: {
          id: string;
          ingredient_id: string;
          name?: string | null;
          date: string;
          bulk_qty: number;
          bulk_cost: number;
          created_at?: string;
        };
        Update: {
          ingredient_id?: string;
          name?: string | null;
          date?: string;
          bulk_qty?: number;
          bulk_cost?: number;
        };
      };
      strawberry_batches: {
        Row: {
          id: string;
          name: string | null;
          date: string;
          bulk_weight_kg: number;
          bulk_weight_g: number;
          bulk_cost: number;
          avg_weight_per_strawberry: number;
          cost_per_gram: number;
          cost_per_strawberry: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          date: string;
          bulk_weight_kg: number;
          bulk_weight_g: number;
          bulk_cost: number;
          avg_weight_per_strawberry?: number;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          date?: string;
          bulk_weight_kg?: number;
          bulk_weight_g?: number;
          bulk_cost?: number;
          avg_weight_per_strawberry?: number;
        };
      };
      waste_entries: {
        Row: {
          id: string;
          date: string;
          ingredient_id: string;
          qty: number;
          reason: string | null;
          estimated_cost: number;
          created_at: string;
        };
        Insert: {
          id: string;
          date: string;
          ingredient_id: string;
          qty: number;
          reason?: string | null;
          estimated_cost?: number;
          created_at?: string;
        };
        Update: {
          date?: string;
          ingredient_id?: string;
          qty?: number;
          reason?: string | null;
          estimated_cost?: number;
        };
      };
    };
    Views: {
      sales_with_products: {
        Row: {
          id: string;
          date: string;
          product_id: string;
          qty: number;
          unit_price: number;
          created_at: string;
          product_name: string;
          product_price: number;
          use_manual_cost: boolean;
          manual_cost_per_cup: number;
          strawberries_per_cup: number;
          chocolate_per_cup: number;
          kunafa_per_cup: number;
          cups_per_cup: number;
          sticks_per_cup: number;
          revenue: number;
        };
      };
      inventory_summary: {
        Row: {
          id: string;
          name: string;
          unit: string;
          total_purchased: number;
          total_cost: number;
          total_wasted: number;
        };
      };
    };
  };
}

