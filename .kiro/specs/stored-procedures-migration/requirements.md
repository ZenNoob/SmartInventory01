# Requirements Document

## Introduction

Chuyển đổi tất cả các thao tác dữ liệu (INSERT, UPDATE, DELETE, SELECT) trong backend từ inline SQL queries sang Stored Procedures trong SQL Server. Mục tiêu là cải thiện hiệu suất, bảo mật, và khả năng bảo trì của hệ thống.

## Glossary

- **Stored Procedure (SP)**: Một tập hợp các câu lệnh SQL được lưu trữ và thực thi trên SQL Server
- **Backend**: Ứng dụng Node.js/Express xử lý API requests
- **Repository**: Lớp trừu tượng để truy cập dữ liệu
- **Route**: API endpoint xử lý HTTP requests

## Requirements

### Requirement 1: Chuyển đổi thao tác Products

**User Story:** As a developer, I want all product-related database operations to use stored procedures, so that the code is more maintainable and secure.

#### Acceptance Criteria

1. WHEN a product is created, THE System SHALL call stored procedure `sp_Products_Create` with product parameters.
2. WHEN a product is updated, THE System SHALL call stored procedure `sp_Products_Update` with product ID and updated fields.
3. WHEN a product is deleted, THE System SHALL call stored procedure `sp_Products_Delete` with product ID.
4. WHEN products are retrieved, THE System SHALL call stored procedure `sp_Products_GetByStore` with store ID.
5. WHEN a single product is retrieved, THE System SHALL call stored procedure `sp_Products_GetById` with product ID.

### Requirement 2: Chuyển đổi thao tác Sales

**User Story:** As a developer, I want all sales-related database operations to use stored procedures, so that transaction integrity is maintained.

#### Acceptance Criteria

1. WHEN a sale is created, THE System SHALL call stored procedure `sp_Sales_Create` with sale data and items.
2. WHEN a sale is retrieved, THE System SHALL call stored procedure `sp_Sales_GetById` with sale ID.
3. WHEN sales are listed, THE System SHALL call stored procedure `sp_Sales_GetByStore` with store ID and filters.
4. WHEN a sale status is updated, THE System SHALL call stored procedure `sp_Sales_UpdateStatus` with sale ID and new status.
5. WHEN inventory is deducted, THE System SHALL call stored procedure `sp_Inventory_Deduct` within the same transaction.

### Requirement 3: Chuyển đổi thao tác Customers

**User Story:** As a developer, I want all customer-related database operations to use stored procedures, so that customer data is handled consistently.

#### Acceptance Criteria

1. WHEN a customer is created, THE System SHALL call stored procedure `sp_Customers_Create` with customer data.
2. WHEN a customer is updated, THE System SHALL call stored procedure `sp_Customers_Update` with customer ID and updated fields.
3. WHEN a customer is deleted, THE System SHALL call stored procedure `sp_Customers_Delete` with customer ID.
4. WHEN customers are retrieved, THE System SHALL call stored procedure `sp_Customers_GetByStore` with store ID.
5. WHEN customer debt is updated, THE System SHALL call stored procedure `sp_Customers_UpdateDebt` with customer ID and amount.

### Requirement 4: Chuyển đổi thao tác Inventory

**User Story:** As a developer, I want all inventory-related database operations to use stored procedures, so that stock levels are accurately maintained.

#### Acceptance Criteria

1. WHEN inventory is checked, THE System SHALL call stored procedure `sp_Inventory_GetAvailable` with product ID and unit ID.
2. WHEN inventory is added, THE System SHALL call stored procedure `sp_Inventory_Add` with product ID, quantity, and unit ID.
3. WHEN inventory is deducted, THE System SHALL call stored procedure `sp_Inventory_Deduct` with product ID, quantity, and unit ID.
4. WHEN inventory is synced, THE System SHALL call stored procedure `sp_Inventory_Sync` with product ID and store ID.

### Requirement 5: Chuyển đổi thao tác Purchase Orders

**User Story:** As a developer, I want all purchase order operations to use stored procedures, so that supplier transactions are properly recorded.

#### Acceptance Criteria

1. WHEN a purchase order is created, THE System SHALL call stored procedure `sp_PurchaseOrders_Create` with order data and items.
2. WHEN a purchase order is retrieved, THE System SHALL call stored procedure `sp_PurchaseOrders_GetById` with order ID.
3. WHEN purchase orders are listed, THE System SHALL call stored procedure `sp_PurchaseOrders_GetByStore` with store ID.
4. WHEN inventory is updated from purchase, THE System SHALL call stored procedure `sp_Inventory_AddFromPurchase` within the same transaction.

