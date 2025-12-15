# E-Commerce Backend (OLX-Style Marketplace)

A production-ready, secure, and scalable backend for an OLX-style C2C/B2C marketplace built with Node.js, Express, TypeScript, Prisma, and Supabase.

## 🌟 Overview

This backend powers a full-featured marketplace where users can buy and sell products, manage carts and orders, leave reviews, communicate with sellers, and more. Built with security, scalability, and code quality as top priorities.

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Secure password hashing with bcrypt
- Role-based access control (User, Admin)
- Token refresh mechanism
- Protected routes with middleware

### 👤 User Management
- User registration and login
- Profile management (name, phone, bio)
- Password change functionality
- Email verification (stub for future implementation)
- Seller verification tracking

### 🛍️ Product Management
- Create, read, update, delete products
- Multi-image upload to Supabase Storage
- Product filtering by category, city, price range
- **Pagination** with customizable page size (max 100)
- **Sorting** by createdAt, price, or views
- **View counter** - tracks product popularity
- Product status: AVAILABLE, PENDING, SOLD, ARCHIVED
- Product condition: NEW, LIKE_NEW, USED, FOR_PARTS
- Stock management with atomic operations
- Seller ownership verification

### 🛒 Cart System
- Add/remove/update cart items
- **Stock validation** - prevents adding more than available
- **Product availability check** - only AVAILABLE products can be added
- Automatic cart clearing after order placement
- Prevents sellers from adding own products to cart

### 📦 Order Management
- Create orders from cart
- **Atomic stock decrement** - prevents overselling
- **Transaction safety** - all-or-nothing order creation
- Order status tracking
- Payment integration with Stripe
- Pagination for order listings
- Filter orders by status
- Admin order management

### 💳 Payment Processing
- Stripe Checkout integration
- Webhook handling for payment events
- Payment status tracking (PENDING, SUCCEEDED, FAILED, REFUNDED)
- Idempotency keys to prevent duplicate charges
- Refund tracking and management

### ⭐ Review System
- Add, update, delete reviews
- Rating system (1-5 stars)
- **Ownership enforcement** - sellers cannot review own products
- One review per user per product
- Pagination for review listings
- Filter by rating range

### 💚 Wishlist
- Add/remove products from wishlist
- **Product validation** - ensures product exists
- Duplicate prevention
- View all wishlist items

### 💬 Messaging System
- User-to-user conversations about products
- Start or retrieve existing conversations
- Send messages within conversations
- Participant verification
- Conversation history

### 🚩 Reporting System
- Report inappropriate products
- Admin-only report management
- Duplicate report prevention
- Report resolution tracking

## 🔒 Security Features

### Input Validation
- **Zod schemas** for all API endpoints
- Comprehensive validation for:
  - Email format
  - Password strength (min 6 characters)
  - UUID validation for IDs
  - Rating bounds (1-5)
  - String length limits
  - Type coercion and sanitization

### Data Protection
- Centralized sanitization functions
- Sensitive data exclusion (passwords, tokens)
- SQL injection prevention via Prisma
- XSS protection through validation

### Access Control
- Authentication middleware on protected routes
- Admin-only endpoints
- Ownership verification for:
  - Product modifications
  - Review management
  - Cart operations
  - Order access

### Rate Limiting
- In-memory rate limiting
- Configurable limits per endpoint
- Automatic cleanup of expired entries

## 📡 API Endpoints

### Authentication
```
POST   /api/user/register          - Register new user
POST   /api/user/login             - Login user
POST   /api/user/logout            - Logout user (auth)
POST   /api/user/refresh-token     - Refresh access token
POST   /api/user/change-password   - Change password (auth)
POST   /api/user/update-profile    - Update profile (auth)
GET    /api/user/profile           - Get user profile (auth)
GET    /api/user/send-email        - Send verification email (auth)
POST   /api/user/verify-email      - Verify email (auth)
```

### Products
```
GET    /api/product/list                    - List products with pagination & filters
GET    /api/product/get-product-details     - Get product details (increments views)
POST   /api/product/create                  - Create product (auth)
POST   /api/product/update-product-details  - Update product (auth, owner/admin)
POST   /api/product/delete                  - Delete product (auth, owner/admin)
POST   /api/product/add-product-images      - Add images (auth, owner/admin)
POST   /api/product/delete-product-images   - Delete images (auth, owner/admin)
```

