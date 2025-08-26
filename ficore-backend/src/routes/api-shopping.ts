// routes/api-shopping.ts
import express from 'express';
import { jwtRequired } from '../services/auth';
import { createShoppingList, addShoppingItem, getShoppingDashboard, toggleShoppingItem, deleteShoppingList, deleteShoppingItem, exportShoppingPDF } from '../controllers/shopping';
import { Request, Response } from 'express';

const router = express.Router();

router.post('/new_list', jwtRequired, createShoppingList);
router.post('/new_item', jwtRequired, addShoppingItem);
router.get('/dashboard', jwtRequired, getShoppingDashboard);
router.get('/manage', jwtRequired, getShoppingDashboard); // Reuse for manage
router.post('/toggle_item', jwtRequired, toggleShoppingItem);
router.post('/delete_list', jwtRequired, deleteShoppingList);
router.post('/delete_item', jwtRequired, deleteShoppingItem);
router.get('/export_pdf/:exportType/:listId?', jwtRequired, exportShoppingPDF);


export default router;
