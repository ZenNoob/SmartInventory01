import { Router, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/products
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    
    const products = await query(
      `SELECT p.*, c.name as category_name
       FROM Products p
       LEFT JOIN Categories c ON p.category_id = c.id
       WHERE p.store_id = @storeId
       ORDER BY p.name`,
      { storeId }
    );

    res.json(products.map((p: Record<string, unknown>) => ({
      id: p.id,
      storeId: p.store_id,
      categoryId: p.category_id,
      categoryName: p.category_name,
      name: p.name,
      description: p.description,
      price: p.price,
      costPrice: p.cost_price,
      sku: p.sku,
      stockQuantity: p.stock_quantity,
      images: p.images,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })));
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    const product = await queryOne(
      `SELECT p.*, c.name as category_name
       FROM Products p
       LEFT JOIN Categories c ON p.category_id = c.id
       WHERE p.id = @id AND p.store_id = @storeId`,
      { id, storeId }
    );

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({
      id: product.id,
      storeId: product.store_id,
      categoryId: product.category_id,
      categoryName: product.category_name,
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.cost_price,
      sku: product.sku,
      stockQuantity: product.stock_quantity,
      images: product.images,
      status: product.status,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// TODO: Implement POST, PUT, DELETE

export default router;
