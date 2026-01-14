import { Router, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/sales
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { page = '1', pageSize = '20', search, status, customerId, dateFrom, dateTo } = req.query;
    
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    // Build WHERE clause
    const conditions = ['s.store_id = @storeId'];
    const params: Record<string, unknown> = { storeId };

    if (search) {
      conditions.push('(s.invoice_number LIKE @search OR c.full_name LIKE @search)');
      params.search = `%${search}%`;
    }

    if (status && status !== 'all') {
      conditions.push('s.status = @status');
      params.status = status;
    }

    if (customerId && customerId !== 'all') {
      conditions.push('s.customer_id = @customerId');
      params.customerId = customerId;
    }

    if (dateFrom) {
      conditions.push('s.transaction_date >= @dateFrom');
      params.dateFrom = dateFrom;
    }

    if (dateTo) {
      conditions.push('s.transaction_date <= @dateTo');
      params.dateTo = dateTo;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM Sales s
       LEFT JOIN Customers c ON s.customer_id = c.id
       WHERE ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / pageSizeNum);

    // Get paginated sales with item count
    const sales = await query(
      `SELECT s.*, c.full_name as customer_name,
              (SELECT COUNT(*) FROM SalesItems si WHERE si.sales_transaction_id = s.id) as item_count
       FROM Sales s
       LEFT JOIN Customers c ON s.customer_id = c.id
       WHERE ${whereClause}
       ORDER BY s.transaction_date DESC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      { ...params, offset, pageSize: pageSizeNum }
    );

    res.json({
      success: true,
      data: sales.map((s: Record<string, unknown>) => ({
        id: s.id,
        storeId: s.store_id,
        invoiceNumber: s.invoice_number,
        customerId: s.customer_id,
        customerName: s.customer_name,
        shiftId: s.shift_id,
        transactionDate: s.transaction_date,
        status: s.status,
        totalAmount: s.total_amount,
        vatAmount: s.vat_amount,
        finalAmount: s.final_amount,
        discount: s.discount,
        discountType: s.discount_type,
        discountValue: s.discount_value,
        tierDiscountPercentage: s.tier_discount_percentage,
        tierDiscountAmount: s.tier_discount_amount,
        pointsUsed: s.points_used,
        pointsDiscount: s.points_discount,
        customerPayment: s.customer_payment,
        previousDebt: s.previous_debt,
        remainingDebt: s.remaining_debt,
        paymentMethod: s.payment_method,
        itemCount: s.item_count,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Failed to get sales' });
  }
});

// GET /api/sales/items/all - Get all sale items for dashboard (must be before /:id)
router.get('/items/all', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;

    const items = await query(
      `SELECT si.id, si.sales_transaction_id, si.product_id, si.quantity, si.price,
              p.name as product_name, s.transaction_date
       FROM SalesItems si
       JOIN Products p ON si.product_id = p.id
       JOIN Sales s ON si.sales_transaction_id = s.id
       WHERE s.store_id = @storeId
       ORDER BY s.transaction_date DESC`,
      { storeId }
    );

    res.json(items.map((i: Record<string, unknown>) => ({
      id: i.id,
      salesTransactionId: i.sales_transaction_id,
      productId: i.product_id,
      productName: i.product_name,
      unitName: null,
      quantity: i.quantity,
      price: i.price,
      totalPrice: (i.quantity as number) * (i.price as number),
      transactionDate: i.transaction_date,
    })));
  } catch (error) {
    console.error('Get all sale items error:', error);
    res.status(500).json({ error: 'Failed to get sale items' });
  }
});

// GET /api/sales/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    const sale = await queryOne(
      `SELECT s.*, c.full_name as customer_name
       FROM Sales s
       LEFT JOIN Customers c ON s.customer_id = c.id
       WHERE s.id = @id AND s.store_id = @storeId`,
      { id, storeId }
    );

    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    res.json({
      id: sale.id,
      storeId: sale.store_id,
      invoiceNumber: sale.invoice_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name,
      shiftId: sale.shift_id,
      transactionDate: sale.transaction_date,
      status: sale.status,
      totalAmount: sale.total_amount,
      vatAmount: sale.vat_amount,
      finalAmount: sale.final_amount,
      discount: sale.discount,
      paymentMethod: sale.payment_method,
      customerPayment: sale.customer_payment,
      remainingDebt: sale.remaining_debt,
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Failed to get sale' });
  }
});

// GET /api/sales/:id/items
router.get('/:id/items', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    const items = await query(
      `SELECT si.id, si.sales_transaction_id, si.product_id, si.quantity, si.price,
              p.name as product_name
       FROM SalesItems si
       JOIN Products p ON si.product_id = p.id
       JOIN Sales s ON si.sales_transaction_id = s.id
       WHERE si.sales_transaction_id = @id AND s.store_id = @storeId`,
      { id, storeId }
    );

    res.json(items.map((i: Record<string, unknown>) => ({
      id: i.id,
      saleId: i.sales_transaction_id,
      productId: i.product_id,
      productName: i.product_name,
      unitName: null,
      quantity: i.quantity,
      unitPrice: i.price,
      totalPrice: (i.quantity as number) * (i.price as number),
    })));
  } catch (error) {
    console.error('Get sale items error:', error);
    res.status(500).json({ error: 'Failed to get sale items' });
  }
});

// POST /api/sales
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { 
      customerId, shiftId, items, totalAmount, vatAmount, finalAmount,
      discount, discountType, discountValue, customerPayment,
      previousDebt, remainingDebt, tierDiscountPercentage, tierDiscountAmount,
      pointsUsed, pointsDiscount, status
    } = req.body;

    console.log('[POST /api/sales] Creating sale:', { storeId, customerId, shiftId, itemsCount: items?.length, totalAmount, finalAmount });

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const result = await query(
      `INSERT INTO Sales (
        id, store_id, invoice_number, customer_id, shift_id, transaction_date,
        status, total_amount, vat_amount, final_amount, discount, discount_type,
        discount_value, tier_discount_percentage, tier_discount_amount,
        points_used, points_discount, customer_payment, 
        previous_debt, remaining_debt, created_at, updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(), @storeId, @invoiceNumber, @customerId, @shiftId, GETDATE(),
        @status, @totalAmount, @vatAmount, @finalAmount, @discount, @discountType,
        @discountValue, @tierDiscountPercentage, @tierDiscountAmount,
        @pointsUsed, @pointsDiscount, @customerPayment, 
        @previousDebt, @remainingDebt, GETDATE(), GETDATE()
      )`,
      { 
        storeId, invoiceNumber, customerId: customerId || null, shiftId: shiftId || null,
        status: status || 'completed',
        totalAmount: totalAmount || 0, vatAmount: vatAmount || 0, finalAmount: finalAmount || 0, 
        discount: discount || 0, discountType: discountType || null, discountValue: discountValue || 0,
        tierDiscountPercentage: tierDiscountPercentage || 0, tierDiscountAmount: tierDiscountAmount || 0,
        pointsUsed: pointsUsed || 0, pointsDiscount: pointsDiscount || 0,
        customerPayment: customerPayment || finalAmount || 0,
        previousDebt: previousDebt || 0, remainingDebt: remainingDebt || 0
      }
    );

    const sale = result[0];
    console.log('[POST /api/sales] Sale created:', sale.id, sale.invoice_number);

    // Insert sale items
    if (items && items.length > 0) {
      for (const item of items) {
        // Accept both 'price' and 'unitPrice' for compatibility
        const itemPrice = item.price ?? item.unitPrice;
        await query(
          `INSERT INTO SalesItems (id, sales_transaction_id, product_id, quantity, price, created_at)
           VALUES (NEWID(), @saleId, @productId, @quantity, @price, GETDATE())`,
          { 
            saleId: sale.id, 
            productId: item.productId, 
            quantity: item.quantity,
            price: itemPrice,
          }
        );

        // Update inventory
        await query(
          `UPDATE Inventory SET current_stock = current_stock - @quantity, updated_at = GETDATE()
           WHERE store_id = @storeId AND product_id = @productId`,
          { storeId, productId: item.productId, quantity: item.quantity }
        );
      }
    }

    res.status(201).json({
      id: sale.id,
      invoiceNumber: sale.invoice_number,
      status: sale.status,
      finalAmount: sale.final_amount,
    });
  } catch (error) {
    console.error('Create sale error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to create sale: ${errorMessage}` });
  }
});

// PUT /api/sales/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;
    const { status, customerPayment, remainingDebt } = req.body;

    await query(
      `UPDATE Sales SET 
        status = COALESCE(@status, status),
        customer_payment = COALESCE(@customerPayment, customer_payment),
        remaining_debt = COALESCE(@remainingDebt, remaining_debt),
        updated_at = GETDATE()
       WHERE id = @id AND store_id = @storeId`,
      { id, storeId, status, customerPayment, remainingDebt }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

// DELETE /api/sales/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    // Delete sale items first
    await query('DELETE FROM SalesItems WHERE sales_transaction_id = @id', { id });
    
    // Delete sale
    await query('DELETE FROM Sales WHERE id = @id AND store_id = @storeId', { id, storeId });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

export default router;
