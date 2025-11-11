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
      categories: {
        Row: {
          created_at: string | null
          display_order: number
          icon: string
          id: string
          label: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          icon?: string
          id?: string
          label: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          icon?: string
          id?: string
          label?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      code_claims: {
        Row: {
          claimed_at: string
          claimed_by_username: string
          code: string
          code_id: string
          created_at: string
          final_amount: number
          id: string
          is_test_claim: boolean
          products_data: Json
          total_amount: number
          total_discount: number
        }
        Insert: {
          claimed_at?: string
          claimed_by_username: string
          code: string
          code_id: string
          created_at?: string
          final_amount: number
          id?: string
          is_test_claim?: boolean
          products_data: Json
          total_amount: number
          total_discount?: number
        }
        Update: {
          claimed_at?: string
          claimed_by_username?: string
          code?: string
          code_id?: string
          created_at?: string
          final_amount?: number
          id?: string
          is_test_claim?: boolean
          products_data?: Json
          total_amount?: number
          total_discount?: number
        }
        Relationships: [
          {
            foreignKeyName: "code_claims_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "redemption_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      code_products: {
        Row: {
          code_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_products_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "redemption_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          active: boolean | null
          applies_to: string | null
          category_id: string | null
          code: string
          created_at: string | null
          expires_at: string | null
          fixed_amount: number | null
          id: string
          percentage: number | null
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          applies_to?: string | null
          category_id?: string | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          fixed_amount?: number | null
          id?: string
          percentage?: number | null
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          applies_to?: string | null
          category_id?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          fixed_amount?: number | null
          id?: string
          percentage?: number | null
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          active: boolean | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          title: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          title?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          title?: string | null
        }
        Relationships: []
      }
      home_config: {
        Row: {
          about_content: string | null
          about_image_url: string | null
          about_title: string | null
          banner_image_url: string | null
          banner_subtitle: string | null
          banner_title: string | null
          created_at: string
          cta_button_text: string | null
          cta_section_description: string | null
          cta_section_title: string | null
          discord_link: string | null
          feature_1_description: string | null
          feature_1_icon: string | null
          feature_1_title: string | null
          feature_2_description: string | null
          feature_2_icon: string | null
          feature_2_title: string | null
          feature_3_description: string | null
          feature_3_icon: string | null
          feature_3_title: string | null
          features_title: string | null
          gallery_title: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          rules_content: string | null
          show_about_section: boolean | null
          show_banner: boolean | null
          show_cta_section: boolean | null
          show_features_section: boolean | null
          show_gallery: boolean | null
          updated_at: string
        }
        Insert: {
          about_content?: string | null
          about_image_url?: string | null
          about_title?: string | null
          banner_image_url?: string | null
          banner_subtitle?: string | null
          banner_title?: string | null
          created_at?: string
          cta_button_text?: string | null
          cta_section_description?: string | null
          cta_section_title?: string | null
          discord_link?: string | null
          feature_1_description?: string | null
          feature_1_icon?: string | null
          feature_1_title?: string | null
          feature_2_description?: string | null
          feature_2_icon?: string | null
          feature_2_title?: string | null
          feature_3_description?: string | null
          feature_3_icon?: string | null
          feature_3_title?: string | null
          features_title?: string | null
          gallery_title?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          rules_content?: string | null
          show_about_section?: boolean | null
          show_banner?: boolean | null
          show_cta_section?: boolean | null
          show_features_section?: boolean | null
          show_gallery?: boolean | null
          updated_at?: string
        }
        Update: {
          about_content?: string | null
          about_image_url?: string | null
          about_title?: string | null
          banner_image_url?: string | null
          banner_subtitle?: string | null
          banner_title?: string | null
          created_at?: string
          cta_button_text?: string | null
          cta_section_description?: string | null
          cta_section_title?: string | null
          discord_link?: string | null
          feature_1_description?: string | null
          feature_1_icon?: string | null
          feature_1_title?: string | null
          feature_2_description?: string | null
          feature_2_icon?: string | null
          feature_2_title?: string | null
          feature_3_description?: string | null
          feature_3_icon?: string | null
          feature_3_title?: string | null
          features_title?: string | null
          gallery_title?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          rules_content?: string | null
          show_about_section?: boolean | null
          show_banner?: boolean | null
          show_cta_section?: boolean | null
          show_features_section?: boolean | null
          show_gallery?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category_id: string
          coming_soon: boolean | null
          created_at: string | null
          description: string | null
          details: string | null
          discounted_price: number | null
          display_order: number
          id: string
          limited: boolean | null
          limited_end_date: string | null
          limited_start_date: string | null
          name: string
          photo_display_count: number | null
          price: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category_id: string
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string | null
          details?: string | null
          discounted_price?: number | null
          display_order?: number
          id?: string
          limited?: boolean | null
          limited_end_date?: string | null
          limited_start_date?: string | null
          name: string
          photo_display_count?: number | null
          price: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string | null
          details?: string | null
          discounted_price?: number | null
          display_order?: number
          id?: string
          limited?: boolean | null
          limited_end_date?: string | null
          limited_start_date?: string | null
          name?: string
          photo_display_count?: number | null
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_codes: {
        Row: {
          active: boolean
          claimed_at: string | null
          claimed_by_username: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          is_test_code: boolean
          notes: string | null
          scheduled_start: string | null
        }
        Insert: {
          active?: boolean
          claimed_at?: string | null
          claimed_by_username?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_test_code?: boolean
          notes?: string | null
          scheduled_start?: string | null
        }
        Update: {
          active?: boolean
          claimed_at?: string | null
          claimed_by_username?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_test_code?: boolean
          notes?: string | null
          scheduled_start?: string | null
        }
        Relationships: []
      }
      rules_sections: {
        Row: {
          active: boolean | null
          content: string
          created_at: string
          display_order: number
          icon: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "super_admin"
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
      app_role: ["admin", "super_admin"],
    },
  },
} as const
