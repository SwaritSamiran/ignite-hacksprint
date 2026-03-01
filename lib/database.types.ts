export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          monthly_income: number;
          monthly_budget: number;
          weekly_limit: number;
          savings_goal: 'emergency' | 'vacation' | 'education' | 'home' | 'investment' | 'other';
          savings_target: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monthly_income: number;
          monthly_budget: number;
          weekly_limit: number;
          savings_goal: string;
          savings_target: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          monthly_income?: number;
          monthly_budget?: number;
          weekly_limit?: number;
          savings_goal?: string;
          savings_target?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'utilities' | 'other';
          description: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: string;
          description?: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          description?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [thing_name: string]: {
        Row: {
          [column_name: string]: any;
        };
      };
    };
    Functions: {
      [function_name: string]: {
        Args: Record<string, unknown>;
        Returns: any;
      };
    };
    Enums: {
      [enum_name: string]: string;
    };
  };
}
