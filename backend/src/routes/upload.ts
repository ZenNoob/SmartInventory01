/**
 * Upload Routes
 * Handles file upload endpoints
 */

import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/middleware.js';
import { authenticate, storeContext } from '../middleware/auth.js';
import {
  uploadService,
  uploadSingleImage,
  ProcessedImage,
} from '../services/upload-service.js';

const router = Router();

/**
 * POST /api/upload/product-image
 * Upload a product image
 */
router.post(
  '/product-image',
  authenticate,
  storeContext,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    uploadSingleImage(req, res, (err) => {
      if (err) {
        if (err.message.includes('Only image files')) {
          return res.status(400).json({ error: err.message });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds 5MB limit' });
        }
        return res.status(500).json({ error: 'Upload failed' });
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const storeId = req.storeId;
      if (!storeId) {
        return res.status(400).json({ error: 'Store ID required' });
      }

      const result: ProcessedImage = await uploadService.processProductImage(
        file.buffer,
        storeId
      );

      res.json({
        success: true,
        images: result,
      });
    } catch (error) {
      console.error('Image processing error:', error);
      res.status(500).json({ error: 'Failed to process image' });
    }
  }
);

/**
 * DELETE /api/upload/product-image
 * Delete product images
 */
router.delete(
  '/product-image',
  authenticate,
  storeContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL required' });
      }

      await uploadService.deleteProductImages(imageUrl);

      res.json({ success: true });
    } catch (error) {
      console.error('Image deletion error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
);

export default router;
