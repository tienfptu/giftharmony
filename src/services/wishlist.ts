import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type WishlistItem = Database['public']['Tables']['wishlist_items']['Row']
type Product = Database['public']['Tables']['products']['Row']

export interface WishlistItemWithProduct extends WishlistItem {
  product: Product
}

export const wishlistService = {
  // Get user's wishlist
  async getWishlist(userId: string): Promise<WishlistItemWithProduct[]> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Add item to wishlist
  async addToWishlist(userId: string, productId: string) {
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({
        user_id: userId,
        product_id: productId
      })
      .select()
      .single()

    if (error) {
      // If item already exists, ignore the error
      if (error.code === '23505') return null
      throw error
    }
    return data
  },

  // Remove item from wishlist
  async removeFromWishlist(userId: string, productId: string) {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
  },

  // Check if item is in wishlist
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return false
      throw error
    }
    return !!data
  },

  // Get wishlist item count
  async getWishlistCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('wishlist_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) throw error
    return count || 0
  }
}