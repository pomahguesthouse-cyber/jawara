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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author: string | null
          category: string
          content: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string
          slug: string
          title: string
        }
        Insert: {
          author?: string | null
          category?: string
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string
          slug: string
          title: string
        }
        Update: {
          author?: string | null
          category?: string
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          city: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          event_type: string
          id: string
          location: string | null
          slug: string
          start_at: string
          title: string
        }
        Insert: {
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          slug: string
          start_at: string
          title: string
        }
        Update: {
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          slug?: string
          start_at?: string
          title?: string
        }
        Relationships: []
      }
      hero_media_library: {
        Row: {
          created_at: string
          folder: string
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          folder?: string
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          folder?: string
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          btn_search: Json | null
          btn_text: string | null
          btn_to: string | null
          created_at: string
          device: string
          end_date: string | null
          id: string
          image: string
          internal_name: string | null
          priority_score: number
          settings: Json | null
          sort_order: number
          start_date: string | null
          status: string
          subtext: string
          tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          btn_search?: Json | null
          btn_text?: string | null
          btn_to?: string | null
          created_at?: string
          device?: string
          end_date?: string | null
          id?: string
          image: string
          internal_name?: string | null
          priority_score?: number
          settings?: Json | null
          sort_order?: number
          start_date?: string | null
          status?: string
          subtext: string
          tags?: string[] | null
          title: string
          type?: string
        }
        Update: {
          btn_search?: Json | null
          btn_text?: string | null
          btn_to?: string | null
          created_at?: string
          device?: string
          end_date?: string | null
          id?: string
          image?: string
          internal_name?: string | null
          priority_score?: number
          settings?: Json | null
          sort_order?: number
          start_date?: string | null
          status?: string
          subtext?: string
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: Json
          is_published: boolean
          name: string
          original_price: number | null
          price: number
          promo_expires_at: string | null
          promo_text: string | null
          promo_type: string | null
          stock: number
          umkm_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          is_published?: boolean
          name: string
          original_price?: number | null
          price?: number
          promo_expires_at?: string | null
          promo_text?: string | null
          promo_type?: string | null
          stock?: number
          umkm_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          is_published?: boolean
          name?: string
          original_price?: number | null
          price?: number
          promo_expires_at?: string | null
          promo_text?: string | null
          promo_type?: string | null
          stock?: number
          umkm_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_umkm_id_fkey"
            columns: ["umkm_id"]
            isOneToOne: false
            referencedRelation: "umkm_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      umkm_profiles: {
        Row: {
          address: string | null
          banner_url: string | null
          category_id: string | null
          city: string
          created_at: string
          description: string | null
          district: string | null
          email: string | null
          facebook: string | null
          google_maps_url: string | null
          id: string
          instagram: string | null
          is_published: boolean
          is_verified: boolean
          logo_url: string | null
          name: string
          owner_id: string
          rating: number | null
          slug: string
          tiktok: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          category_id?: string | null
          city?: string
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          rating?: number | null
          slug: string
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          category_id?: string | null
          city?: string
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          rating?: number | null
          slug?: string
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "umkm_profiles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "super_admin" | "umkm_owner"
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
      app_role: ["super_admin", "umkm_owner"],
    },
  },
} as const
