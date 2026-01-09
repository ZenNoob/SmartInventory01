import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, insert, update, remove } from '../db';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';

const router = Router();

// Database uses snake_case
interface CategoryRecord {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
}

router.use(authenticate);
router.use(storeContext);

// GET /api/categories
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;

    const categories = await query<CategoryRecord>(
      'SELECT * FROM Categories WHERE store_id = @storeId ORDER BY name',
      { storeId }
    );

    res.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        parentId: c.parent_id,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))
    );
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    const category = await queryOne<CategoryRecord>(
      'SELECT * FROM Categories WHERE id = @id AND store_id = @storeId',
      { id, storeId }
    );

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parent_id,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { name, description, parentId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const result = await insert<CategoryRecord>('Categories', {
      id: uuidv4(),
      store_id: storeId,
      name: name,
      description: description || null,
      parent_id: parentId || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (!result) {
      res.status(500).json({ error: 'Failed to create category' });
      return;
    }

    res.status(201).json({
      id: result.id,
      name: result.name,
      description: result.description,
      parentId: result.parent_id,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;
    const { name, description, parentId } = req.body;

    const existing = await queryOne<CategoryRecord>(
      'SELECT * FROM Categories WHERE id = @id AND store_id = @storeId',
      { id, storeId }
    );

    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const result = await update<CategoryRecord>('Categories', id, {
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      parent_id: parentId !== undefined ? parentId : existing.parent_id,
      updated_at: new Date(),
    });

    if (!result) {
      res.status(500).json({ error: 'Failed to update category' });
      return;
    }

    res.json({
      id: result.id,
      name: result.name,
      description: result.description,
      parentId: result.parent_id,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    const existing = await queryOne<CategoryRecord>(
      'SELECT * FROM Categories WHERE id = @id AND store_id = @storeId',
      { id, storeId }
    );

    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await remove('Categories', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
