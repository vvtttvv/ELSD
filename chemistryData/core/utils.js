/**
 * Extracts the metal symbol from a given oxide formula.
 * Examples:
 *   "Al2O3" → "Al"
 *   "Fe2O3" → "Fe"
 *   "ZnO"   → "Zn"
 */
export function extractMetalFromOxide(oxideFormula) {
  const match = oxideFormula.match(/^[A-Z][a-z]?/);
  return match ? match[0] : null;
}