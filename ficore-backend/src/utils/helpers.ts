import { ValidationError } from '../types/errors';

export function cleanCurrency(value: string | number | null): number | null {
  if (!value) return null;
  try {
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) throw new Error('Invalid currency format');
    const numericValue = parseFloat(cleaned);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 10000000000) {
      throw new ValidationError('Invalid currency value');
    }
    return parseFloat(numericValue.toFixed(2));
  } catch (error) {
    throw new ValidationError('Invalid currency format');
  }
}

export function formatCurrency(value: number | string): string {
  try {
    const numericValue = typeof value === 'string' ? cleanCurrency(value) : value;
    if (numericValue === null) return '0.00';
    return numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return '0.00';
  }
}