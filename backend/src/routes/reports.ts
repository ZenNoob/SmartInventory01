import { Router, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/reports/revenue
router.get('/revenue', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { from, to } = req.query;

    const result = await query(
      `SELECT 
        CAST(TransactionDate AS DATE) as Date,
        SUM(FinalAmount) as Revenue,
        COUNT(*) as OrderCount
       FROM Sales
       WHERE StoreId = @storeId
         AND TransactionDate >= @from
         AND TransactionDate <= @to
       GROUP BY CAST(TransactionDate AS DATE)
       ORDER BY Date`,
      { storeId, from, to }
    );

    res.json(result);
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({ error: 'Failed to get revenue report' });
  }
});

// GET /api/reports/sales - Sales report with filters
router.get('/sales', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { dateFrom, dateTo, includeDetails } = req.query;

    const result = await query(
      `SELECT 
        s.id, s.transaction_date as transactionDate, s.final_amount as finalAmount,
        s.status, s.payment_method as paymentMethod,
        c.full_name as customerName
       FROM Sales s
       LEFT JOIN Customers c ON s.customer_id = c.id
       WHERE s.store_id = @storeId
         AND (@dateFrom IS NULL OR s.transaction_date >= @dateFrom)
         AND (@dateTo IS NULL OR s.transaction_date <= @dateTo)
       ORDER BY s.transaction_date DESC`,
      { storeId, dateFrom: dateFrom || null, dateTo: dateTo || null }
    );

    res.json({ data: result, total: result.length });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ error: 'Failed to get sales report' });
  }
});

// GET /api/reports/inventory
router.get('/inventory', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;

    const result = await query(
      `SELECT 
        p.id, p.name, p.barcode,
        c.name as categoryName,
        u.name as unitName,
        ISNULL(i.current_stock, 0) as currentStock,
        ISNULL(i.average_cost, 0) as averageCost,
        p.low_stock_threshold as lowStockThreshold
       FROM Products p
       LEFT JOIN Categories c ON p.category_id = c.id
       LEFT JOIN Units u ON p.unit_id = u.id
       LEFT JOIN Inventory i ON p.id = i.product_id AND i.store_id = @storeId
       WHERE p.store_id = @storeId
       ORDER BY p.name`,
      { storeId }
    );

    res.json({ data: result, total: result.length });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({ error: 'Failed to get inventory report' });
  }
});

// GET /api/reports/debt - Customer debt report
router.get('/debt', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { hasDebtOnly } = req.query;

    let whereClause = 'WHERE c.store_id = @storeId';
    if (hasDebtOnly === 'true') {
      whereClause += ' HAVING ISNULL(SUM(s.remaining_debt), 0) > 0';
    }

    const result = await query(
      `SELECT 
        c.id, c.full_name as name, c.phone, c.email,
        ISNULL(SUM(s.remaining_debt), 0) as totalDebt,
        COUNT(s.id) as transactionCount
       FROM Customers c
       LEFT JOIN Sales s ON c.id = s.customer_id
       ${whereClause}
       GROUP BY c.id, c.full_name, c.phone, c.email
       ORDER BY totalDebt DESC`,
      { storeId }
    );

    res.json({ data: result, total: result.length });
  } catch (error) {
    console.error('Get debt report error:', error);
    res.status(500).json({ error: 'Failed to get debt report' });
  }
});

// GET /api/reports/supplier-debt - Supplier debt report
router.get('/supplier-debt', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;

    const result = await query(
      `SELECT 
        s.id, s.name, s.phone, s.email,
        ISNULL(SUM(p.remaining_debt), 0) as totalDebt,
        COUNT(p.id) as purchaseCount
       FROM Suppliers s
       LEFT JOIN Purchases p ON s.id = p.supplier_id
       WHERE s.store_id = @storeId
       GROUP BY s.id, s.name, s.phone, s.email
       HAVING ISNULL(SUM(p.remaining_debt), 0) > 0
       ORDER BY totalDebt DESC`,
      { storeId }
    );

    res.json({ data: result, total: result.length });
  } catch (error) {
    console.error('Get supplier debt report error:', error);
    res.status(500).json({ error: 'Failed to get supplier debt report' });
  }
});

// GET /api/reports/profit - Profit report
router.get('/profit', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { dateFrom, dateTo, groupBy } = req.query;

    const result = await query(
      `SELECT 
        p.id as productId, p.name as productName,
        SUM(si.quantity) as totalQuantity,
        SUM(si.total_price) as totalRevenue,
        SUM(si.quantity * ISNULL(i.average_cost, 0)) as totalCost,
        SUM(si.total_price) - SUM(si.quantity * ISNULL(i.average_cost, 0)) as profit
       FROM SaleItems si
       JOIN Sales s ON si.sale_id = s.id
       JOIN Products p ON si.product_id = p.id
       LEFT JOIN Inventory i ON p.id = i.product_id AND i.store_id = @storeId
       WHERE s.store_id = @storeId
         AND (@dateFrom IS NULL OR s.transaction_date >= @dateFrom)
         AND (@dateTo IS NULL OR s.transaction_date <= @dateTo)
       GROUP BY p.id, p.name
       ORDER BY profit DESC`,
      { storeId, dateFrom: dateFrom || null, dateTo: dateTo || null }
    );

    res.json({ data: result, total: result.length });
  } catch (error) {
    console.error('Get profit report error:', error);
    res.status(500).json({ error: 'Failed to get profit report' });
  }
});

// GET /api/reports/sold-products - Sold products report
router.get('/sold-products', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { from, to } = req.query;

    const result = await query(
      `SELECT 
        p.id, p.name, p.barcode,
        c.name as categoryName,
        u.name as unitName,
        SUM(si.quantity) as totalSold,
        SUM(si.total_price) as totalRevenue
       FROM SaleItems si
       JOIN Sales s ON si.sale_id = s.id
       JOIN Products p ON si.product_id = p.id
       LEFT JOIN Categories c ON p.category_id = c.id
       LEFT JOIN Units u ON p.unit_id = u.id
       WHERE s.store_id = @storeId
         AND s.transaction_date >= @from
         AND s.transaction_date <= @to
       GROUP BY p.id, p.name, p.barcode, c.name, u.name
       ORDER BY totalSold DESC`,
      { storeId, from, to }
    );

    res.json(result);
  } catch (error) {
    console.error('Get sold products report error:', error);
    res.status(500).json({ error: 'Failed to get sold products report' });
  }
});

export default router;
