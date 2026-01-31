import { Router, Response } from 'express';
import { AuthenticatedRequest as AuthRequest } from '../auth/middleware.js';
import { unitConversionService } from '../services/unit-conversion-service';

const router = Router();

// GET /api/products/:productId/units - Get available units for product
router.get('/products/:productId/units', async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const result = await unitConversionService.getProductUnits(productId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get product units error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/units/convert - Convert quantity between units
router.post('/units/convert', async (req: AuthRequest, res: Response) => {
  try {
    const { productId, fromUnitId, toUnitId, quantity } = req.body;
    
    if (!productId || !fromUnitId || !toUnitId || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const result = await unitConversionService.convertQuantity(
      productId,
      fromUnitId,
      toUnitId,
      Number(quantity)
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Convert quantity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/:productId/calculate-price - Calculate price in different units
router.post('/products/:productId/calculate-price', async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { unitId, quantity, priceType = 'cost' } = req.body;
    
    if (!unitId || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const result = await unitConversionService.calculatePrice(
      productId,
      unitId,
      Number(quantity),
      priceType
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Calculate price error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
