import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';
import { categoriesSPRepository } from '../repositories/categories-sp-repository';

const router = Router();

router.use(authenticate);
router.use(storeContext);

// GET /api/categories
// Requirements: 9.4 - Uses sp_Categories_GetByStore
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;

    // Use SP Repository instead of inline query
    const categories = await categoriesSPRepository.getByStore(storeId);

    res.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        parentId: c.parentId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
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

    // Use SP Repository instead of inline query
    const category = await categoriesSPRepository.getById(id, storeId);

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// POST /api/categories
// Requirements: 9.1 - Uses sp_Categories_Create
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId!;
    const { name, description, parentId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    // Use SP Repository instead of inline query
    const category = await categoriesSPRepository.create({
      id: uuidv4(),
      storeId,
      name,
      description: description || null,
      parentId: parentId || null,
    });

    res.status(201).json({
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
// Requirements: 9.2 - Uses sp_Categories_Update
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;
    const { name, description, parentId } = req.body;

    // Use SP Repository instead of inline query
    const category = await categoriesSPRepository.update(id, storeId, {
      name: name !== undefined ? name : undefined,
      description: description !== undefined ? description : undefined,
      parentId: parentId !== undefined ? parentId : undefined,
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
// Requirements: 9.3 - Uses sp_Categories_Delete
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = req.storeId!;

    // Use SP Repository instead of inline query
    const deleted = await categoriesSPRepository.delete(id, storeId);

    if (!deleted) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
