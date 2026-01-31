import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';
import { unitsSPRepository } from '../repositories/units-sp-repository';
import { productUnitsRepository } from '../repositories/product-units-repository';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/units
// Requirements: 8.4 - Uses sp_Units_GetByStore
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    
    // Use SP Repository instead of inline query
    const units = await unitsSPRepository.getByStore(storeId);
    
    console.log('[Units API] Store:', storeId, 'Units count:', units.length);
    console.log('[Units API] Units:', JSON.stringify(units, null, 2));

    res.json(units.map(u => ({
      id: u.id,
      name: u.name,
      description: u.description,
      baseUnitId: u.baseUnitId,
      conversionFactor: u.conversionFactor,
    })));
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: 'Failed to get units' });
  }
});

// GET /api/units/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    // Use SP Repository instead of inline query
    const unit = await unitsSPRepository.getById(id, storeId);

    if (!unit) {
      res.status(404).json({ error: 'Không tìm thấy đơn vị' });
      return;
    }

    res.json({
      id: unit.id,
      name: unit.name,
      description: unit.description,
      baseUnitId: unit.baseUnitId,
      conversionFactor: unit.conversionFactor,
    });
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({ error: 'Failed to get unit' });
  }
});

// POST /api/units
// Requirements: 8.1 - Uses sp_Units_Create
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { name, description, baseUnitId, conversionFactor } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    // Use SP Repository instead of inline query
    const unit = await unitsSPRepository.create({
      id: uuidv4(),
      storeId,
      name,
      description: description || null,
      baseUnitId: baseUnitId || null,
      conversionFactor: conversionFactor ?? 1,
    });

    res.status(201).json({
      id: unit.id,
      name: unit.name,
      description: unit.description,
      baseUnitId: unit.baseUnitId,
      conversionFactor: unit.conversionFactor,
    });
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// PUT /api/units/:id
// Requirements: 8.2 - Uses sp_Units_Update
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;
    const { name, description, baseUnitId, conversionFactor } = req.body;

    // Use SP Repository instead of inline query
    const unit = await unitsSPRepository.update(id, storeId, {
      name: name !== undefined ? name : undefined,
      description: description !== undefined ? description : undefined,
      baseUnitId: baseUnitId !== undefined ? baseUnitId : undefined,
      conversionFactor: conversionFactor !== undefined ? conversionFactor : undefined,
    });

    if (!unit) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    res.json({
      id: unit.id,
      name: unit.name,
      description: unit.description,
      baseUnitId: unit.baseUnitId,
      conversionFactor: unit.conversionFactor,
    });
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// DELETE /api/units/:id
// Requirements: 8.3 - Uses sp_Units_Delete
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    // Use SP Repository instead of inline query
    const deleted = await unitsSPRepository.delete(id, storeId);

    if (!deleted) {
      res.status(404).json({ error: 'Unit not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

// ==================== Product Unit Configurations ====================

// GET /api/units/product-configs - Get all product unit configurations
router.get('/product-configs', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const configs = await productUnitsRepository.findAllProductsWithConversion(storeId);
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Get product unit configs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get product unit configurations' });
  }
});

// GET /api/units/product-configs/:productId - Get product unit configuration by product ID
router.get('/product-configs/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const storeId = req.storeId!;
    const config = await productUnitsRepository.findByProductWithNames(productId, storeId);
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Get product unit config error:', error);
    res.status(500).json({ success: false, error: 'Failed to get product unit configuration' });
  }
});

// POST /api/units/product-configs - Create or update product unit configuration
router.post('/product-configs', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { productId, baseUnitId, conversionUnitId, conversionRate, baseUnitPrice, conversionUnitPrice } = req.body;

    if (!productId || !baseUnitId || !conversionUnitId || !conversionRate) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Check if configuration already exists
    const existing = await productUnitsRepository.findByProduct(productId, storeId);

    if (existing) {
      // Update existing configuration
      const updated = await productUnitsRepository.update(existing.id, {
        baseUnitId,
        conversionUnitId,
        conversionRate: Number(conversionRate),
        baseUnitPrice: Number(baseUnitPrice) || 0,
        conversionUnitPrice: Number(conversionUnitPrice) || 0,
      }, storeId);
      res.json({ success: true, data: updated });
    } else {
      // Create new configuration
      const created = await productUnitsRepository.create({
        productId,
        storeId,
        baseUnitId,
        conversionUnitId,
        conversionRate: Number(conversionRate),
        baseUnitPrice: Number(baseUnitPrice) || 0,
        conversionUnitPrice: Number(conversionUnitPrice) || 0,
        isActive: true,
      }, storeId);
      res.status(201).json({ success: true, data: created });
    }
  } catch (error) {
    console.error('Upsert product unit config error:', error);
    res.status(500).json({ success: false, error: 'Failed to save product unit configuration' });
  }
});

// DELETE /api/units/product-configs/:productId - Delete product unit configuration
router.delete('/product-configs/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const storeId = req.storeId!;

    const existing = await productUnitsRepository.findByProduct(productId, storeId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Product unit configuration not found' });
      return;
    }

    await productUnitsRepository.delete(existing.id, storeId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete product unit config error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product unit configuration' });
  }
});

export default router;
