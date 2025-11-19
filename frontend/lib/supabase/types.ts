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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      opportunities: {
        Row: {
          ai_parsed_data: Json | null
          company_name: string
          created_at: string | null
          deadline: string | null
          description: string | null
          expired_at: string | null
          id: string
          job_title: string
          location: string | null
          offers_sponsorship: boolean
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          relevant_majors: Json | null
          requires_us_citizenship: boolean
          requirements: string | null
          role_type: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          submitted_by: string
          url: string
        }
        Insert: {
          ai_parsed_data?: Json | null
          company_name: string
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          expired_at?: string | null
          id?: string
          job_title: string
          location?: string | null
          offers_sponsorship?: boolean
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          relevant_majors?: Json | null
          requires_us_citizenship?: boolean
          requirements?: string | null
          role_type?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          submitted_by: string
          url: string
        }
        Update: {
          ai_parsed_data?: Json | null
          company_name?: string
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          expired_at?: string | null
          id?: string
          job_title?: string
          location?: string | null
          offers_sponsorship?: boolean
          opportunity_type?: Database["public"]["Enums"]["opportunity_type"]
          relevant_majors?: Json | null
          requires_us_citizenship?: boolean
          requirements?: string | null
          role_type?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          submitted_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          country: string | null
          created_at: string | null
          email: string
          email_notifications_enabled: boolean | null
          daily_digest_enabled: boolean | null
          deadline_reminders_enabled: boolean | null
          daily_digest_time: string | null
          last_digest_sent_at: string | null
          gender: string | null
          id: string
          major: string | null
          name: string
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          email_notifications_enabled?: boolean | null
          daily_digest_enabled?: boolean | null
          deadline_reminders_enabled?: boolean | null
          daily_digest_time?: string | null
          last_digest_sent_at?: string | null
          gender?: string | null
          id?: string
          major?: string | null
          name: string
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          email_notifications_enabled?: boolean | null
          daily_digest_enabled?: boolean | null
          deadline_reminders_enabled?: boolean | null
          daily_digest_time?: string | null
          last_digest_sent_at?: string | null
          gender?: string | null
          id?: string
          major?: string | null
          name?: string
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_opportunities: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          status: 'saved' | 'applied'
          applied_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          opportunity_id: string
          status: 'saved' | 'applied'
          applied_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          opportunity_id?: string
          status?: 'saved' | 'applied'
          applied_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      email_queue: {
        Row: {
          id: string
          user_id: string
          email_type: 'daily_digest' | 'deadline_reminder'
          subject: string
          html_content: string
          text_content: string | null
          status: 'pending' | 'processing' | 'sent' | 'failed'
          error_message: string | null
          retry_count: number
          max_retries: number
          scheduled_for: string
          processed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email_type: 'daily_digest' | 'deadline_reminder'
          subject: string
          html_content: string
          text_content?: string | null
          status?: 'pending' | 'processing' | 'sent' | 'failed'
          error_message?: string | null
          retry_count?: number
          max_retries?: number
          scheduled_for: string
          processed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email_type?: 'daily_digest' | 'deadline_reminder'
          subject?: string
          html_content?: string
          text_content?: string | null
          status?: 'pending' | 'processing' | 'sent' | 'failed'
          error_message?: string | null
          retry_count?: number
          max_retries?: number
          scheduled_for?: string
          processed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      email_logs: {
        Row: {
          id: string
          user_id: string
          email_type: 'daily_digest' | 'deadline_reminder'
          subject: string
          opportunity_ids: Json
          sent_at: string | null
          resend_message_id: string | null
          status: 'sent' | 'failed' | 'bounced'
        }
        Insert: {
          id?: string
          user_id: string
          email_type: 'daily_digest' | 'deadline_reminder'
          subject: string
          opportunity_ids?: Json
          sent_at?: string | null
          resend_message_id?: string | null
          status?: 'sent' | 'failed' | 'bounced'
        }
        Update: {
          id?: string
          user_id?: string
          email_type?: 'daily_digest' | 'deadline_reminder'
          subject?: string
          opportunity_ids?: Json
          sent_at?: string | null
          resend_message_id?: string | null
          status?: 'sent' | 'failed' | 'bounced'
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          user_id: string | null
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          subject: string
          description: string
          page_url: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          admin_notes: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          subject: string
          description: string
          page_url?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          admin_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          subject?: string
          description?: string
          page_url?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          admin_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user: { Args: never; Returns: undefined }
    }
    Enums: {
      opportunity_status: "active" | "expired"
      opportunity_type:
        | "internship"
        | "full_time"
        | "research"
        | "fellowship"
        | "scholarship"
      user_role: "student" | "admin"
      feedback_status: "new" | "in_progress" | "resolved"
      feedback_type: "bug" | "feature_request" | "general" | "other"
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
    Enums: {
      opportunity_status: ["active", "expired"],
      opportunity_type: [
        "internship",
        "full_time",
        "research",
        "fellowship",
        "scholarship",
      ],
      user_role: ["student", "admin"],
      feedback_status: ["new", "in_progress", "resolved"],
      feedback_type: ["bug", "feature_request", "general", "other"],
    },
  },
} as const
