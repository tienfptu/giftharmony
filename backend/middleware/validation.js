const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    phone: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  product: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    price: Joi.number().positive().required(),
    category_id: Joi.number().integer().positive().required(),
    stock_quantity: Joi.number().integer().min(0).required(),
    image_url: Joi.string().uri().optional()
  }),

  category: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    image_url: Joi.string().uri().optional()
  })
};

module.exports = { validateRequest, schemas };