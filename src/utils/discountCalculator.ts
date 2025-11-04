/**
 * Utility functions for calculating custom discounts
 */

export type DiscountType = 'percentage' | 'fixed' | null;

/**
 * Calculate the discount amount based on type and value
 * @param subtotal - The price before discount is applied
 * @param type - The type of discount ('percentage' or 'fixed')
 * @param value - The discount value (percentage or dollar amount)
 * @returns The calculated discount amount in dollars
 */
export function calculateCustomDiscount(
  subtotal: number,
  type: DiscountType,
  value: number
): number {
  // No discount if type is null or value is 0 or negative
  if (!type || value <= 0) {
    return 0;
  }

  if (type === 'percentage') {
    // Calculate percentage discount
    const discount = subtotal * (value / 100);
    // Don't exceed the subtotal
    return Math.min(discount, subtotal);
  } else if (type === 'fixed') {
    // Fixed dollar amount - don't exceed subtotal
    return Math.min(value, subtotal);
  }

  return 0;
}

/**
 * Validate discount value based on type
 * @param type - The discount type
 * @param value - The discount value to validate
 * @returns Validation result with error message if invalid
 */
export function validateDiscountValue(
  type: DiscountType,
  value: number
): { valid: boolean; error?: string } {
  if (!type) {
    return { valid: true };
  }

  if (value < 0) {
    return { valid: false, error: 'Discount value cannot be negative' };
  }

  if (type === 'percentage') {
    if (value > 100) {
      return { valid: false, error: 'Percentage discount cannot exceed 100%' };
    }
  }

  // Check decimal places (max 2)
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { valid: false, error: 'Maximum 2 decimal places allowed' };
  }

  return { valid: true };
}

/**
 * Format discount display text
 * @param type - The discount type
 * @param value - The discount value
 * @param label - Optional custom label
 * @returns Formatted display text
 */
export function formatDiscountLabel(
  type: DiscountType,
  value: number,
  label?: string
): string {
  if (!type || value <= 0) {
    return '';
  }

  const displayLabel = label || 'Custom Discount';

  if (type === 'percentage') {
    return `${displayLabel}: -${value}%`;
  } else {
    return `${displayLabel}: -$${value.toFixed(2)}`;
  }
}
