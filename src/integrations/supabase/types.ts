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
      app_users: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          event_id: string
          id: string
          response_status: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          event_id: string
          id?: string
          response_status?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          event_id?: string
          id?: string
          response_status?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean | null
          buffer_after: number | null
          buffer_before: number | null
          created_at: string | null
          description: string | null
          end_date: string
          google_meet_link: string | null
          id: string
          location: string | null
          mark_as_busy: boolean | null
          repeat_type: string | null
          start_date: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          buffer_after?: number | null
          buffer_before?: number | null
          created_at?: string | null
          description?: string | null
          end_date: string
          google_meet_link?: string | null
          id?: string
          location?: string | null
          mark_as_busy?: boolean | null
          repeat_type?: string | null
          start_date: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          buffer_after?: number | null
          buffer_before?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          google_meet_link?: string | null
          id?: string
          location?: string | null
          mark_as_busy?: boolean | null
          repeat_type?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inbox_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_templates: {
        Row: {
          color: string | null
          created_at: string | null
          default_duration: number | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_duration?: number | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_duration?: number | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          completed: boolean | null
          created_at: string | null
          deadline: string
          description: string | null
          id: string
          start_date: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          completed?: boolean | null
          created_at?: string | null
          deadline: string
          description?: string | null
          id?: string
          start_date: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          completed?: boolean | null
          created_at?: string | null
          deadline?: string
          description?: string | null
          id?: string
          start_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          allow_weekends: boolean | null
          auto_schedule: boolean | null
          buffer_between_tasks: number | null
          color: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allow_weekends?: boolean | null
          auto_schedule?: boolean | null
          buffer_between_tasks?: number | null
          color: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allow_weekends?: boolean | null
          auto_schedule?: boolean | null
          buffer_between_tasks?: number | null
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          allow_splitting: boolean | null
          buffer_after: number | null
          buffer_before: number | null
          can_start_from: string | null
          category: string | null
          completed: boolean | null
          created_at: string | null
          deadline: string
          dependencies: string[] | null
          description: string | null
          estimated_duration: number
          id: string
          priority: string | null
          project_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          split_duration: number | null
          task_type_id: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allow_splitting?: boolean | null
          buffer_after?: number | null
          buffer_before?: number | null
          can_start_from?: string | null
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          deadline: string
          dependencies?: string[] | null
          description?: string | null
          estimated_duration: number
          id?: string
          priority?: string | null
          project_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          split_duration?: number | null
          task_type_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allow_splitting?: boolean | null
          buffer_after?: number | null
          buffer_before?: number | null
          can_start_from?: string | null
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          deadline?: string
          dependencies?: string[] | null
          description?: string | null
          estimated_duration?: number
          id?: string
          priority?: string | null
          project_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          split_duration?: number | null
          task_type_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      template_tasks: {
        Row: {
          allow_splitting: boolean | null
          buffer_after: number | null
          buffer_before: number | null
          category: string | null
          created_at: string | null
          day_offset: number | null
          dependencies: string[] | null
          description: string | null
          estimated_duration: number
          id: string
          priority: string | null
          split_duration: number | null
          task_type_id: string | null
          template_id: string | null
          title: string
        }
        Insert: {
          allow_splitting?: boolean | null
          buffer_after?: number | null
          buffer_before?: number | null
          category?: string | null
          created_at?: string | null
          day_offset?: number | null
          dependencies?: string[] | null
          description?: string | null
          estimated_duration: number
          id?: string
          priority?: string | null
          split_duration?: number | null
          task_type_id?: string | null
          template_id?: string | null
          title: string
        }
        Update: {
          allow_splitting?: boolean | null
          buffer_after?: number | null
          buffer_before?: number | null
          category?: string | null
          created_at?: string | null
          day_offset?: number | null
          dependencies?: string[] | null
          description?: string | null
          estimated_duration?: number
          id?: string
          priority?: string | null
          split_duration?: number | null
          task_type_id?: string | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          available: boolean | null
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          start_time: string
          task_type_id: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          start_time: string
          task_type_id?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          start_time?: string
          task_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
