export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          major: string | null
          role: 'student' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          major?: string | null
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          major?: string | null
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          url: string
          company_name: string
          job_title: string
          opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
          role_type: string | null
          relevant_majors: Json
          deadline: string | null
          requirements: string | null
          location: string | null
          description: string | null
          submitted_by: string
          status: 'active' | 'expired'
          created_at: string
          expired_at: string | null
          ai_parsed_data: Json | null
        }
        Insert: {
          id?: string
          url: string
          company_name: string
          job_title: string
          opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
          role_type?: string | null
          relevant_majors?: Json
          deadline?: string | null
          requirements?: string | null
          location?: string | null
          description?: string | null
          submitted_by: string
          status?: 'active' | 'expired'
          created_at?: string
          expired_at?: string | null
          ai_parsed_data?: Json | null
        }
        Update: {
          id?: string
          url?: string
          company_name?: string
          job_title?: string
          opportunity_type?: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
          role_type?: string | null
          relevant_majors?: Json
          deadline?: string | null
          requirements?: string | null
          location?: string | null
          description?: string | null
          submitted_by?: string
          status?: 'active' | 'expired'
          created_at?: string
          expired_at?: string | null
          ai_parsed_data?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'student' | 'admin'
      opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
      opportunity_status: 'active' | 'expired'
    }
  }
}

