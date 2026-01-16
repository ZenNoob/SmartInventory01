# Implementation Plan

## Phase 1: Database - Tạo Stored Procedures

- [x] 1. Tạo stored procedures cho Products module





  - [x] 1.1 Tạo `sp_Products_Create` với logic insert và tạo ProductInventory


    - _Requirements: 1.1_
  - [x] 1.2 Tạo `sp_Products_Update` với COALESCE cho partial updates


    - _Requirements: 1.2_
  - [x] 1.3 Tạo `sp_Products_Delete` với soft delete


    - _Requirements: 1.3_
  - [x] 1.4 Tạo `sp_Products_GetByStore` với filters và JOIN ProductInventory


    - _Requirements: 1.4_
  - [x] 1.5 Tạo `sp_Products_GetById` với stock từ ProductInventory


    - _Requirements: 1.5_

- [x] 2. Tạo stored procedures cho Sales module





  - [x] 2.1 Tạo `sp_Sales_Create` với transaction handling


    - _Requirements: 2.1_

  - [x] 2.2 Tạo `sp_SalesItems_Create` với inventory deduction

    - _Requirements: 2.1, 2.5_
  - [x] 2.3 Tạo `sp_Sales_GetById` trả về sale và items


    - _Requirements: 2.2_
  - [x] 2.4 Tạo `sp_Sales_GetByStore` với filters


    - _Requirements: 2.3_

  - [x] 2.5 Tạo `sp_Sales_UpdateStatus`

    - _Requirements: 2.4_

- [x] 3. Tạo stored procedures cho Inventory module





  - [x] 3.1 Tạo `sp_Inventory_GetAvailable`


    - _Requirements: 4.1_

  - [x] 3.2 Tạo `sp_Inventory_Add` với UPSERT logic

    - _Requirements: 4.2_
  - [x] 3.3 Tạo `sp_Inventory_Deduct` với stock validation


    - _Requirements: 4.3_
  - [x] 3.4 Tạo `sp_Inventory_Sync` với MERGE statement


    - _Requirements: 4.4_

- [x] 4. Tạo stored procedures cho Customers module





  - [x] 4.1 Tạo `sp_Customers_Create`


    - _Requirements: 3.1_

  - [x] 4.2 Tạo `sp_Customers_Update`

    - _Requirements: 3.2_
  - [x] 4.3 Tạo `sp_Customers_Delete`


    - _Requirements: 3.3_
  - [x] 4.4 Tạo `sp_Customers_GetByStore`


    - _Requirements: 3.4_
  - [x] 4.5 Tạo `sp_Customers_UpdateDebt`


    - _Requirements: 3.5_

- [x] 5. Tạo stored procedures cho các module còn lại





  - [x] 5.1 Tạo `sp_Settings_GetByStore` và `sp_Settings_Upsert`


    - _Requirements: 7.1, 7.2_
  - [x] 5.2 Tạo `sp_Units_Create`, `sp_Units_Update`, `sp_Units_Delete`, `sp_Units_GetByStore`


    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 5.3 Tạo `sp_Categories_Create`, `sp_Categories_Update`, `sp_Categories_Delete`, `sp_Categories_GetByStore`


    - _Requirements: 9.1, 9.2, 9.3, 9.4_

## Phase 2: Backend - Repository Layer

- [x] 6. Tạo base repository cho stored procedures






  - [x] 6.1 Tạo `sp-base-repository.ts` với methods `executeSP` và `executeSPSingle`

    - Implement parameter binding cho SQL Server
    - Handle multiple result sets
    - _Requirements: 1-12 (all)_

- [x] 7. Tạo Products SP Repository






  - [x] 7.1 Tạo `products-sp-repository.ts` extends SPBaseRepository

    - Implement `create()` gọi `sp_Products_Create`
    - Implement `update()` gọi `sp_Products_Update`
    - Implement `delete()` gọi `sp_Products_Delete`
    - Implement `getByStore()` gọi `sp_Products_GetByStore`
    - Implement `getById()` gọi `sp_Products_GetById`
    - _Requirements: 1.1-1.5_
  - [x] 7.2 Viết unit tests cho Products SP Repository


    - _Requirements: 1.1-1.5_

