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

## Architecture

### Stored Procedures

The backend uses SQL Server stored procedures for all database operations to improve performance, security, and maintainability.

#### Naming Convention
- **Stored Procedures**: `sp_[TableName]_[Action]`
  - Example: `sp_Products_Create`, `sp_Sales_GetById`
- **Parameters**: `@paramName` (camelCase)
- **Output Parameters**: `@out_[name]`

#### Available Stored Procedures

| Module | Stored Procedure | Description |
|--------|-----------------|-------------|
| **Products** | `sp_Products_Create` | Create product with ProductInventory |
| | `sp_Products_Update` | Update product with COALESCE |
| | `sp_Products_Delete` | Soft delete product |
| | `sp_Products_GetByStore` | Get products with filters |
| | `sp_Products_GetById` | Get single product |
| **Sales** | `sp_Sales_Create` | Create sale with transaction |
| | `sp_SalesItems_Create` | Create sale item + deduct inventory |
| | `sp_Sales_GetById` | Get sale with items |
| | `sp_Sales_GetByStore` | Get sales with filters |
| | `sp_Sales_UpdateStatus` | Update sale status |
| **Inventory** | `sp_Inventory_GetAvailable` | Check available stock |
| | `sp_Inventory_Add` | Add inventory (UPSERT) |
| | `sp_Inventory_Deduct` | Deduct with validation |
| | `sp_Inventory_Sync` | Sync with MERGE |
| **Customers** | `sp_Customers_Create` | Create customer |
| | `sp_Customers_Update` | Update customer |
| | `sp_Customers_Delete` | Delete customer |
| | `sp_Customers_GetByStore` | Get customers |
| | `sp_Customers_UpdateDebt` | Update debt |
| **Settings** | `sp_Settings_GetByStore` | Get settings |
| | `sp_Settings_Upsert` | Create/update settings |
| **Units** | `sp_Units_Create` | Create unit |
| | `sp_Units_Update` | Update unit |
| | `sp_Units_Delete` | Delete unit |
| | `sp_Units_GetByStore` | Get units |
| **Categories** | `sp_Categories_Create` | Create category |
| | `sp_Categories_Update` | Update category |
| | `sp_Categories_Delete` | Delete category |
| | `sp_Categories_GetByStore` | Get categories |

#### Repository Pattern

The backend uses SP Repository classes that extend `SPBaseRepository`:

```typescript
// Example: Using Products SP Repository
import { productsSPRepository } from './repositories/products-sp-repository';

// Create product
const product = await productsSPRepository.create({
  storeId,
  name: 'Product Name',
  price: 100,
  // ...
});

// Get products
const products = await productsSPRepository.getByStore(storeId);

// Update product
await productsSPRepository.update(id, storeId, { price: 150 });

// Delete product (soft delete)
await productsSPRepository.delete(id, storeId);
```

#### SP Repository Classes

| Repository | File | Description |
|------------|------|-------------|
| `ProductsSPRepository` | `products-sp-repository.ts` | Product CRUD operations |
| `SalesSPRepository` | `sales-sp-repository.ts` | Sales with inventory deduction |
| `InventorySPRepository` | `inventory-sp-repository.ts` | Inventory management |
| `CustomersSPRepository` | `customers-sp-repository.ts` | Customer operations |
| `SettingsSPRepository` | `settings-sp-repository.ts` | Store settings |
| `UnitsSPRepository` | `units-sp-repository.ts` | Unit management |
| `CategoriesSPRepository` | `categories-sp-repository.ts` | Category management |

#### Migration from Inline Queries

Old repositories (`product-repository.ts`, `sales-repository.ts`, etc.) are deprecated. Use SP repositories for new code:

```typescript
// ❌ Deprecated - uses inline SQL
import { productRepository } from './repositories/product-repository';

// ✅ Recommended - uses stored procedures
import { productsSPRepository } from './repositories/products-sp-repository';
```

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
