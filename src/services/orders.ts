import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']

export interface CreateOrderData {
  payment_method: string
  shipping_info: {
    full_name: string
    phone: string
    email: string
    address: string
    city: string
    district: string
    ward: string
    notes?: string
  }
  items: Array<{
    product_id: string
    quantity: number
    price: number
  }>
  subtotal: number
  discount?: number
  shipping_fee: number
  total: number
  promo_code?: string
}

export const orderService = {
  // Create new order
  async createOrder(userId: string, orderData: CreateOrderData) {
    // Generate order number
    const orderNumber = `GH${Date.now().toString().slice(-8)}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        payment_method: orderData.payment_method,
        subtotal: orderData.subtotal,
        discount: orderData.discount || 0,
        shipping_fee: orderData.shipping_fee,
        total: orderData.total,
        shipping_info: orderData.shipping_info
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Clear cart after successful order
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    return order
  },

  // Get user's orders
  async getUserOrders(userId: string): Promise<(Order & { items: (OrderItem & { product: any })[] })[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get order by ID
  async getOrderById(userId: string, orderId: string): Promise<(Order & { items: (OrderItem & { product: any })[] }) | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
    const updates: any = { status }
    
    if (trackingNumber) {
      updates.tracking_number = trackingNumber
    }
    
    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}