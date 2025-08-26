import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { formatCurrency, formatDate } from '../utils/helpers';
import { UserModel } from '../models/user';
import { BillModel } from '../models/bill';
import { ShoppingListModel } from '../models/shopping';
import { logger } from '../utils/logger';
import { ValidationError } from '../types/errors';

// Interface for User (to avoid importing User type directly)
interface User {
  _id: string;
  display_name: string;
  email: string;
}

/**
 * Draws the header for the PDF with user information.
 * @param page - The PDF page to draw on.
 * @param user - The user object containing display_name and email.
 * @param y - The y-coordinate to start drawing the header.
 */
function drawFicoreHeader(page: any, user: User, y: number): void {
  const fontSize = 14;
  page.setFontSize(fontSize);
  page.drawText('FiCore Budget Management', { x: 50, y, size: fontSize, color: rgb(0, 0, 0) });
  page.drawText(`User: ${user.display_name}`, { x: 50, y: y - 20, size: fontSize - 2, color: rgb(0, 0, 0) });
  page.drawText(`Email: ${user.email}`, { x: 50, y: y - 35, size: fontSize - 2, color: rgb(0, 0, 0) });
}

/**
 * Creates a PDF document for bill data.
 * @param bills - Array of bill data.
 * @param userId - The ID of the user.
 * @param exportType - The type of export ('single' or 'multiple').
 * @returns A Buffer containing the PDF data.
 */
async function createBillPDF(bills: any[], userId: string, exportType: 'single' | 'multiple'): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const user = await UserModel.findById(userId);
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      throw new ValidationError('User not found');
    }

    drawFicoreHeader(page, user, height - 50);
    let y = height - 100;

    page.setFont(font);
    page.setFontSize(12);
    page.drawText('Bill Summary', { x: 50, y, size: 12, color: rgb(0, 0, 0) });
    y -= 30;

    if (bills.length > 0) {
      for (const bill of bills) {
        if (y < 50) {
          page = pdfDoc.addPage(PageSizes.A4);
          drawFicoreHeader(page, user, height - 50);
          y = height - 100;
        }
        page.drawText(`Bill ID: ${bill._id.toString()}`, { x: 50, y, size: 10, color: rgb(0, 0, 0) });
        page.drawText(`Amount: ${formatCurrency(bill.amount)}`, { x: 50, y: y - 15, size: 10, color: rgb(0, 0, 0) });
        page.drawText(`Due Date: ${formatDate(bill.due_date)}`, { x: 50, y: y - 30, size: 10, color: rgb(0, 0, 0) });
        y -= 50;
      }
    } else {
      page.drawText('No bill data available.', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
    }

    const pdfBytes = await pdfDoc.save();
    logger.info(`Generated bill PDF for user ${userId}`);
    return Buffer.from(pdfBytes);
  } catch (error) {
    logger.error(`Failed to generate bill PDF for user ${userId}`, { error });
    throw new ValidationError('Failed to generate bill PDF');
  }
}

/**
 * Creates a PDF document for shopping list data.
 * @param shoppingLists - Array of shopping list data.
 * @param userId - The ID of the user.
 * @param exportType - The type of export ('single' or 'multiple').
 * @returns A Buffer containing the PDF data.
 */
async function createShoppingPDF(shoppingLists: any[], userId: string, exportType: 'single' | 'multiple'): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const user = await UserModel.findById(userId);
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      throw new ValidationError('User not found');
    }

    drawFicoreHeader(page, user, height - 50);
    let y = height - 100;

    page.setFont(font);
    page.setFontSize(12);
    page.drawText('Shopping List Summary', { x: 50, y, size: 12, color: rgb(0, 0, 0) });
    y -= 30;

    if (shoppingLists.length > 0) {
      for (const list of shoppingLists) {
        if (y < 50) {
          page = pdfDoc.addPage(PageSizes.A4);
          drawFicoreHeader(page, user, height - 50);
          y = height - 100;
        }
        page.drawText(`List ID: ${list._id.toString()}`, { x: 50, y, size: 10, color: rgb(0, 0, 0) });
        page.drawText(`Total Cost: ${formatCurrency(list.total_cost)}`, { x: 50, y: y - 15, size: 10, color: rgb(0, 0, 0) });
        page.drawText(`Date: ${formatDate(list.date)}`, { x: 50, y: y - 30, size: 10, color: rgb(0, 0, 0) });
        y -= 50;
      }
    } else {
      page.drawText('No shopping list data available.', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
    }

    const pdfBytes = await pdfDoc.save();
    logger.info(`Generated shopping PDF for user ${userId}`);
    return Buffer.from(pdfBytes);
  } catch (error) {
    logger.error(`Failed to generate shopping PDF for user ${userId}`, { error });
    throw new ValidationError('Failed to generate shopping PDF');
  }
}

/**
 * Creates a PDF document for budget data.
 * @param budgets - Array of budget data.
 * @param userId - The ID of the user.
 * @param exportType - The type of export ('single' or 'multiple').
 * @returns A Buffer containing the PDF data.
 */
async function createBudgetPDF(budgets: any[], userId: string, exportType: 'single' | 'multiple'): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const user = await UserModel.findById(userId);
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      throw new ValidationError('User not found');
    }

    drawFicoreHeader(page, user, height - 50);
    let y = height - 100;

    page.setFont(font);
    page.setFontSize(12);
    page.drawText('Budget Summary', { x: 50, y, size: 12, color: rgb(0, 0, 0) });
    y -= 30;

    if (budgets.length > 0) {
      const budget = budgets[0];
      page.setFontSize(10);
      page.drawText(`Budget ID: ${budget._id.toString()}`, { x: 50, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Month: ${budget.month || 'N/A'}`, { x: 50, y: y - 15, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Total Budget: ${formatCurrency(budget.total_budget)}`, { x: 50, y: y - 30, size: 10, color: rgb(0, 0, 0) });
      y -= 50;

      page.drawText('Categories', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
      y -= 15;
      page.drawText('Category', { x: 50, y, size: 9, color: rgb(0, 0, 0) });
      page.drawText('Budgeted', { x: 150, y, size: 9, color: rgb(0, 0, 0) });
      page.drawText('Spent', { x: 250, y, size: 9, color: rgb(0, 0, 0) });
      y -= 15;

      for (const category of budget.categories || []) {
        if (y < 50) {
          page = pdfDoc.addPage(PageSizes.A4);
          drawFicoreHeader(page, user, height - 50);
          y = height - 50;
          page.drawText('Categories (continued)', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
          y -= 15;
          page.drawText('Category', { x: 50, y, size: 9, color: rgb(0, 0, 0) });
          page.drawText('Budgeted', { x: 150, y, size: 9, color: rgb(0, 0, 0) });
          page.drawText('Spent', { x: 250, y, size: 9, color: rgb(0, 0, 0) });
          y -= 15;
        }
        page.drawText(category.category || 'N/A', { x: 50, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(formatCurrency(category.budgeted || 0), { x: 150, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(formatCurrency(category.spent || 0), { x: 250, y, size: 9, color: rgb(0, 0, 0) });
        y -= 15;
      }
    } else {
      page.drawText('No budget data available.', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
    }

    const pdfBytes = await pdfDoc.save();
    logger.info(`Generated budget PDF for user ${userId}`);
    return Buffer.from(pdfBytes);
  } catch (error) {
    logger.error(`Failed to generate budget PDF for user ${userId}`, { error });
    throw new ValidationError('Failed to generate budget PDF');
  }
}

// Export all functions
export { createBillPDF, createShoppingPDF, createBudgetPDF, drawFicoreHeader };
