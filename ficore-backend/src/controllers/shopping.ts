import { Request, Response } from 'express';
import { ShoppingListModel } from '../models/shopping';
import { deductFicoreCredits } from '../services/credit';
import { cleanCurrency, formatCurrency, formatDate } from '../utils/helpers';
import { ValidationError, NotFoundError, InsufficientCreditsError } from '../types/errors';
import { logger } from '../utils/logger';
import { createShoppingPDF } from '../services/pdf';
import mongoose from 'mongoose';

export async function createShoppingList(req: Request, res: Response) {
  try {
    const { list_name, budget, items } = req.body;
    const userId = req.user!.id;

    if (!list_name) {
      throw new ValidationError('List name is required');
    }

    const shoppingData = {
      user_id: userId,
      list_name: list_name?.substring(0, 50),
      budget: cleanCurrency(budget) || 0,
      items: items?.map((item: any) => ({
        name: item.name?.substring(0, 50) || '',
        estimated_cost: cleanCurrency(item.estimated_cost) || 0,
        quantity: Number(item.quantity) || 1,
        category: item.category || 'Miscellaneous',
        is_purchased: false,
      })) || [],
      created_at: new Date(),
      session_id: req.headers['x-session-id'] || '',
    };

    const shoppingList = await ShoppingListModel.create([shoppingData]);
    await deductFicoreCredits(userId, 1, 'create_shopping_list', shoppingList[0]._id.toString());

    return res.json({ success: true, shopping_list: shoppingList[0] });
  } catch (error: any) {
    logger.error('Error creating shopping list', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function addShoppingItem(req: Request, res: Response) {
  try {
    const { list_id, name, estimated_cost, quantity } = req.body;
    const userId = req.user!.id;

    if (!list_id || !name || !estimated_cost || !quantity) {
      throw new ValidationError('List ID, name, estimated cost, and quantity are required');
    }

    const shoppingList = await ShoppingListModel.findOne({ _id: list_id, user_id: userId });
    if (!shoppingList) {
      throw new NotFoundError('Shopping list not found');
    }

    const newItem = {
      name: name.substring(0, 50),
      estimated_cost: cleanCurrency(estimated_cost),
      quantity: Number(quantity) || 1,
      category: 'Miscellaneous', // Will be auto-categorized in pre-validate hook
      is_purchased: false,
    };

    shoppingList.items.push(newItem);
    await shoppingList.save();
    await deductFicoreCredits(userId, 1, 'add_shopping_item', list_id);

    return res.json({ success: true, shopping_list: shoppingList });
  } catch (error: any) {
    logger.error('Error adding shopping item', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function getShoppingDashboard(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const shoppingLists = await ShoppingListModel.find({ user_id: userId })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalLists = await ShoppingListModel.countDocuments({ user_id: userId });
    const latestList = shoppingLists[0] || null;

    const categories = await ShoppingListModel.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$items' },
      { $group: { _id: '$items.category', total: { $sum: { $multiply: ['$items.estimated_cost', '$items.quantity'] } } } },
      { $project: { label: '$_id', value: '$total', _id: 0 } },
    ]);

    const totalSpent = shoppingLists.reduce((sum: number, list: any) =>
      sum + list.items.reduce((listSum: number, item: any) =>
        listSum + (item.is_purchased ? item.estimated_cost * item.quantity : 0), 0), 0);

    const insights = [];
    if (latestList && latestList.total_estimated_cost > latestList.budget) {
      insights.push('Your latest shopping list exceeds the budget. Consider removing non-essential items.');
    }
    if (categories.length > 0) {
      const topCategory = categories.reduce((max: any, cat: any) => cat.value > max.value ? cat : max, categories[0]);
      insights.push(`Your highest spending category is ${topCategory.label}.`);
    }

    return res.json({
      success: true,
      shopping_lists: shoppingLists,
      latest_list: latestList,
      categories,
      summary: {
        total_lists: totalLists,
        total_spent: formatCurrency(totalSpent),
      },
      insights,
      tips: [
        'Prioritize essential items.',
        'Compare prices before purchasing.',
        'Review your budget regularly.',
      ],
      pagination: {
        page,
        limit,
        total: totalLists,
        pages: Math.ceil(totalLists / limit),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching shopping dashboard', { error, userId: req.user!.id });
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function toggleShoppingItem(req: Request, res: Response) {
  try {
    const { list_id, item_id } = req.body;
    const userId = req.user!.id;

    if (!list_id || !item_id) {
      throw new ValidationError('List ID and item ID are required');
    }

    const shoppingList = await ShoppingListModel.findOne({ _id: list_id, user_id: userId });
    if (!shoppingList) {
      throw new NotFoundError('Shopping list not found');
    }

    const item = shoppingList.items.id(item_id);
    if (!item) {
      throw new NotFoundError('Item not found');
    }

    item.is_purchased = !item.is_purchased;
    await shoppingList.save();
    await deductFicoreCredits(userId, 1, 'toggle_shopping_item', list_id);

    return res.json({ success: true, shopping_list: shoppingList });
  } catch (error: any) {
    logger.error('Error toggling shopping item', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function deleteShoppingList(req: Request, res: Response) {
  try {
    const { list_id } = req.body;
    const userId = req.user!.id;

    if (!list_id) {
      throw new ValidationError('List ID is required');
    }

    const result = await ShoppingListModel.deleteOne({ _id: list_id, user_id: userId });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Shopping list not found');
    }

    await deductFicoreCredits(userId, 1, 'delete_shopping_list', list_id);

    return res.json({ success: true, message: 'Shopping list deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting shopping list', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function deleteShoppingItem(req: Request, res: Response) {
  try {
    const { list_id, item_id } = req.body;
    const userId = req.user!.id;

    if (!list_id || !item_id) {
      throw new ValidationError('List ID and item ID are required');
    }

    const shoppingList = await ShoppingListModel.findOne({ _id: list_id, user_id: userId });
    if (!shoppingList) {
      throw new NotFoundError('Shopping list not found');
    }

    const item = shoppingList.items.id(item_id);
    if (!item) {
      throw new NotFoundError('Item not found');
    }

    shoppingList.items.pull(item_id);
    await shoppingList.save();
    await deductFicoreCredits(userId, 1, 'delete_shopping_item', list_id);

    return res.json({ success: true, shopping_list: shoppingList });
  } catch (error: any) {
    logger.error('Error deleting shopping item', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function exportShoppingPDF(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const exportType = req.params.exportType;
    const listId = req.params.listId;

    if (exportType !== 'single' && exportType !== 'history') {
      throw new ValidationError('Invalid export type');
    }

    if (exportType === 'single' && !listId) {
      throw new ValidationError('List ID required');
    }

    const shoppingLists = exportType === 'single'
      ? [await ShoppingListModel.findOne({ _id: listId, user_id: userId })]
      : await ShoppingListModel.find({ user_id: userId }).limit(100);

    if (exportType === 'single' && !shoppingLists[0]) {
      throw new NotFoundError('Shopping list not found');
    }

    const creditCost = exportType === 'single' ? 1 : 2;
    await deductFicoreCredits(userId, creditCost, `export_shopping_pdf_${exportType}`, listId || null);

    const pdfBuffer = await createShoppingPDF(shoppingLists, userId, exportType === 'history' ? 'multiple' : 'single');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=shopping_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`,
    });
    return res.send(pdfBuffer);
  } catch (error: any) {
    logger.error('Error exporting shopping PDF', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}
