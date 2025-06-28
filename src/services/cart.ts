import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type CartItem = Database['public']['Tables']['cart_items']['Row']
type Product = Database['public']['Tables']['products']['Row']

export interface CartItemWithProduct extends CartItem {
  product: Product
}

export const cartService = {
  // Get user's cart items
  async getCartItems(userId: string): Promise<CartItemWithProduct[]> {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Add item to cart
  async addToCart(userId: string, productId: string, quantity: number = 1) {
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (existingItem) {
      // Update quantity
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  // Update cart item quantity
  async updateCartItem(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(userId, productId)
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Remove item from cart
  async removeFromCart(userId: string, productId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
  },

  // Clear entire cart
  async clearCart(userId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  },

  // Get cart total
  async getCartTotal(userId: string): Promise<{ subtotal: number; itemCount: number }> {
    const items = await this.getCartItems(userId)
    
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return { subtotal, itemCount }
  }
}