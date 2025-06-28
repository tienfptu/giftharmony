import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export const productService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  },

  // Get all products with category info
  async getProducts(filters?: {
    category?: string
    search?: string
    minPrice?: number
    maxPrice?: number
    rating?: number
    isPopular?: boolean
    isTrending?: boolean
  }): Promise<(Product & { category: Category | null })[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_active', true)

    if (filters?.category) {
      query = query.eq('categories.name', filters.category)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice)
    }

    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }

    if (filters?.rating) {
      query = query.gte('rating', filters.rating)
    }

    if (filters?.isPopular) {
      query = query.eq('is_popular', true)
    }

    if (filters?.isTrending) {
      query = query.eq('is_trending', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get product by ID
  async getProductById(id: string): Promise<(Product & { category: Category | null }) | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Get featured products
  async getFeaturedProducts(): Promise<(Product & { category: Category | null })[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_active', true)
      .or('is_popular.eq.true,is_trending.eq.true')
      .order('rating', { ascending: false })
      .limit(8)

    if (error) throw error
    return data || []
  },

  // Get products by category
  async getProductsByCategory(categoryName: string): Promise<(Product & { category: Category | null })[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(*)
      `)
      .eq('is_active', true)
      .eq('categories.name', categoryName)
      .order('rating', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Search products
  async searchProducts(query: string): Promise<(Product & { category: Category | null })[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('rating', { ascending: false })

    if (error) throw error
    return data || []
  }
}