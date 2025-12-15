# API Documentation

## Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/user/register` | Register new user | No |
| POST | `/api/user/login` | Login user | No |
| POST | `/api/user/logout` | Logout user | Yes |
| POST | `/api/user/refresh-token` | Refresh access token | No |
| POST | `/api/user/change-password` | Change password | Yes |
| POST | `/api/user/update-profile` | Update profile | Yes |
| GET | `/api/user/profile` | Get user profile | Yes |
| GET | `/api/user/send-email` | Send verification email | Yes |
| POST | `/api/user/verify-email` | Verify email | Yes |

### Products
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/product/list` | List products (paginated, filtered) | No |
| GET | `/api/product/get-product-details` | Get product details | No |
| POST | `/api/product/create` | Create product | Yes |
| POST | `/api/product/update-product-details` | Update product | Yes (Owner/Admin) |
| POST | `/api/product/delete` | Delete product | Yes (Owner/Admin) |
| POST | `/api/product/add-product-images` | Add images | Yes (Owner/Admin) |
| POST | `/api/product/delete-product-images` | Delete images | Yes (Owner/Admin) |

**Query Parameters for List:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sortBy` (createdAt | price | views)
- `sortOrder` (asc | desc)
- `category`, `city`, `minPrice`, `maxPrice`

### Cart
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart/` | Get cart items | Yes |
| POST | `/api/cart/add` | Add item to cart | Yes |
| POST | `/api/cart/remove` | Remove item from cart | Yes |
| POST | `/api/cart/update` | Update item quantity | Yes |

### Orders
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/order/` | Get my orders | Yes |
| GET | `/api/order/get-order` | Get order by ID | Yes |
| POST | `/api/order/create-order` | Create order from cart | Yes |
| GET | `/api/order/list-all-orders` | List all orders | Yes (Admin) |
| POST | `/api/order/update/status` | Update order status | Yes (Admin) |

### Reviews
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/review/list` | List reviews | No |
| POST | `/api/review/add` | Add review | Yes |
| POST | `/api/review/update` | Update review | Yes (Owner) |
| POST | `/api/review/delete` | Delete review | Yes (Owner/Admin) |

### Wishlist
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/wishlist/list` | Get wishlist items | Yes |
| POST | `/api/wishlist/add` | Add to wishlist | Yes |
| POST | `/api/wishlist/remove` | Remove from wishlist | Yes |

### Conversations
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/conversation/` | Start/get conversation | Yes |
| GET | `/api/conversation/get-conversation` | List all conversations | Yes |
| GET | `/api/conversation/get-conversations-by-product` | Get by product | Yes |
| POST | `/api/conversation/send-message` | Send message | Yes |

### Reports
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/report/create` | Report product | Yes |
| GET | `/api/report/all` | Get all reports | Yes (Admin) |
| GET | `/api/report/by-id` | Get report by ID | Yes (Admin) |
| POST | `/api/report/resolve` | Resolve report | Yes (Admin) |
| POST | `/api/report/delete` | Delete report | Yes (Admin) |

### Payments
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payment/create-checkout-session` | Create Stripe checkout | Yes |
| POST | `/api/payment/webhook` | Stripe webhook handler | No |

## Response Format

### Success
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

### Error
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
