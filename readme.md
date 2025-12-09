# E-Commerce Backend (Node.js + Express + TypeScript + Prisma)

This project is a backend for a simple e-commerce platform where users can register, log in, browse products, add items to cart, place orders, leave reviews, and manage wishlist items.

---

## 🚀 Features Implemented So Far

### 🔐 Authentication
- Register / Login with JWT
- Password hashing
- Refresh token storage
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/me`

---

## 🛍 Product Module
Users (admin or sellers depending on your logic) can create, update, delete, and list products.

APIs:
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin/seller)
- `PUT /api/products/:id` (admin/seller)
- `DELETE /api/products/:id` (admin/seller)

Product supports:
- title/name
- description
- price (Decimal)
- category
- images
- stock
- automatic timestamps

---

## 🧺 Cart Module
Authenticated users can manage items in their cart.

APIs:
- `GET /api/cart`
- `POST /api/cart` (add or increase quantity)
- `PUT /api/cart/:itemId` (update quantity)
- `DELETE /api/cart/:itemId`

---

## 📦 Order Module
Users can place orders based on their cart.

APIs:
- `POST /api/orders` (create order from cart)
- `GET /api/orders` (my orders)
- `GET /api/orders/:orderId` (order details)

Admin APIs:
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:orderId/status`

---

## ⭐ Reviews Module
Users can leave reviews on products (one review per product per user).

APIs:
- `POST /api/products/:id/reviews`
- `GET /api/products/:id/reviews`
- `DELETE /api/products/:id/reviews/:reviewId`

---

## 💚 Wishlist Module
Users can save products for later.

APIs:
- `POST /api/wishlist`
- `GET /api/wishlist`
- `DELETE /api/wishlist/:itemId`

---

## 🗄 Prisma Schema (Implemented Models)

### Models included:
- User
- Product
- CartItem
- Order
- OrderItem
- Review
- WishlistItem

This schema supports:
- User authentication
- Product management
- Cart system
- Order flow
- Reviews
- Wishlist

---

## 📦 Project Structure (Implemented)

```
src/
 ├── controllers/
 ├── routes/
 ├── middlewares/
 ├── db/
 ├── config/
 ├── utils/
 ├── app.ts
 └── server.ts
```

---

## 🔧 Setup Instructions

### Install dependencies
```
npm install
```

### Create `.env`
```
DATABASE_URL=postgres://...
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Run Prisma
```
npx prisma migrate dev
npx prisma generate
```

### Start development server
```
npm run dev
```


