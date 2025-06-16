import { elementValences } from './valences.js';

export function extractIons(formula) {
  const knownCations = [
    "NH4", "Li", "Na", "K", "Rb", "Cs",
    "Be", "Mg", "Ca", "Sr", "Ba",
    "Al", "Fe", "Fe2", "Fe3", "Zn", "Cu", "Ag", "Pb", "Sn", "Hg", "Cr", "Ni", "Co", "Mn"
  ];

  const knownAnions = [
    "CH3COO", "HCOO", "ClO4", "ClO3", "ClO2", "ClO", "Cr2O7", "CrO4", "MnO4",
    "SO4", "SO3", "CO3", "HCO3", "PO4", "HPO4", "SiO3", "NO3", "NO2", 
    "OH", "Cl", "Br", "I", "F", "S"
  ];

  let cation = null;
  let anion = null;

  // Try to find the longest matching cation in the formula
  for (const cat of knownCations.sort((a, b) => b.length - a.length)) {
    if (formula.includes(cat)) {
      cation = cat;
      break;
    }
  }

  // Try to find the longest matching anion in the formula (excluding the cation match)
  const tail = formula.replace(cation, '');
  for (const an of knownAnions.sort((a, b) => b.length - a.length)) {
    if (tail.includes(an)) {
      anion = an;
      break;
    }
  }

  return { cation, anion };
}

/**
 * Enhanced extraction that calculates the cation's oxidation state from the compound formula
 */
export function extractIonsWithOxidationState(formula) {
  const basicExtraction = extractIons(formula);
  if (!basicExtraction.cation || !basicExtraction.anion) {
    return basicExtraction;
  }

  // Calculate oxidation state of the cation from the formula
  const cationOxidationState = calculateCationOxidationState(formula, basicExtraction.cation, basicExtraction.anion);
  
  return {
    ...basicExtraction,
    cationOxidationState
  };
}

/**
 * Calculates the oxidation state of a cation in a compound
 */
function calculateCationOxidationState(formula, cation, anion) {
  // Get anion charge
  const anionCharge = getAnionCharge(anion);
  if (anionCharge === null) return null;

  // Parse formula to get counts
  const { cationCount, anionCount } = parseCompoundCounts(formula, cation, anion);
  
  if (!cationCount || !anionCount) return null;

  // Calculate: cationCount * cationCharge + anionCount * anionCharge = 0
  // cationCharge = -(anionCount * anionCharge) / cationCount
  const cationCharge = -(anionCount * anionCharge) / cationCount;
  
  return Math.abs(cationCharge); // Return positive oxidation state
}

/**
 * Gets the charge of a known anion
 */
function getAnionCharge(anion) {
  const anionCharges = {
    "OH": -1, "NO3": -1, "NO2": -1, "Cl": -1, "Br": -1, "I": -1, "F": -1,
    "ClO": -1, "ClO2": -1, "ClO3": -1, "ClO4": -1, "MnO4": -1, "CH3COO": -1, "HCOO": -1,
    "SO4": -2, "SO3": -2, "CO3": -2, "CrO4": -2, "Cr2O7": -2, "SiO3": -2, "S": -2,
    "PO4": -3, "HPO4": -2, "HCO3": -1
  };
  
  return anionCharges[anion] || null;
}

/**
 * Parses compound formula to get ion counts
 */
function parseCompoundCounts(formula, cation, anion) {
  // Simple parsing for common cases
  // For formulas like CaCO3, Ca(NO3)2, Na2SO3, etc.
  
  let cationCount = 1;
  let anionCount = 1;
  
  // Handle parentheses cases like Ca(NO3)2
  const parenMatch = formula.match(new RegExp(`\\(${anion}\\)(\\d+)`));
  if (parenMatch) {
    anionCount = parseInt(parenMatch[1]);
    return { cationCount, anionCount };
  }
  
  // Handle cation subscripts like Na2SO3, CaCl2
  const cationMatch = formula.match(new RegExp(`${cation}(\\d+)`));
  if (cationMatch && cationMatch[1]) {
    cationCount = parseInt(cationMatch[1]);
  }
  
  // Handle anion subscripts (rare, but just in case)
  const anionMatch = formula.match(new RegExp(`${anion}(\\d+)$`));
  if (anionMatch && anionMatch[1]) {
    anionCount = parseInt(anionMatch[1]);
  }
  
  console.log(`Parsed ${formula}: ${cation}(${cationCount}) + ${anion}(${anionCount})`);
  
  return { cationCount, anionCount };
}