**Query Parameters for List:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sortBy` (createdAt | price | views)
- `sortOrder` (asc | desc)
- `category`, `city`, `minPrice`, `maxPrice`

### Cart
```
GET    /api/cart/           - Get cart items (auth)
POST   /api/cart/add        - Add item to cart (auth)
POST   /api/cart/remove     - Remove item from cart (auth)
POST   /api/cart/update     - Update item quantity (auth)
```

### Orders
```
GET    /api/order/                  - Get my orders (auth, paginated)
GET    /api/order/get-order         - Get order by ID (auth)
POST   /api/order/create-order      - Create order from cart (auth)
GET    /api/order/list-all-orders   - List all orders (admin, paginated)
POST   /api/order/update/status     - Update order status (admin)
```

### Reviews
```
GET    /api/review/list     - List reviews (paginated, filterable)
POST   /api/review/add      - Add review (auth)
POST   /api/review/update   - Update review (auth, owner)
POST   /api/review/delete   - Delete review (auth, owner/admin)
```

### Wishlist
```
GET    /api/wishlist/list    - Get wishlist items (auth)
POST   /api/wishlist/add     - Add to wishlist (auth)
POST   /api/wishlist/remove  - Remove from wishlist (auth)
```

### Conversations
```
GET    /api/conversation/                        - Start/get conversation (auth)
GET    /api/conversation/get-conversation        - List all conversations (auth)
GET    /api/conversation/get-conversations-by-product  - Get by product (auth)
POST   /api/conversation/send-message            - Send message (auth)
```

### Reports
```
POST   /api/report/create   - Report product (auth)
GET    /api/report/all      - Get all reports (admin)
GET    /api/report/by-id    - Get report by ID (admin)
POST   /api/report/resolve  - Resolve report (admin)
POST   /api/report/delete   - Delete report (admin)
```

### Payments
```
POST   /api/payment/create-checkout-session  - Create Stripe checkout (auth)
POST   /api/payment/webhook                  - Stripe webhook handler
```

## 🗄️ Database Schema

### Core Models
- **User** - Authentication, profile, roles
- **Product** - Listings with images, stock, status
- **ProductImage** - Multiple images per product
- **CartItem** - Shopping cart items
- **Order** - Order records with status tracking
- **OrderItem** - Individual items in orders
- **Payment** - Payment transactions
- **Refund** - Refund records
- **Review** - Product reviews and ratings
- **WishlistItem** - Saved products
- **Conversation** - Buyer-seller messaging
- **Message** - Individual messages
- **Report** - Product abuse reports

### Enums
- **ProductStatus**: AVAILABLE, PENDING, SOLD, ARCHIVED
- **Condition**: NEW, LIKE_NEW, USED, FOR_PARTS
- **PaymentStatus**: PENDING, SUCCEEDED, FAILED, REFUNDED

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **Authentication**: JWT
- **Validation**: Zod
- **File Upload**: Multer

## 📦 Project Structure

```
src/
├── controllers/          # Business logic
│   ├── user.controller.ts
│   ├── product.controller.ts
│   ├── cart.controller.ts
│   ├── order.controller.ts
│   ├── payment.controller.ts
│   ├── review.controller.ts
│   ├── wishlist.controller.ts
│   ├── conversation.controller.ts
│   └── report.controller.ts
├── routes/              # API routes
│   ├── user.routes.ts
│   ├── product.routes.ts
│   ├── cart.routes.ts
│   ├── order.routes.ts
│   ├── payment.routes.ts
│   ├── review.routes.ts
│   ├── wishlist.routes.ts
│   ├── conversation.routes.ts
│   └── report.routes.ts
├── middlewares/         # Express middlewares
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   └── rateLimit.middleware.ts
├── validation/          # Zod schemas
│   └── schemas.ts
├── utils/              # Utility functions
│   ├── ApiError.ts
│   ├── ApiResponse.ts
│   ├── auth.ts
│   ├── sanitizers.ts
│   ├── pagination.ts
│   ├── supabaseClient.ts
│   └── supabaseStorage.ts
├── config/             # Configuration
│   └── config.ts
├── db/                 # Database
│   └── prisma.ts
├── app.ts             # Express app setup
└── server.ts          # Server entry point
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)
- Stripe account
- Supabase account (for storage)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file:
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT
JWT_ACCESS_TOKEN_SECRET="your-access-token-secret"
JWT_REFRESH_TOKEN_SECRET="your-refresh-token-secret"
JWT_ACCESS_TOKEN_EXPIRES_IN="15m"
JWT_REFRESH_TOKEN_EXPIRES_IN="7d"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Server
PORT=3000
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm start
```

## 🧪 Testing

### Manual Testing
Use tools like Postman, Insomnia, or curl to test endpoints.

### Test Stripe Webhooks Locally
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/payment/webhook

# Use the webhook secret in your .env
```

## 📝 API Response Format

### Success Response
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

### Paginated Response
```json
{
  "statusCode": 200,
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Success message",
  "success": true
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "success": false
}
```

## 🔧 Configuration

### Rate Limiting
Configure in `middlewares/rateLimit.middleware.ts`:
- Window duration
- Max requests per window
- Custom error messages

### Pagination
Default settings in `utils/pagination.ts`:
- Default page: 1
- Default limit: 20
- Max limit: 100

### File Upload
Configure in route files:
- Max file size: 10MB
- Max files per upload: 6
- Allowed types: images

## 🎯 Recent Improvements

### Bug Fixes
✅ Cart stock validation in `updateItemQuantity`  
✅ Order creation with atomic stock decrement  
✅ Review ownership prevention (sellers can't review own products)  
✅ Wishlist product existence validation  
✅ Removed all unused imports  

### Features Added
✅ Pagination for products, reviews, and orders  
✅ Product view counter with atomic increment  
✅ Sorting for product listings  
✅ Centralized sanitization functions  
✅ Comprehensive Zod validation on all routes  

### Security Enhancements
✅ Transaction safety for order creation  
✅ Input validation across all endpoints  
✅ Ownership checks enforced  
✅ Rate limiting infrastructure  

## 📚 Documentation

- [API Documentation](./docs/api.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📄 License

ISC

## 🙏 Acknowledgments

Built with modern best practices for production-ready e-commerce backends.
