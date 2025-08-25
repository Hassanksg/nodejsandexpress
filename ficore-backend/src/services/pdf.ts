import { PDFDocument, rgb } from 'pdf-lib';
import { formatCurrency, formatDate } from '../utils/helpers';
import { UserModel } from '../models/user';
import { logger } from '../utils/logger';
export async function createBillPDF(bills: any[], userId: string, exportType: string): Promise<buffer> {
const pdfDoc = await PDFDocument.create();
let page = pdfDoc.addPage([595, 842]); // A4 size
const { width, height } = page.getSize();</buffer>
const user = await UserModel.findById(userId);
drawFicoreHeader(page, user, height - 50);
let y = height - 100;
page.drawText(exportType === 'single' ? 'Bill Details' : 'Bill History', {
x: 50,
y,
size: 12,
color: rgb(0, 0, 0),
});
y -= 30;
if (exportType === 'single') {
const bill = bills[0];
page.drawText(Bill ID: ${bill._id}, { x: 50, y, size: 10 });
page.drawText(Name: ${bill.name}, { x: 50, y: y - 15, size: 10 });
page.drawText(Amount: ${formatCurrency(bill.amount)}, { x: 50, y: y - 30, size: 10 });
page.drawText(Due Date: ${formatDate(bill.due_date)}, { x: 50, y: y - 45, size: 10 });
page.drawText(Frequency: ${bill.frequency}, { x: 50, y: y - 60, size: 10 });
page.drawText(Category: ${bill.category}, { x: 50, y: y - 75, size: 10 });
page.drawText(Status: ${bill.status}, { x: 50, y: y - 90, size: 10 });
page.drawText(Reminder Days: ${bill.reminder_days}, { x: 50, y: y - 105, size: 10 });
page.drawText(Notes: ${bill.notes.substring(0, 200)}..., { x: 50, y: y - 120, size: 10 }); // Truncate long notes
y -= 140;
} else {
page.drawText('Date', { x: 50, y, size: 10 });
page.drawText('Name', { x: 120, y, size: 10 });
page.drawText('Amount', { x: 200, y, size: 10 });
page.drawText('Due Date', { x: 270, y, size: 10 });
page.drawText('Status', { x: 350, y, size: 10 });
page.drawText('Category', { x: 410, y, size: 10 });
y -= 20;
for (const bill of bills) {
if (y < 50) {
page = pdfDoc.addPage([595, 842]);
drawFicoreHeader(page, user, height - 50);
y = height - 120;
page.drawText('Date', { x: 50, y, size: 10 });
page.drawText('Name', { x: 120, y, size: 10 });
page.drawText('Amount', { x: 200, y, size: 10 });
page.drawText('Due Date', { x: 270, y, size: 10 });
page.drawText('Status', { x: 350, y, size: 10 });
page.drawText('Category', { x: 410, y, size: 10 });
y -= 20;
}
page.drawText(formatDate(bill.created_at), { x: 50, y, size: 9 });
page.drawText(bill.name.substring(0, 15), { x: 120, y, size: 9 }); // Truncate long names
page.drawText(formatCurrency(bill.amount), { x: 200, y, size: 9 });
page.drawText(formatDate(bill.due_date), { x: 270, y, size: 9 });
page.drawText(bill.status, { x: 350, y, size: 9 });
page.drawText(bill.category, { x: 410, y, size: 9 });
y -= 15;
}
}
const pdfBytes = await pdfDoc.save();
return Buffer.from(pdfBytes);
}
export async function createShoppingPDF(shoppingLists: any[], userId: string, exportType: string): Promise<buffer> {
const pdfDoc = await PDFDocument.create();
let page = pdfDoc.addPage([595, 842]); // A4 size
const { width, height } = page.getSize();</buffer>
const user = await UserModel.findById(userId);
drawFicoreHeader(page, user, height - 50);
let y = height - 100;
page.drawText(exportType === 'single' ? 'Shopping List Details' : 'Shopping History', {
x: 50,
y,
size: 12,
color: rgb(0, 0, 0),
});
y -= 30;
if (exportType === 'single') {
const list = shoppingLists[0];
page.drawText(List ID: ${list._id}, { x: 50, y, size: 10 });
page.drawText(Name: ${list.list_name}, { x: 50, y: y - 15, size: 10 });
page.drawText(Budget: ${formatCurrency(list.budget)}, { x: 50, y: y - 30, size: 10 });
page.drawText(Total Estimated Cost: ${formatCurrency(list.total_estimated_cost)}, { x: 50, y: y - 45, size: 10 });
page.drawText(Created: ${formatDate(list.created_at)}, { x: 50, y: y - 60, size: 10 });
y -= 80;
page.drawText('Items', { x: 50, y, size: 10 });
y -= 15;
page.drawText('Name', { x: 50, y, size: 9 });
page.drawText('Cost', { x: 150, y, size: 9 });
page.drawText('Qty', { x: 220, y, size: 9 });
page.drawText('Category', { x: 270, y, size: 9 });
page.drawText('Purchased', { x: 350, y, size: 9 });
y -= 15;
for (const item of list.items) {
if (y < 50) {
page = pdfDoc.addPage([595, 842]);
drawFicoreHeader(page, user, height - 50);
y = height - 50;
page.drawText('Items (continued)', { x: 50, y, size: 10 });
y -= 15;
page.drawText('Name', { x: 50, y, size: 9 });
page.drawText('Cost', { x: 150, y, size: 9 });
page.drawText('Qty', { x: 220, y, size: 9 });
page.drawText('Category', { x: 270, y, size: 9 });
page.drawText('Purchased', { x: 350, y, size: 9 });
y -= 15;
}
page.drawText(item.name.substring(0, 20), { x: 50, y, size: 9 });
page.drawText(formatCurrency(item.estimated_cost), { x: 150, y, size: 9 });
page.drawText(${item.quantity}, { x: 220, y, size: 9 });
page.drawText(item.category, { x: 270, y, size: 9 });
page.drawText(item.is_purchased ? 'Yes' : 'No', { x: 350, y, size: 9 });
y -= 15;
}
} else {
page.drawText('Date', { x: 50, y, size: 10 });
page.drawText('List Name', { x: 120, y, size: 10 });
page.drawText('Budget', { x: 220, y, size: 10 });
page.drawText('Est. Cost', { x: 290, y, size: 10 });
page.drawText('Items', { x: 370, y, size: 10 });
y -= 20;
for (const list of shoppingLists) {
if (y < 50) {
page = pdfDoc.addPage([595, 842]);
drawFicoreHeader(page, user, height - 50);
y = height - 120;
page.drawText('Date', { x: 50, y, size: 10 });
page.drawText('List Name', { x: 120, y, size: 10 });
page.drawText('Budget', { x: 220, y, size: 10 });
page.drawText('Est. Cost', { x: 290, y, size: 10 });
page.drawText('Items', { x: 370, y, size: 10 });
y -= 20;
}
page.drawText(formatDate(list.created_at), { x: 50, y, size: 9 });
page.drawText(list.list_name.substring(0, 15), { x: 120, y, size: 9 });
page.drawText(formatCurrency(list.budget), { x: 220, y, size: 9 });
page.drawText(formatCurrency(list.total_estimated_cost), { x: 290, y, size: 9 });
page.drawText(${list.items.length}, { x: 370, y, size: 9 });
y -= 15;
}
}
const pdfBytes = await pdfDoc.save();
return Buffer.from(pdfBytes);
}
function drawFicoreHeader(page: any, user: any, yStart: number) {
page.drawText('FiCore Africa', { x: 50, y: yStart, size: 14, color: rgb(0, 0.2, 0.4) });
page.drawText(User: ${user?.display_name || 'Unknown'}, { x: 50, y: yStart - 20, size: 10 });
}