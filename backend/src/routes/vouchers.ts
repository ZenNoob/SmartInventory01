import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';
import { voucherService } from '../services/voucher-service';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/vouchers - Get all vouchers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { status } = req.query;

    let sql = 'SELECT * FROM Vouchers WHERE store_id = @storeId';
    const params: any = { storeId };

    if (status) {
      sql += ' AND status = @status';
      params.status = status;
    }

    sql += ' ORDER BY created_at DESC';

    const vouchers = await query(sql, params);

    res.json({
      success: true,
      data: vouchers.map((v: any) => ({
        id: v.id,
        storeId: v.store_id,
        promotionId: v.promotion_id,
        code: v.code,
        name: v.name,
        description: v.description,
        discountType: v.discount_type,
        discountValue: v.discount_value,
        maxDiscountAmount: v.max_discount_amount,
        minPurchaseAmount: v.min_purchase_amount,
        startDate: v.start_date,
        endDate: v.end_date,
        usageLimit: v.usage_limit,
        usageCount: v.usage_count,
        usagePerCustomer: v.usage_per_customer,
        status: v.status,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ error: 'Failed to get vouchers' });
  }
});

// POST /api/vouchers - Create voucher
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minPurchaseAmount,
      startDate,
      endDate,
      usageLimit,
      usagePerCustomer,
      status,
      promotionId,
      autoGenerate,
    } = req.body;

    const id = crypto.randomUUID();
    const voucherCode = autoGenerate ? voucherService.generateCode() : code;

    await query(
      `INSERT INTO Vouchers (
        id, store_id, promotion_id, code, name, description,
        discount_type, discount_value, max_discount_amount, min_purchase_amount,
        start_date, end_date, usage_limit, usage_per_customer, status
      ) VALUES (
        @id, @storeId, @promotionId, @code, @name, @description,
        @discountType, @discountValue, @maxDiscountAmount, @minPurchaseAmount,
        @startDate, @endDate, @usageLimit, @usagePerCustomer, @status
      )`,
      {
        id,
        storeId,
        promotionId,
        code: voucherCode,
        name,
        description,
        discountType,
        discountValue,
        maxDiscountAmount,
        minPurchaseAmount,
        startDate,
        endDate,
        usageLimit,
        usagePerCustomer: usagePerCustomer || 1,
        status: status || 'active',
      }
    );

    res.status(201).json({ success: true, id, code: voucherCode });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ error: 'Failed to create voucher' });
  }
});

// POST /api/vouchers/validate - Validate voucher code
router.post('/validate', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { code, subtotal, customerId } = req.body;

    const result = await voucherService.validateVoucher(code, storeId, subtotal, customerId);

    if (result.valid) {
      res.json({
        success: true,
        valid: true,
        voucher: result.voucher,
        discount: result.discount,
      });
    } else {
      res.json({
        success: true,
        valid: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({ error: 'Failed to validate voucher' });
  }
});

// PUT /api/vouchers/:id - Update voucher
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;
    const updates = req.body;

    const fields = Object.keys(updates)
      .map((key) => {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        return `${snakeKey} = @${key}`;
      })
      .join(', ');

    if (fields) {
      await query(
        `UPDATE Vouchers SET ${fields}, updated_at = GETDATE() WHERE id = @id AND store_id = @storeId`,
        { id, storeId, ...updates }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({ error: 'Failed to update voucher' });
  }
});

// DELETE /api/vouchers/:id - Delete voucher
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    await query('DELETE FROM Vouchers WHERE id = @id AND store_id = @storeId', { id, storeId });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({ error: 'Failed to delete voucher' });
  }
});

export default router;
