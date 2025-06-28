import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Promotion = Database['public']['Tables']['promotions']['Row']

export const promotionService = {
  // Get active promotions
  async getActivePromotions(): Promise<Promotion[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get promotion by code
  async getPromotionByCode(code: string): Promise<Promotion | null> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Validate promotion for order
  async validatePromotion(code: string, orderTotal: number, userId?: string): Promise<{
    valid: boolean
    promotion?: Promotion
    error?: string
  }> {
    const promotion = await this.getPromotionByCode(code)
    
    if (!promotion) {
      return { valid: false, error: 'Mã khuyến mãi không tồn tại hoặc đã hết hạn' }
    }

    if (orderTotal < promotion.min_order) {
      return { 
        valid: false, 
        error: `Đơn hàng tối thiểu ${promotion.min_order.toLocaleString('vi-VN')}đ để sử dụng mã này` 
      }
    }

    if (promotion.usage_count >= promotion.usage_limit) {
      return { valid: false, error: 'Mã khuyến mãi đã hết lượt sử dụng' }
    }

    // Check if user has already used this promotion (if user is provided)
    if (userId) {
      const { data: usage } = await supabase
        .from('promotion_usage')
        .select('id')
        .eq('user_id', userId)
        .eq('promotion_id', promotion.id)
        .single()

      if (usage) {
        return { valid: false, error: 'Bạn đã sử dụng mã khuyến mãi này rồi' }
      }
    }

    return { valid: true, promotion }
  },

  // Apply promotion to order
  async applyPromotion(userId: string, promotionId: string, orderId: string) {
    // Record promotion usage
    const { error: usageError } = await supabase
      .from('promotion_usage')
      .insert({
        user_id: userId,
        promotion_id: promotionId,
        order_id: orderId
      })

    if (usageError) throw usageError

    // Increment usage count
    const { error: updateError } = await supabase
      .rpc('increment_promotion_usage', { promotion_id: promotionId })

    if (updateError) throw updateError
  },

  // Calculate discount amount
  calculateDiscount(promotion: Promotion, orderTotal: number): number {
    switch (promotion.type) {
      case 'percentage':
        const percentageDiscount = (orderTotal * promotion.value) / 100
        return promotion.max_discount 
          ? Math.min(percentageDiscount, promotion.max_discount)
          : percentageDiscount
      
      case 'fixed_amount':
        return Math.min(promotion.value, orderTotal)
      
      case 'free_shipping':
        return 0 // Shipping fee will be set to 0 separately
      
      default:
        return 0
    }
  }
}