# Smart Inventory - Backend API

Express.js REST API server for Smart Inventory system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure `.env` with your database credentials.

4. Run development server:
```bash
npm run dev
```

Server will start at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Units
- `GET /api/units` - List units
- `POST /api/units` - Create unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer

### Suppliers
- `GET /api/suppliers` - List suppliers

### Sales
- `GET /api/sales` - List sales

### Purchases
- `GET /api/purchases` - List purchase orders

### Shifts
- `GET /api/shifts` - List shifts

### Cash Flow
- `GET /api/cash-flow` - List cash transactions

### Settings
- `GET /api/settings` - Get store settings
- `PUT /api/settings` - Update store settings

### Stores
- `GET /api/stores` - List user's stores
- `GET /api/stores/:id` - Get store

### Reports
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/debt` - Debt report

## Headers

All authenticated requests require:
- `Authorization: Bearer <token>`
- `X-Store-Id: <store_id>` (for store-specific endpoints)
