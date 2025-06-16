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

/**
 * Calculates the oxidation state of a metal in an oxide compound.
 * Examples:
 *   "Fe2O3" → 3 (because 2 Fe atoms with +3 charge each balance 3 O atoms with -2 charge each)
 *   "FeO"   → 2 (because 1 Fe atom with +2 charge balances 1 O atom with -2 charge)
 *   "Al2O3" → 3 (because 2 Al atoms with +3 charge each balance 3 O atoms with -2 charge each)
 */
export function calculateMetalOxidationState(oxideFormula) {
  // Extract the metal part and oxygen part
  const metalMatch = oxideFormula.match(/^([A-Z][a-z]?)(\d*)/);
  const oxygenMatch = oxideFormula.match(/O(\d*)$/);
  
  if (!metalMatch || !oxygenMatch) {
    return null;
  }
  
  const metal = metalMatch[1];
  const metalCount = metalMatch[2] ? parseInt(metalMatch[2]) : 1;
  const oxygenCount = oxygenMatch[1] ? parseInt(oxygenMatch[1]) : 1;
  
  // Oxygen has oxidation state -2
  const totalNegativeCharge = oxygenCount * 2;
  
  // For the compound to be neutral, total positive charge must equal total negative charge
  const totalPositiveCharge = totalNegativeCharge;
  
  // Calculate oxidation state per metal atom
  const metalOxidationState = totalPositiveCharge / metalCount;
  
  return metalOxidationState;
}