export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          currency: string | null;
          monthly_budget: number | string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          display_name?: string | null;
          currency?: string | null;
          monthly_budget?: number | string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          currency?: string | null;
          monthly_budget?: number | string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          profile_id: string | null;
          amount: number | string;
          currency: string;
          merchant: string;
          category: string;
          note: string | null;
          spent_at: string;
          source: string;
          confidence: number | string | null;
          raw_input: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          amount: number;
          currency?: string;
          merchant: string;
          category: string;
          note?: string | null;
          spent_at?: string;
          source?: string;
          confidence?: number | null;
          raw_input?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          amount?: number;
          currency?: string;
          merchant?: string;
          category?: string;
          note?: string | null;
          spent_at?: string;
          source?: string;
          confidence?: number | null;
          raw_input?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
