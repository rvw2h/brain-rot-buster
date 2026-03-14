export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_sessions: {
        Row: {
          id: string
          user_id: string | null
          started_at: string | null
          method: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          started_at?: string | null
          method?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          started_at?: string | null
          method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_scores: {
        Row: {
          coloring_score: number | null
          date: string
          delta_bonus: number | null
          id: string
          math_score: number | null
          memory_score: number | null
          total_score: number | null
          user_id: string | null
        }
        Insert: {
          coloring_score?: number | null
          date: string
          delta_bonus?: number | null
          id?: string
          math_score?: number | null
          memory_score?: number | null
          total_score?: number | null
          user_id?: string | null
        }
        Update: {
          coloring_score?: number | null
          date?: string
          delta_bonus?: number | null
          id?: string
          math_score?: number | null
          memory_score?: number | null
          total_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      math_question_log: {
        Row: {
          correct_answer: number
          expression: string
          id: string
          is_correct: boolean | null
          level: number | null
          session_id: string | null
          time_taken_ms: number | null
          user_answer: number | null
        }
        Insert: {
          correct_answer: number
          expression: string
          id?: string
          is_correct?: boolean | null
          level?: number | null
          session_id?: string | null
          time_taken_ms?: number | null
          user_answer?: number | null
        }
        Update: {
          correct_answer?: number
          expression?: string
          id?: string
          is_correct?: boolean | null
          level?: number | null
          session_id?: string | null
          time_taken_ms?: number | null
          user_answer?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "math_question_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_session_words: {
        Row: {
          id: string
          session_id: string | null
          was_recalled: boolean | null
          word: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          was_recalled?: boolean | null
          word: string
        }
        Update: {
          id?: string
          session_id?: string | null
          was_recalled?: boolean | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_session_words_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          accuracy_pct: number | null
          completed_at: string | null
          date: string
          game_type: string
          id: string
          is_best_of_hour: boolean | null
          metadata: Json | null
          score: number | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          accuracy_pct?: number | null
          completed_at?: string | null
          date: string
          game_type: string
          id?: string
          is_best_of_hour?: boolean | null
          metadata?: Json | null
          score?: number | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          accuracy_pct?: number | null
          completed_at?: string | null
          date?: string
          game_type?: string
          id?: string
          is_best_of_hour?: boolean | null
          metadata?: Json | null
          score?: number | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_word_history: {
        Row: {
          id: string
          last_seen: string
          user_id: string | null
          word_id: string | null
        }
        Insert: {
          id?: string
          last_seen: string
          user_id?: string | null
          word_id?: string | null
        }
        Update: {
          id?: string
          last_seen?: string
          user_id?: string | null
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_word_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_word_history_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "word_pool"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age: number | null
          city: string | null
          created_at: string | null
          first_name: string
          google_id: string | null
          id: string
          last_coloring_score: number | null
          last_math_score: number | null
          last_memory_score: number | null
          referral_code: string | null
        }
        Insert: {
          age?: number | null
          city?: string | null
          created_at?: string | null
          first_name: string
          google_id?: string | null
          id?: string
          last_coloring_score?: number | null
          last_math_score?: number | null
          last_memory_score?: number | null
          referral_code?: string | null
        }
        Update: {
          age?: number | null
          city?: string | null
          created_at?: string | null
          first_name?: string
          google_id?: string | null
          id?: string
          last_coloring_score?: number | null
          last_math_score?: number | null
          last_memory_score?: number | null
          referral_code?: string | null
        }
        Relationships: []
      }
      word_pool: {
        Row: {
          category: string
          id: string
          is_active: boolean | null
          week_index: number
          word: string
        }
        Insert: {
          category: string
          id?: string
          is_active?: boolean | null
          week_index: number
          word: string
        }
        Update: {
          category?: string
          id?: string
          is_active?: boolean | null
          week_index?: number
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
