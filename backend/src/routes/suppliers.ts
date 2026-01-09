import { Router, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/suppliers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    
    const suppliers = await query(
      'SELECT * FROM Suppliers WHERE store_id = @storeId ORDER BY name',
      { storeId }
    );

    res.json(suppliers.map((s: Record<string, unknown>) => ({
      id: s.id,
      storeId: s.store_id,
      name: s.name,
      contactPerson: s.contact_person,
      email: s.email,
      phone: s.phone,
      address: s.address,
      taxCode: s.tax_code,
      notes: s.notes,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })));
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to get suppliers' });
  }
});

// TODO: Implement full CRUD

export default router;
