import { Router, Request, Response } from 'express';
import { authenticate, storeContext } from '../middleware/auth';
import * as shippingService from '../services/shipping-service';

const router = Router();

// GET /api/shipping/providers - Get available shipping providers
router.get('/providers', (req: Request, res: Response) => {
  const providers = shippingService.getAvailableProviders();
  res.json({ success: true, providers });
});

// POST /api/shipping/calculate-fee - Calculate shipping fee
router.post('/calculate-fee', authenticate, storeContext, async (req: Request, res: Response) => {
  try {
    const { provider, sender, receiver, items, totalWeight, codAmount } = req.body;

    if (!provider || !sender || !receiver || !totalWeight) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request: shippingService.ShippingRequest = {
      orderId: '',
      sender,
      receiver,
      items: items || [],
      totalWeight,
      codAmount,
    };

    let result: shippingService.ShippingFeeResult;

    switch (provider.toLowerCase()) {
      case 'ghn':
        result = await shippingService.calculateGHNFee(request);
        break;
      case 'ghtk':
        result = await shippingService.calculateGHTKFee(request);
        break;
      default:
        return res.status(400).json({ error: 'Invalid shipping provider' });
    }

    if (result.success) {
      res.json({
        success: true,
        fee: result.fee,
        expectedDays: result.expectedDays,
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Calculate shipping fee error:', error);
    res.status(500).json({ error: 'Failed to calculate shipping fee' });
  }
});

// POST /api/shipping/create-order - Create shipping order
router.post('/create-order', authenticate, storeContext, async (req: Request, res: Response) => {
  try {
    const { provider, orderId, sender, receiver, items, totalWeight, codAmount, note } = req.body;

    if (!provider || !orderId || !sender || !receiver || !totalWeight) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request: shippingService.ShippingRequest = {
      orderId,
      sender,
      receiver,
      items: items || [],
      totalWeight,
      codAmount,
      note,
    };

    let result: shippingService.ShippingOrderResult;

    switch (provider.toLowerCase()) {
      case 'ghn':
        result = await shippingService.createGHNOrder(request);
        break;
      case 'ghtk':
        result = await shippingService.createGHTKOrder(request);
        break;
      default:
        return res.status(400).json({ error: 'Invalid shipping provider' });
    }

    if (result.success) {
      res.json({
        success: true,
        trackingCode: result.trackingCode,
        shippingOrderId: result.shippingOrderId,
        fee: result.fee,
        expectedDelivery: result.expectedDelivery,
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Create shipping order error:', error);
    res.status(500).json({ error: 'Failed to create shipping order' });
  }
});

// GET /api/shipping/track/:provider/:trackingCode - Track shipping order
router.get('/track/:provider/:trackingCode', authenticate, async (req: Request, res: Response) => {
  try {
    const { provider, trackingCode } = req.params;

    if (!provider || !trackingCode) {
      return res.status(400).json({ error: 'Provider and tracking code are required' });
    }

    let result: shippingService.TrackingResult;

    switch (provider.toLowerCase()) {
      case 'ghn':
        result = await shippingService.trackGHNOrder(trackingCode);
        break;
      case 'ghtk':
        result = await shippingService.trackGHTKOrder(trackingCode);
        break;
      default:
        return res.status(400).json({ error: 'Invalid shipping provider' });
    }

    if (result.success) {
      res.json({
        success: true,
        status: result.status,
        statusText: result.statusText,
        location: result.location,
        updatedAt: result.updatedAt,
        history: result.history,
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Track shipping order error:', error);
    res.status(500).json({ error: 'Failed to track shipping order' });
  }
});

// POST /api/shipping/webhook/ghn - GHN webhook for status updates
router.post('/webhook/ghn', async (req: Request, res: Response) => {
  try {
    const { OrderCode, Status } = req.body;

    if (OrderCode && Status) {
      await shippingService.updateShippingStatus(OrderCode, Status);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('GHN webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /api/shipping/webhook/ghtk - GHTK webhook for status updates
router.post('/webhook/ghtk', async (req: Request, res: Response) => {
  try {
    const { label_id, status_id } = req.body;

    if (label_id && status_id) {
      await shippingService.updateShippingStatus(label_id, String(status_id));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('GHTK webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
