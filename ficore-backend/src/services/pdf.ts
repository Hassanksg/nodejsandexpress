import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { formatCurrency, formatDate } from '../utils/helpers';
import { UserModel, User } from '../models/user';
import { BillModel, Bill } from '../models/bill';
import { ShoppingModel, ShoppingList } from '../models/shopping';
import { logger } from '../utils/logger';
import { ValidationError } from '../types/errors';

interface PdfOptions {
  title: string;
  data: Bill[] | ShoppingList[];
  user: User | null;
  exportType: 'single' | 'multiple';
}

async function createBillPDF(bills: Bill[], userId: string, exportType: 'single' | 'multiple'): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4); // [595, 842]
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
    page.drawText(exportType === 'single' ? 'Bill Details' : 'Bill History', {
      x: 50,
      y,
      size: 12,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    if (exportType === 'single') {
      const bill = bills[0];
      if (!bill) throw new ValidationError('Bill not found');
      page.setFontSize(10);
      page.drawText(`Bill ID: ${bill._id.toString()}`, { x: 50, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Name: ${bill.name}`, { x: 50, y: y - 15, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Amount: ${formatCurrency(bill.amount)}`, { x: 50, y: y - 30, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Due Date: ${formatDate(bill.due_date)}`, { x: 50, y: y - 45, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Frequency: ${bill.frequency}`, { x: 50, y: y - 60, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Category: ${bill.category || 'N/A'}`, { x: 50, y: y - 75, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Status: ${bill.status}`, { x: 50, y: y - 90, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Reminder Days: ${bill.reminder_days || 'None'}`, { x: 50, y: y - 105, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Notes: ${bill.notes ? bill.notes.substring(0, 200) + '...' : 'N/A'}`, { x: 50, y: y - 120, size: 10, color: rgb(0, 0, 0) });
      y -= 140;
    } else {
      page.setFontSize(10);
      page.drawText('Date', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('Name', { x: 120, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('Amount', { x: 200, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('Due Date', { x: 270, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('Status', { x: 350, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('Category', { x: 410, y, size: 10, color: rgb(0, 0, 0) });
      y -= 20;

      for (const bill of bills) {
        if (y < 50) {
          page = pdfDoc.addPage(PageSizes.A4);
          drawFicoreHeader(page, user, height - 50);
          y = height - 120;
          page.setFontSize(10);
          page.drawText('Date', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('Name', { x: 120, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('Amount', { x: 200, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('Due Date', { x: 270, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('Status', { x: 350, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('Category', { x: 410, y, size: 10, color: rgb(0, 0, 0) });
          y -= 20;
        }
        page.drawText(formatDate(bill.created_at), { x: 50, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(bill.name.substring(0, 15), { x: 120, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(formatCurrency(bill.amount), { x: 200, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(formatDate(bill.due_date), { x: 270, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(bill.status, { x: 350, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(bill.category || 'N/A', { x: 410, y, size: 9, color: rgb(0, 0, 0) });
        y -= 15;
      }
    }

    const pdfBytes = await pdfDoc.save();
    logger.info(`Generated bill PDF for user ${userId}, type: ${exportType}`);
    return Buffer.from(pdfBytes);
  } catch (error) {
    logger.error(`Failed to generate bill PDF for user ${userId}`, { error });
    throw new ValidationError('Failed to generate bill PDF');
  }
}

async function createShoppingPDF(shoppingLists: ShoppingList[], userId: string, exportType: 'single' | 'multiple'): Promise<Buffer> {
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
    page.drawText(exportType === 'single' ? 'Shopping List Details' : 'Shopping History', {
      x: 50,
      y,
      size: 12,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    if (exportType === 'single') {
      const list = shoppingLists[0];
      if (!list) throw new ValidationError('Shopping list not found');
      page.setFontSize(10);
      page.drawText(`List ID: ${list._id.toString()}`, { x: 50, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Name: ${list.list_name}`, { x: 50, y: y - 15, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Budget: ${formatCurrency(list.budget)}`, { x: 50, y: y - 30, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Total Estimated Cost: ${formatCurrency(list.total_estimated_cost)}`, { x: 50, y: y - 45, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`Created: ${formatDate(list.created_at)}`, { x: 50, y: y - 60, size: 10, color: rgb(0, 0, 0) });
      y -= 80;
      page.drawText('Items', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
      y -= 15;
      page.drawText('Name', { x: 50, y, size: 9, color: rgb(0, 0, 0) });
      page.drawText('Cost', { x: 150, y, size: 9, color: rgb(0, 0, 0) });
      page.drawText('Qty', { x: 220, y, size: 9, color: rgb(0, 0, 0) });
      page.drawText('Category', { x: 270, y, size: 9, color: rgb(0, 0, 0) });
      page.drawText('Purchased', { x: 350, y, size: 9, color: rgb(0, 0, 0) });
      y -= 15;

      for (const item of list.items) {
        if (y < 50) {
          page = pdfDoc.addPage(PageSizes.A4);
          drawFicoreHeader(page, user, height - 50);
          y = height - 50;
          page.setFontSize(10);
          page.drawText('Items (continued)', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
          y -= 15;
          page.drawText('Name', { x: 50, y, size: 9, color: rgb(0, 0, 0) });
          page.drawText('Cost', { x: 150, y, size: 9, color: rgb(0, 0, 0) });
          page.drawText('Qty', { x: 220, y, size: 9, color: rgb(0, 0, 0) });
          page.drawText('Category', { x: 270, y, size: 9, color: rgb(0, 0, 0) });
          page.drawText('Purchased', { x: 350, y, size: 9, color: rgb(0, 0, 0) });
          y -= 15;
        }
        page.drawText(item.name.substring(0, 20), { x: 50, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(formatCurrency(item.estimated_cost), { x: 150, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(`${item.quantity}`, { x: 220, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(item.category || 'N/A', { x: 270, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(item.is_purchased ? 'Yes' : 'No', { x: 350, y, size: 9, color: rgb(0, 0, 0) });
        y -= 15;
      }
    } else {
      page.setFontSize(10);
      page.drawText('Date', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('List Name', { x: 120, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('Budget', { x: 220, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('Est. Cost', { x: 290, y, size: 10, color: rgb(0, 0, 0) });
      page.drawText('Items', { x: 370, y, size: 10, color: rgb(0, 0, 0) });
      y -= 20;

      for (const list of shoppingLists) {
        if (y < 50) {
          page = pdfDoc.addPage(PageSizes.A4);
          drawFicoreHeader(page, user, height - 50);
          y = height - 120;
          page.setFontSize(10);
          page.drawText('Date', { x: 50, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('List Name', { x: 120, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('Budget', { x: 220, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('Est. Cost', { x: 290, y, size: 10, color: rgb(0, 0, 0) });
          page.drawText('Items', { x: 370, y, size: 10, color: rgb(0, 0, 0) });
          y -= 20;
        }
        page.drawText(formatDate(list.created_at), { x: 50, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(list.list_name.substring(0, 15), { x: 120, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(formatCurrency(list.budget), { x: 220, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(formatCurrency(list.total_estimated_cost), { x: 290, y, size: 9, color: rgb(0, 0, 0) });
        page.drawText(`${list.items.length}`, { x: 370, y, size: 9, color: rgb(0, 0, 0) });
        y -= 15;
      }
    }

    const pdfBytes = await pdfDoc.save();
    logger.info(`Generated shopping PDF for user ${userId}, type: ${exportType}`);
    return Buffer.from(pdfBytes);
  } catch (error) {
    logger.error(`Failed to generate shopping PDF for user ${userId}`, { error });
    throw new ValidationError('Failed to generate shopping PDF');
  }
}

function drawFicoreHeader(page: any, user: User | null, yStart: number): void {
  page.setFontSize(14);
  page.drawText('FiCore Africa', { x: 50, y: yStart, size: 14, color: rgb(0, 0.2, 0.4) });
  page.drawText(`User: ${user?.display_name || 'Unknown'}`, { x: 50, y: yStart - 20, size: 10, color: rgb(0, 0, 0) });
}

export { createBillPDF, createShoppingPDF };
