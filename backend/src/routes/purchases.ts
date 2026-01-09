import { Router, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/purchases
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    
    const purchases = await query(
      `SELECT p.*, s.name as supplier_name
       FROM Purchases p
       LEFT JOIN Suppliers s ON p.supplier_id = s.id
       WHERE p.store_id = @storeId
       ORDER BY p.purchase_date DESC`,
      { storeId }
    );

    res.json(purchases.map((p: Record<string, unknown>) => ({
      id: p.id,
      storeId: p.store_id,
      supplierId: p.supplier_id,
      supplierName: p.supplier_name,
      purchaseDate: p.purchase_date,
      status: p.status,
      totalAmount: p.total_amount,
      paidAmount: p.paid_amount,
      remainingDebt: p.remaining_debt,
      notes: p.notes,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })));
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Failed to get purchases' });
  }
});

// GET /api/purchases/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    const purchase = await queryOne(
      `SELECT p.*, s.name as supplier_name
       FROM Purchases p
       LEFT JOIN Suppliers s ON p.supplier_id = s.id
       WHERE p.id = @id AND p.store_id = @storeId`,
      { id, storeId }
    );

    if (!purchase) {
      res.status(404).json({ error: 'Purchase not found' });
      return;
    }

    res.json({
      id: purchase.id,
      storeId: purchase.store_id,
      supplierId: purchase.supplier_id,
      supplierName: purchase.supplier_name,
      purchaseDate: purchase.purchase_date,
      status: purchase.status,
      totalAmount: purchase.total_amount,
      paidAmount: purchase.paid_amount,
      remainingDebt: purchase.remaining_debt,
      notes: purchase.notes,
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ error: 'Failed to get purchase' });
  }
});

// POST /api/purchases
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { supplierId, items, totalAmount, paidAmount, notes } = req.body;

    const remainingDebt = totalAmount - (paidAmount || 0);

    const result = await query(
      `INSERT INTO Purchases (
        id, store_id, supplier_id, purchase_date, status, total_amount, 
        paid_amount, remaining_debt, notes, created_at, updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(), @storeId, @supplierId, GETDATE(), 'completed', @totalAmount,
        @paidAmount, @remainingDebt, @notes, GETDATE(), GETDATE()
      )`,
      { storeId, supplierId, totalAmount, paidAmount: paidAmount || 0, remainingDebt, notes }
    );

    const purchase = result[0];

    // Insert purchase items and update inventory
    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          `INSERT INTO PurchaseItems (id, purchase_id, product_id, quantity, unit_price, total_price, created_at)
           VALUES (NEWID(), @purchaseId, @productId, @quantity, @unitPrice, @totalPrice, GETDATE())`,
          { 
            purchaseId: purchase.id, 
            productId: item.productId, 
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice || item.quantity * item.unitPrice
          }
        );

        // Update inventory - add stock
        await query(
          `MERGE Inventory AS target
           USING (SELECT @storeId as store_id, @productId as product_id) AS source
           ON target.store_id = source.store_id AND target.product_id = source.product_id
           WHEN MATCHED THEN
             UPDATE SET 
               current_stock = current_stock + @quantity,
               average_cost = ((current_stock * average_cost) + (@quantity * @unitPrice)) / (current_stock + @quantity),
               updated_at = GETDATE()
           WHEN NOT MATCHED THEN
             INSERT (id, store_id, product_id, current_stock, average_cost, created_at, updated_at)
             VALUES (NEWID(), @storeId, @productId, @quantity, @unitPrice, GETDATE(), GETDATE());`,
          { storeId, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice }
        );
      }
    }

    res.status(201).json({
      id: purchase.id,
      status: purchase.status,
      totalAmount: purchase.total_amount,
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

// PUT /api/purchases/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;
    const { status, paidAmount, remainingDebt, notes } = req.body;

    await query(
      `UPDATE Purchases SET 
        status = COALESCE(@status, status),
        paid_amount = COALESCE(@paidAmount, paid_amount),
        remaining_debt = COALESCE(@remainingDebt, remaining_debt),
        notes = COALESCE(@notes, notes),
        updated_at = GETDATE()
       WHERE id = @id AND store_id = @storeId`,
      { id, storeId, status, paidAmount, remainingDebt, notes }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({ error: 'Failed to update purchase' });
  }
});

// DELETE /api/purchases/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    // Delete purchase items first
    await query('DELETE FROM PurchaseItems WHERE purchase_id = @id', { id });
    
    // Delete purchase
    await query('DELETE FROM Purchases WHERE id = @id AND store_id = @storeId', { id, storeId });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({ error: 'Failed to delete purchase' });
  }
});

export default router;
