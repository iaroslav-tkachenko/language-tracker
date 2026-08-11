export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_types: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          position: number
          system_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          system_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          system_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cefr_level_events: {
        Row: {
          board_id: string
          created_at: string
          effective_date: string
          id: string
          level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          effective_date: string
          id?: string
          level: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          effective_date?: string
          id?: string
          level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cefr_level_events_board_owner_fkey"
            columns: ["board_id", "user_id"]
            isOneToOne: false
            referencedRelation: "language_boards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "cefr_level_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      language_boards: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "language_boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_entries: {
        Row: {
          activity_type_id: string
          batch_id: string | null
          board_id: string
          created_at: string
          duration_minutes: number
          id: string
          study_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type_id: string
          batch_id?: string | null
          board_id: string
          created_at?: string
          duration_minutes: number
          id?: string
          study_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type_id?: string
          batch_id?: string | null
          board_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          study_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_entries_activity_owner_fkey"
            columns: ["activity_type_id", "user_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "study_entries_batch_owner_fkey"
            columns: ["batch_id", "user_id"]
            isOneToOne: false
            referencedRelation: "study_entry_batches"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "study_entries_board_owner_fkey"
            columns: ["board_id", "user_id"]
            isOneToOne: false
            referencedRelation: "language_boards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "study_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_entry_batches: {
        Row: {
          activity_type_id: string
          board_id: string
          created_at: string
          duration_minutes: number
          end_date: string
          id: string
          start_date: string
          user_id: string
        }
        Insert: {
          activity_type_id: string
          board_id: string
          created_at?: string
          duration_minutes: number
          end_date: string
          id: string
          start_date: string
          user_id: string
        }
        Update: {
          activity_type_id?: string
          board_id?: string
          created_at?: string
          duration_minutes?: number
          end_date?: string
          id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_entry_batches_activity_owner_fkey"
            columns: ["activity_type_id", "user_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "study_entry_batches_board_owner_fkey"
            columns: ["board_id", "user_id"]
            isOneToOne: false
            referencedRelation: "language_boards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "study_entry_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vocabulary_daily_totals: {
        Row: {
          board_id: string
          created_at: string
          id: string
          study_date: string
          updated_at: string
          user_id: string
          words_learned: number
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          study_date: string
          updated_at?: string
          user_id: string
          words_learned: number
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          study_date?: string
          updated_at?: string
          user_id?: string
          words_learned?: number
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_daily_totals_board_owner_fkey"
            columns: ["board_id", "user_id"]
            isOneToOne: false
            referencedRelation: "language_boards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "vocabulary_daily_totals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vocabulary_total_batches: {
        Row: {
          board_id: string
          created_at: string
          end_date: string
          id: string
          inserted_count: number
          start_date: string
          updated_count: number
          user_id: string
          words_learned: number
        }
        Insert: {
          board_id: string
          created_at?: string
          end_date: string
          id: string
          inserted_count?: number
          start_date: string
          updated_count?: number
          user_id: string
          words_learned: number
        }
        Update: {
          board_id?: string
          created_at?: string
          end_date?: string
          id?: string
          inserted_count?: number
          start_date?: string
          updated_count?: number
          user_id?: string
          words_learned?: number
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_total_batches_board_owner_fkey"
            columns: ["board_id", "user_id"]
            isOneToOne: false
            referencedRelation: "language_boards"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "vocabulary_total_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assert_cefr_history_has_no_adjacent_duplicates: {
        Args: { p_board_id: string; p_user_id: string }
        Returns: undefined
      }
      create_cefr_level_event: {
        Args: {
          p_board_id: string
          p_effective_date: string
          p_level: string
          p_local_today: string
        }
        Returns: {
          board_id: string
          created_at: string
          effective_date: string
          id: string
          level: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "cefr_level_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_or_restore_activity_type: {
        Args: { p_name: string }
        Returns: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          position: number
          system_key: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "activity_types"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_or_restore_language_board: {
        Args: { p_name: string }
        Returns: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "language_boards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_study_entry_batch: {
        Args: {
          p_activity_type_id: string
          p_board_id: string
          p_duration_minutes: number
          p_end_date: string
          p_operation_id: string
          p_start_date: string
        }
        Returns: {
          activity_type_id: string
          board_id: string
          created_at: string
          duration_minutes: number
          end_date: string
          id: string
          start_date: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "study_entry_batches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_vocabulary_total_batch: {
        Args: {
          p_board_id: string
          p_end_date: string
          p_operation_id: string
          p_start_date: string
          p_words_learned: number
        }
        Returns: {
          board_id: string
          created_at: string
          end_date: string
          id: string
          inserted_count: number
          start_date: string
          updated_count: number
          user_id: string
          words_learned: number
        }
        SetofOptions: {
          from: "*"
          to: "vocabulary_total_batches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_cefr_level_event: {
        Args: { p_event_id: string }
        Returns: {
          board_id: string
          created_at: string
          effective_date: string
          id: string
          level: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "cefr_level_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_cefr_level_event: {
        Args: {
          p_effective_date: string
          p_event_id: string
          p_level: string
          p_local_today: string
        }
        Returns: {
          board_id: string
          created_at: string
          effective_date: string
          id: string
          level: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "cefr_level_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_vocabulary_daily_total: {
        Args: {
          p_board_id: string
          p_study_date: string
          p_words_learned: number
        }
        Returns: {
          board_id: string
          created_at: string
          id: string
          study_date: string
          updated_at: string
          user_id: string
          words_learned: number
        }
        SetofOptions: {
          from: "*"
          to: "vocabulary_daily_totals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
