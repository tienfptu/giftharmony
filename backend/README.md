# GiftHarmony Backend API

A comprehensive Node.js backend for the GiftHarmony e-commerce platform with PostgreSQL database and JWT authentication.

## Features

- 🔐 JWT Authentication & Authorization
- 👥 User Management (Customer & Admin roles)
- 🛍️ Product Management with Categories
- 🛒 Shopping Cart & Wishlist
- 📦 Order Management with Status Tracking
- ⭐ Product Reviews & Ratings
- 🎫 Promotion & Discount System
- 📊 Admin Dashboard with Analytics
- 🔒 Security with Rate Limiting & Validation
- 📱 RESTful API Design

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Update the following variables in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure secret key for JWT tokens
- `FRONTEND_URL`: Your frontend application URL

### 3. Database Setup

Run migrations to create database tables:

```bash
npm run migrate
```

Seed the database with sample data:

```bash
npm run seed
```

### 4. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get single category
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Wishlist
- `GET /api/wishlist` - Get wishlist items
- `POST /api/wishlist/items` - Add item to wishlist
- `DELETE /api/wishlist/items/:product_id` - Remove item from wishlist
- `POST /api/wishlist/toggle` - Toggle wishlist item

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status (Admin only)
- `PATCH /api/orders/:id/cancel` - Cancel order

### Reviews
- `GET /api/reviews/product/:product_id` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/helpful` - Mark review as helpful

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `GET /api/users/stats` - Get user statistics

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/status` - Toggle user status
- `GET /api/admin/analytics` - Analytics data

## Database Schema

### Users
- User authentication and profile information
- Role-based access control (customer/admin)
- Points and loyalty level system

### Products
- Product catalog with categories
- Inventory management
- Rating and review system
- Featured and popular product flags

### Orders
- Complete order lifecycle management
- Order items with pricing history
- Payment and shipping tracking
- Status updates and notifications

### Reviews
- Product reviews and ratings
- Verified purchase validation
- Helpful votes system
- Admin moderation

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- SQL injection prevention with parameterized queries

## Default Accounts

After seeding the database, you can use these accounts:

**Admin Account:**
- Email: `admin@giftharmony.vn`
- Password: `admin123`

**Customer Account:**
- Email: `customer@example.com`
- Password: `customer123`

## Development

### Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product routes
│   ├── categories.js        # Category routes
│   ├── orders.js            # Order routes
│   ├── cart.js              # Cart routes
│   ├── wishlist.js          # Wishlist routes
│   ├── reviews.js           # Review routes
│   ├── users.js             # User routes
│   └── admin.js             # Admin routes
├── scripts/
│   ├── migrate.js           # Database migrations
│   └── seed.js              # Database seeding
├── .env                     # Environment variables
├── server.js                # Main server file
└── package.json
```

### Adding New Features

1. Create new route files in `/routes`
2. Add middleware for authentication/validation
3. Update database schema in `/scripts/migrate.js`
4. Add sample data in `/scripts/seed.js`
5. Test endpoints with proper error handling

## Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure production database URL
3. Set secure JWT secret
4. Enable SSL for database connections
5. Configure CORS for your frontend domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.