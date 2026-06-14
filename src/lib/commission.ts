/**
 * Commission is a straightforward percentage of the sale price.
 * Centralised here so the seed script, resolvers, and UI agree on the math.
 */
export function calculateCommission(salePrice: number, rate: number): number {
  return Math.round(salePrice * rate * 100) / 100;
}
