import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Review = Database['public']['Tables']['reviews']['Row']

export interface ReviewWithUser extends Review {
  user: {
    full_name: string
    avatar_url: string
  }
}

export const reviewService = {
  // Get reviews for a product
  async getProductReviews(productId: string): Promise<ReviewWithUser[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Create a review
  async createReview(
    userId: string,
    productId: string,
    rating: number,
    comment: string,
    title?: string,
    orderId?: string
  ) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        product_id: productId,
        rating,
        comment,
        title,
        order_id: orderId
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a review
  async updateReview(
    reviewId: string,
    userId: string,
    updates: {
      rating?: number
      comment?: string
      title?: string
    }
  ) {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a review
  async deleteReview(reviewId: string, userId: string) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId)

    if (error) throw error
  },

  // Mark review as helpful
  async markReviewHelpful(userId: string, reviewId: string) {
    const { data, error } = await supabase
      .from('review_helpful')
      .insert({
        user_id: userId,
        review_id: reviewId
      })
      .select()
      .single()

    if (error) {
      // If already marked as helpful, ignore
      if (error.code === '23505') return null
      throw error
    }
    return data
  },

  // Remove helpful mark
  async removeReviewHelpful(userId: string, reviewId: string) {
    const { error } = await supabase
      .from('review_helpful')
      .delete()
      .eq('user_id', userId)
      .eq('review_id', reviewId)

    if (error) throw error
  },

  // Get user's reviews
  async getUserReviews(userId: string): Promise<(Review & { product: any })[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}