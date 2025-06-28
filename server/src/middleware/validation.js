import Joi from 'joi';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    
    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Product schemas
  createProduct: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(2000).optional(),
    price: Joi.number().positive().required(),
    original_price: Joi.number().positive().optional(),
    category_id: Joi.number().integer().positive().required(),
    brand: Joi.string().max(100).optional(),
    sku: Joi.string().max(50).optional(),
    stock_quantity: Joi.number().integer().min(0).required(),
    min_stock: Joi.number().integer().min(0).optional(),
    max_stock: Joi.number().integer().min(0).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    specifications: Joi.object().optional(),
    is_featured: Joi.boolean().optional(),
    is_popular: Joi.boolean().optional(),
    is_trending: Joi.boolean().optional()
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    description: Joi.string().max(2000).optional(),
    price: Joi.number().positive().optional(),
    original_price: Joi.number().positive().optional(),
    category_id: Joi.number().integer().positive().optional(),
    brand: Joi.string().max(100).optional(),
    stock_quantity: Joi.number().integer().min(0).optional(),
    min_stock: Joi.number().integer().min(0).optional(),
    max_stock: Joi.number().integer().min(0).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    features: Joi.array().items(Joi.string()).optional(),
    specifications: Joi.object().optional(),
    is_active: Joi.boolean().optional(),
    is_featured: Joi.boolean().optional(),
    is_popular: Joi.boolean().optional(),
    is_trending: Joi.boolean().optional()
  }),

  // Order schemas
  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required()
      })
    ).min(1).required(),
    payment_method: Joi.string().valid('cod', 'bank_transfer', 'momo', 'vnpay').required(),
    shipping_address: Joi.object({
      full_name: Joi.string().required(),
      phone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
      address: Joi.string().required(),
      city: Joi.string().required(),
      district: Joi.string().required(),
      ward: Joi.string().required()
    }).required(),
    notes: Joi.string().max(500).optional(),
    promotion_code: Joi.string().optional()
  }),

  // Cart schemas
  addToCart: Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required()
  }),

  updateCartItem: Joi.object({
    quantity: Joi.number().integer().positive().required()
  }),

  // Review schemas
  createReview: Joi.object({
    product_id: Joi.number().integer().positive().required(),
    order_id: Joi.number().integer().positive().optional(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(200).optional(),
    comment: Joi.string().max(1000).required()
  }),

  // Promotion schemas
  createPromotion: Joi.object({
    code: Joi.string().uppercase().min(3).max(20).required(),
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(500).optional(),
    type: Joi.string().valid('percentage', 'fixed_amount', 'free_shipping').required(),
    value: Joi.number().min(0).required(),
    min_order_amount: Joi.number().min(0).optional(),
    max_discount_amount: Joi.number().min(0).optional(),
    usage_limit: Joi.number().integer().min(1).optional(),
    start_date: Joi.date().required(),
    end_date: Joi.date().greater(Joi.ref('start_date')).required()
  }),

  // Parameter schemas
  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  // Query schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').optional()
  }),

  productQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    category: Joi.string().optional(),
    search: Joi.string().optional(),
    min_price: Joi.number().min(0).optional(),
    max_price: Joi.number().min(0).optional(),
    sort: Joi.string().valid('name', 'price', 'rating', 'created_at').optional(),
    order: Joi.string().valid('asc', 'desc').optional(),
    featured: Joi.boolean().optional(),
    popular: Joi.boolean().optional(),
    trending: Joi.boolean().optional()
  })
};