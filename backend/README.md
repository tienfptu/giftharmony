# E-commerce Backend API

A RESTful API for an e-commerce application built with Node.js, Express, and MySQL.

## Features

- User authentication and authorization
- Product management
- Category management
- Shopping cart functionality
- Order processing
- Wishlist management
- Product reviews
- Admin dashboard with analytics

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a MySQL database named `ecommerce_db`

4. Copy `.env.example` to `.env` and update the configuration:
   ```bash
   cp .env.example .env
   ```

5. Run database migrations:
   ```bash
   npm run migrate
   ```

6. Seed the database with sample data:
   ```bash
   npm run seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create order
- `GET /api/orders/admin` - Get all orders (Admin only)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add item to wishlist
- `DELETE /api/wishlist/:id` - Remove item from wishlist

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/analytics/sales` - Get sales analytics
- `GET /api/admin/analytics/products` - Get product analytics

## Environment Variables

- `DB_HOST` - Database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time
- `PORT` - Server port
- `FRONTEND_URL` - Frontend URL for CORS

## Database Schema

The application uses the following main tables:
- `users` - User accounts
- `categories` - Product categories
- `products` - Product catalog
- `orders` - Customer orders
- `order_items` - Order line items
- `cart` - Shopping cart items
- `wishlist` - User wishlists
- `reviews` - Product reviews

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation using Joi
- SQL injection protection with parameterized queries
- CORS configuration for cross-origin requests