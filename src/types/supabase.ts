// This file is a direct copy from the Next.js web app
// It defines the database schema types

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
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          subject: string
          message: string
          status: 'new' | 'in_progress' | 'resolved' | 'archived'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          subject: string
          message: string
          status?: 'new' | 'in_progress' | 'resolved' | 'archived'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          subject?: string
          message?: string
          status?: 'new' | 'in_progress' | 'resolved' | 'archived'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          venue_id: string
          player_name: string
          player_phone: string
          player_email: string | null
          booking_date: string
          start_time: string
          end_time: string
          total_hours: number
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          whatsapp_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          player_name: string
          player_phone: string
          player_email?: string | null
          booking_date: string
          start_time: string
          end_time: string
          total_hours: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          whatsapp_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          player_name?: string
          player_phone?: string
          player_email?: string | null
          booking_date?: string
          start_time?: string
          end_time?: string
          total_hours?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          whatsapp_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          whatsapp_number: string | null
          role: 'venue_owner' | 'player' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          whatsapp_number?: string | null
          role?: 'venue_owner' | 'player' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          whatsapp_number?: string | null
          role?: 'venue_owner' | 'player' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          slug: string
          sport_type: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel'
          city: string
          province: string | null
          area: string | null
          sub_area: string | null
          address: string
          description: string | null
          amenities: string[] | null
          price_per_hour: number
          opening_time: string | null
          closing_time: string | null
          is_24_7: boolean
          whatsapp_number: string
          google_maps_url: string | null
          subdomain: string | null
          is_featured: boolean
          status: 'pending' | 'approved' | 'rejected' | 'inactive'
          featured: boolean
          rating: number
          total_bookings: number
          logo_url: string | null
          tagline: string | null
          facebook_url: string | null
          instagram_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name: string
          slug: string
          sport_type: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel'
          city: string
          province?: string | null
          area?: string | null
          sub_area?: string | null
          address: string
          description?: string | null
          amenities?: string[] | null
          price_per_hour: number
          opening_time?: string | null
          closing_time?: string | null
          is_24_7?: boolean
          whatsapp_number: string
          google_maps_url?: string | null
          subdomain?: string | null
          is_featured?: boolean
          status?: 'pending' | 'approved' | 'rejected' | 'inactive'
          featured?: boolean
          rating?: number
          total_bookings?: number
          logo_url?: string | null
          tagline?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          name?: string
          slug?: string
          sport_type?: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel'
          city?: string
          province?: string | null
          area?: string | null
          sub_area?: string | null
          address?: string
          description?: string | null
          amenities?: string[] | null
          price_per_hour?: number
          opening_time?: string | null
          closing_time?: string | null
          is_24_7?: boolean
          google_maps_url?: string | null
          subdomain?: string | null
          is_featured?: boolean
          whatsapp_number?: string
          status?: 'pending' | 'approved' | 'rejected' | 'inactive'
          featured?: boolean
          rating?: number
          total_bookings?: number
          logo_url?: string | null
          tagline?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      venue_photos: {
        Row: {
          id: string
          venue_id: string
          photo_url: string
          is_primary: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          photo_url: string
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          photo_url?: string
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_photos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      venue_reviews: {
        Row: {
          id: string
          venue_id: string
          customer_name: string
          customer_photo_url: string | null
          rating: number
          review_text: string
          photo_urls: string[] | null
          date: string
          is_featured: boolean
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          customer_name: string
          customer_photo_url?: string | null
          rating: number
          review_text: string
          photo_urls?: string[] | null
          date: string
          is_featured?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          customer_name?: string
          customer_photo_url?: string | null
          rating?: number
          review_text?: string
          photo_urls?: string[] | null
          date?: string
          is_featured?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      special_offers: {
        Row: {
          id: string
          venue_id: string
          offer_name: string
          description: string | null
          original_price: number
          offer_price: number
          discount_percentage: number | null
          valid_from: string
          valid_until: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          offer_name: string
          description?: string | null
          original_price: number
          offer_price: number
          discount_percentage?: number | null
          valid_from: string
          valid_until: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          offer_name?: string
          description?: string | null
          original_price?: number
          offer_price?: number
          discount_percentage?: number | null
          valid_from?: string
          valid_until?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_offers_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      venue_pricing_rules: {
        Row: {
          id: string
          venue_id: string
          day_of_week: string
          start_time: string
          end_time: string
          price_per_hour: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          day_of_week: string
          start_time: string
          end_time: string
          price_per_hour: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          day_of_week?: string
          start_time?: string
          end_time?: string
          price_per_hour?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_pricing_rules_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_venue_slug: {
        Args: {
          venue_name: string
        }
        Returns: string
      }
      delete_user_account: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
