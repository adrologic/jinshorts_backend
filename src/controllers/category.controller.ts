import { Request, Response } from 'express';
import { Category, Article } from '../database/models';

export async function getAllCategories(_req: Request, res: Response) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) { res.status(404).json({ error: 'Category not found' }); return; }
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const articleCount = await Article.countDocuments({ categoryId: req.params.id });
    if (articleCount > 0) {
      res.status(400).json({ error: `Cannot delete category with ${articleCount} articles` });
      return;
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) { res.status(404).json({ error: 'Category not found' }); return; }
    res.json({ message: 'Category deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function reorderCategories(req: Request, res: Response) {
  try {
    const { order } = req.body; // [{id, sortOrder}]
    if (!Array.isArray(order)) {
      res.status(400).json({ error: 'order must be an array' });
      return;
    }
    await Promise.all(
      order.map((item: { id: string; sortOrder: number }) =>
        Category.findByIdAndUpdate(item.id, { sortOrder: item.sortOrder })
      )
    );
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
