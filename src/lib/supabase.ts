import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          address: string | null
          city: string | null
          district: string | null
          ward: string | null
          birth_date: string | null
          gender: string | null
          points: number
          level: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          district?: string | null
          ward?: string | null
          birth_date?: string | null
          gender?: string | null
          points?: number
          level?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          district?: string | null
          ward?: string | null
          birth_date?: string | null
          gender?: string | null
          points?: number
          level?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          color: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
          description?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          original_price: number | null
          category_id: string | null
          brand: string | null
          images: string[]
          features: string[]
          specifications: any
          stock_count: number
          max_quantity: number
          rating: number
          review_count: number
          is_popular: boolean
          is_trending: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          original_price?: number | null
          category_id?: string | null
          brand?: string | null
          images?: string[]
          features?: string[]
          specifications?: any
          stock_count?: number
          max_quantity?: number
          rating?: number
          review_count?: number
          is_popular?: boolean
          is_trending?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          original_price?: number | null
          category_id?: string | null
          brand?: string | null
          images?: string[]
          features?: string[]
          specifications?: any
          stock_count?: number
          max_quantity?: number
          rating?: number
          review_count?: number
          is_popular?: boolean
          is_trending?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          status: string
          payment_method: string
          payment_status: string
          subtotal: number
          discount: number
          shipping_fee: number
          total: number
          shipping_info: any
          notes: string | null
          tracking_number: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number: string
          status?: string
          payment_method: string
          payment_status?: string
          subtotal: number
          discount?: number
          shipping_fee?: number
          total: number
          shipping_info: any
          notes?: string | null
          tracking_number?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          status?: string
          payment_method?: string
          payment_status?: string
          subtotal?: number
          discount?: number
          shipping_fee?: number
          total?: number
          shipping_info?: any
          notes?: string | null
          tracking_number?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          product_id: string
          order_id: string | null
          rating: number
          title: string | null
          comment: string
          helpful_count: number
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          order_id?: string | null
          rating: number
          title?: string | null
          comment: string
          helpful_count?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          order_id?: string | null
          rating?: number
          title?: string | null
          comment?: string
          helpful_count?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      promotions: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          type: string
          value: number
          min_order: number
          max_discount: number | null
          usage_limit: number
          usage_count: number
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          type: string
          value: number
          min_order?: number
          max_discount?: number | null
          usage_limit?: number
          usage_count?: number
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          type?: string
          value?: number
          min_order?: number
          max_discount?: number | null
          usage_limit?: number
          usage_count?: number
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
      user_events: {
        Row: {
          id: string
          user_id: string
          title: string
          event_date: string
          event_type: string
          description: string | null
          reminder_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          event_date: string
          event_type: string
          description?: string | null
          reminder_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          event_date?: string
          event_type?: string
          description?: string | null
          reminder_days?: number
          created_at?: string
          updated_at?: string
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
      [_ in never]: never
    }
  }
}