- [x] 8. Tạo Sales SP Repository





  - [x] 8.1 Tạo `sales-sp-repository.ts` extends SPBaseRepository


    - Implement `create()` gọi `sp_Sales_Create` và `sp_SalesItems_Create`
    - Implement `getById()` gọi `sp_Sales_GetById`
    - Implement `getByStore()` gọi `sp_Sales_GetByStore`
    - Implement `updateStatus()` gọi `sp_Sales_UpdateStatus`
    - _Requirements: 2.1-2.5_
  - [x] 8.2 Viết unit tests cho Sales SP Repository


    - _Requirements: 2.1-2.5_

- [x] 9. Tạo Inventory SP Repository





  - [x] 9.1 Tạo `inventory-sp-repository.ts` extends SPBaseRepository


    - Implement `getAvailable()` gọi `sp_Inventory_GetAvailable`
    - Implement `add()` gọi `sp_Inventory_Add`
    - Implement `deduct()` gọi `sp_Inventory_Deduct`
    - Implement `sync()` gọi `sp_Inventory_Sync`
    - _Requirements: 4.1-4.4_
  - [x] 9.2 Viết unit tests cho Inventory SP Repository


    - _Requirements: 4.1-4.4_

- [x] 10. Tạo Customers SP Repository





  - [x] 10.1 Tạo `customers-sp-repository.ts` extends SPBaseRepository


    - Implement CRUD operations
    - Implement `updateDebt()`
    - _Requirements: 3.1-3.5_

  - [x] 10.2 Viết unit tests cho Customers SP Repository

    - _Requirements: 3.1-3.5_

- [x] 11. Tạo các SP Repositories còn lại





  - [x] 11.1 Tạo `settings-sp-repository.ts`


    - _Requirements: 7.1, 7.2_
  - [x] 11.2 Tạo `units-sp-repository.ts`


    - _Requirements: 8.1-8.4_

  - [x] 11.3 Tạo `categories-sp-repository.ts`

    - _Requirements: 9.1-9.4_

## Phase 3: Backend - Cập nhật Routes

- [x] 12. Cập nhật Products routes sử dụng SP Repository





  - [x] 12.1 Import và sử dụng ProductsSPRepository trong `products.ts`


    - Thay thế inline queries bằng repository calls
    - _Requirements: 1.1-1.5_

- [x] 13. Cập nhật Sales routes sử dụng SP Repository





  - [x] 13.1 Import và sử dụng SalesSPRepository trong `sales.ts`


    - Thay thế inline queries bằng repository calls
    - _Requirements: 2.1-2.5_

- [x] 14. Cập nhật Inventory routes sử dụng SP Repository




  - [x] 14.1 Import và sử dụng InventorySPRepository trong inventory-related routes


    - _Requirements: 4.1-4.4_



- [x] 15. Cập nhật các routes còn lại



  - [x] 15.1 Cập nhật `customers.ts` sử dụng CustomersSPRepository


    - _Requirements: 3.1-3.5_
  - [x] 15.2 Cập nhật `settings.ts` sử dụng SettingsSPRepository


    - _Requirements: 7.1, 7.2_
  - [x] 15.3 Cập nhật `units.ts` sử dụng UnitsSPRepository


    - _Requirements: 8.1-8.4_
  - [x] 15.4 Cập nhật `categories.ts` sử dụng CategoriesSPRepository


    - _Requirements: 9.1-9.4_

## Phase 4: Testing và Cleanup


- [x] 16. Integration testing




  - [x] 16.1 Test flow tạo sale với inventory deduction


    - _Requirements: 2.1, 2.5, 4.3_
  - [x] 16.2 Test concurrent access scenarios

    - _Requirements: 2.1, 4.3_

- [x] 17. Cleanup và documentation





  - [x] 17.1 Xóa inline queries không còn sử dụng


    - _Requirements: 1-12 (all)_
  - [x] 17.2 Cập nhật README với hướng dẫn stored procedures


    - _Requirements: 1-12 (all)_