### Requirement 6: Chuyển đổi thao tác Suppliers

**User Story:** As a developer, I want all supplier-related database operations to use stored procedures, so that supplier data is managed consistently.

#### Acceptance Criteria

1. WHEN a supplier is created, THE System SHALL call stored procedure `sp_Suppliers_Create` with supplier data.
2. WHEN a supplier is updated, THE System SHALL call stored procedure `sp_Suppliers_Update` with supplier ID and updated fields.
3. WHEN a supplier is deleted, THE System SHALL call stored procedure `sp_Suppliers_Delete` with supplier ID.
4. WHEN suppliers are retrieved, THE System SHALL call stored procedure `sp_Suppliers_GetByStore` with store ID.
5. WHEN supplier payment is recorded, THE System SHALL call stored procedure `sp_SupplierPayments_Create` with payment data.

### Requirement 7: Chuyển đổi thao tác Settings

**User Story:** As a developer, I want all settings-related database operations to use stored procedures, so that configuration is handled securely.

#### Acceptance Criteria

1. WHEN settings are retrieved, THE System SHALL call stored procedure `sp_Settings_GetByStore` with store ID.
2. WHEN settings are updated, THE System SHALL call stored procedure `sp_Settings_Upsert` with store ID and settings JSON.

### Requirement 8: Chuyển đổi thao tác Units

**User Story:** As a developer, I want all unit-related database operations to use stored procedures, so that unit conversions are handled correctly.

#### Acceptance Criteria

1. WHEN a unit is created, THE System SHALL call stored procedure `sp_Units_Create` with unit data.
2. WHEN a unit is updated, THE System SHALL call stored procedure `sp_Units_Update` with unit ID and updated fields.
3. WHEN a unit is deleted, THE System SHALL call stored procedure `sp_Units_Delete` with unit ID.
4. WHEN units are retrieved, THE System SHALL call stored procedure `sp_Units_GetByStore` with store ID.

### Requirement 9: Chuyển đổi thao tác Categories

**User Story:** As a developer, I want all category-related database operations to use stored procedures, so that product categorization is consistent.

#### Acceptance Criteria

1. WHEN a category is created, THE System SHALL call stored procedure `sp_Categories_Create` with category data.
2. WHEN a category is updated, THE System SHALL call stored procedure `sp_Categories_Update` with category ID and updated fields.
3. WHEN a category is deleted, THE System SHALL call stored procedure `sp_Categories_Delete` with category ID.
4. WHEN categories are retrieved, THE System SHALL call stored procedure `sp_Categories_GetByStore` with store ID.

### Requirement 10: Chuyển đổi thao tác Shifts

**User Story:** As a developer, I want all shift-related database operations to use stored procedures, so that cash management is accurate.

#### Acceptance Criteria

1. WHEN a shift is started, THE System SHALL call stored procedure `sp_Shifts_Start` with shift data.
2. WHEN a shift is closed, THE System SHALL call stored procedure `sp_Shifts_Close` with shift ID and closing data.
3. WHEN active shift is retrieved, THE System SHALL call stored procedure `sp_Shifts_GetActive` with store ID and user ID.
4. WHEN shift history is retrieved, THE System SHALL call stored procedure `sp_Shifts_GetHistory` with store ID and date range.

### Requirement 11: Chuyển đổi thao tác Cash Transactions

**User Story:** As a developer, I want all cash transaction operations to use stored procedures, so that financial records are accurate.

#### Acceptance Criteria

1. WHEN a cash transaction is created, THE System SHALL call stored procedure `sp_CashTransactions_Create` with transaction data.
2. WHEN cash transactions are retrieved, THE System SHALL call stored procedure `sp_CashTransactions_GetByShift` with shift ID.
3. WHEN cash balance is calculated, THE System SHALL call stored procedure `sp_CashTransactions_GetBalance` with shift ID.

### Requirement 12: Chuyển đổi thao tác Authentication

**User Story:** As a developer, I want all authentication-related database operations to use stored procedures, so that user credentials are handled securely.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL call stored procedure `sp_Users_Authenticate` with email and return user data.
2. WHEN a session is created, THE System SHALL call stored procedure `sp_Sessions_Create` with session data.
3. WHEN a session is validated, THE System SHALL call stored procedure `sp_Sessions_Validate` with token.
4. WHEN a session is deleted, THE System SHALL call stored procedure `sp_Sessions_Delete` with token.
