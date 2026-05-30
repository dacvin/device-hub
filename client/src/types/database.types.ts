export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      department: {
        Row: {
          created_at: string
          id: string
          manager: string | null
          name: string
          primary_location: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager?: string | null
          name: string
          primary_location?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager?: string | null
          name?: string
          primary_location?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      device: {
        Row: {
          code: string
          condition: number
          cover_photo_id: string | null
          created_at: string
          deleted_at: string | null
          department_id: string
          group_id: string
          id: string
          import_date: string | null
          inventory_cycle_months: number
          last_check_date: string | null
          location: string | null
          manufacturer_id: string | null
          model: string | null
          name: string
          notes: string | null
          quantity: number
          serial_number: string | null
          source: Database["public"]["Enums"]["device_source"] | null
          specifications: string | null
          status: Database["public"]["Enums"]["device_status"]
          unit: Database["public"]["Enums"]["unit"]
          updated_at: string
          warranty_end: string | null
          warranty_start: string | null
        }
        Insert: {
          code: string
          condition?: number
          cover_photo_id?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id: string
          group_id: string
          id?: string
          import_date?: string | null
          inventory_cycle_months?: number
          last_check_date?: string | null
          location?: string | null
          manufacturer_id?: string | null
          model?: string | null
          name: string
          notes?: string | null
          quantity?: number
          serial_number?: string | null
          source?: Database["public"]["Enums"]["device_source"] | null
          specifications?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          unit?: Database["public"]["Enums"]["unit"]
          updated_at?: string
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Update: {
          code?: string
          condition?: number
          cover_photo_id?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string
          group_id?: string
          id?: string
          import_date?: string | null
          inventory_cycle_months?: number
          last_check_date?: string | null
          location?: string | null
          manufacturer_id?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          quantity?: number
          serial_number?: string | null
          source?: Database["public"]["Enums"]["device_source"] | null
          specifications?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          unit?: Database["public"]["Enums"]["unit"]
          updated_at?: string
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_cover_photo_fk"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "device_photo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "device_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturer"
            referencedColumns: ["id"]
          },
        ]
      }
      device_document: {
        Row: {
          created_at: string
          device_id: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          url: string
        }
        Insert: {
          created_at?: string
          device_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          url: string
        }
        Update: {
          created_at?: string
          device_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_document_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_document_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device_with_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      device_group: {
        Row: {
          created_at: string
          default_inventory_cycle_months: number
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_inventory_cycle_months?: number
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_inventory_cycle_months?: number
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_photo: {
        Row: {
          created_at: string
          device_id: string
          file_name: string | null
          id: string
          size_bytes: number | null
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          device_id: string
          file_name?: string | null
          id?: string
          size_bytes?: number | null
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          device_id?: string
          file_name?: string | null
          id?: string
          size_bytes?: number | null
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_photo_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_photo_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device_with_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturer: {
        Row: {
          created_at: string
          id: string
          name: string
          support_contact: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          support_contact?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          support_contact?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      device_with_flags: {
        Row: {
          code: string | null
          condition: number | null
          cover_photo_id: string | null
          created_at: string | null
          deleted_at: string | null
          department_id: string | null
          flag_inventory_overdue: boolean | null
          flag_warranty_expiring: boolean | null
          group_id: string | null
          id: string | null
          import_date: string | null
          inventory_cycle_months: number | null
          last_check_date: string | null
          location: string | null
          manufacturer_id: string | null
          model: string | null
          name: string | null
          notes: string | null
          quantity: number | null
          serial_number: string | null
          source: Database["public"]["Enums"]["device_source"] | null
          specifications: string | null
          status: Database["public"]["Enums"]["device_status"] | null
          unit: Database["public"]["Enums"]["unit"] | null
          updated_at: string | null
          warranty_end: string | null
          warranty_start: string | null
        }
        Insert: {
          code?: string | null
          condition?: number | null
          cover_photo_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department_id?: string | null
          flag_inventory_overdue?: never
          flag_warranty_expiring?: never
          group_id?: string | null
          id?: string | null
          import_date?: string | null
          inventory_cycle_months?: number | null
          last_check_date?: string | null
          location?: string | null
          manufacturer_id?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          quantity?: number | null
          serial_number?: string | null
          source?: Database["public"]["Enums"]["device_source"] | null
          specifications?: string | null
          status?: Database["public"]["Enums"]["device_status"] | null
          unit?: Database["public"]["Enums"]["unit"] | null
          updated_at?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Update: {
          code?: string | null
          condition?: number | null
          cover_photo_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department_id?: string | null
          flag_inventory_overdue?: never
          flag_warranty_expiring?: never
          group_id?: string | null
          id?: string | null
          import_date?: string | null
          inventory_cycle_months?: number | null
          last_check_date?: string | null
          location?: string | null
          manufacturer_id?: string | null
          model?: string | null
          name?: string | null
          notes?: string | null
          quantity?: number | null
          serial_number?: string | null
          source?: Database["public"]["Enums"]["device_source"] | null
          specifications?: string | null
          status?: Database["public"]["Enums"]["device_status"] | null
          unit?: Database["public"]["Enums"]["unit"] | null
          updated_at?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_cover_photo_fk"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "device_photo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "device_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturer"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      device_source: "Purchased" | "Leased" | "Donated" | "Transferred"
      device_status: "in-use" | "in-storage" | "in-repair" | "retired"
      unit: "piece" | "set" | "box"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      device_source: ["Purchased", "Leased", "Donated", "Transferred"],
      device_status: ["in-use", "in-storage", "in-repair", "retired"],
      unit: ["piece", "set", "box"],
    },
  },
} as const

