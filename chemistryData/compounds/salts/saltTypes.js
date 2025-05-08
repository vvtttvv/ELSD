import { elementValences } from '../../core/valences.js';
import { isMetal, isNonMetal } from '../../core/elements.js';
import { extractIons } from '../../core/extractIons.js';
import { solubilityTable } from '../../core/solubilityTable.js';
import { acidRadicals, anionNames } from '../acids/acidTypes.js';

export const saltCategories = {
  NORMAL: "normal",
  ACIDIC: "acidic",
  BASIC: "basic",
  DOUBLE: "double",
  MIXED: "mixed",
  SOLUBLE: "soluble",
  INSOLUBLE: "insoluble"
};

/**
 * Mapping of known salts to their categories
 */
export const knownSalts = {
  // Normal salts (from neutralization of acids and bases)
  "NaCl": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "KCl": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "CaSO4": [saltCategories.NORMAL, saltCategories.INSOLUBLE],
  "MgCl2": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "Na2SO4": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "CaCO3": [saltCategories.NORMAL, saltCategories.INSOLUBLE],
  "AgNO3": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "ZnCl2": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "FeCl3": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "Cu(NO3)2": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "Ca(NO3)2": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "K2SO4": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "KNO3": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "K2CO3": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "K3PO4": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "K2CrO4": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "K2Cr2O7": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "KMnO4": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "KClO": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "KClO3": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "CaCl2": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "Ca3(PO4)2": [saltCategories.NORMAL, saltCategories.INSOLUBLE],
  "CaCr2O7": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "Ca(ClO)2": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "Ca(ClO3)2": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  "Ca(MnO4)2": [saltCategories.NORMAL, saltCategories.SOLUBLE],
  
  // Acidic salts (from partial neutralization of polyprotic acids)
  "NaHSO4": [saltCategories.ACIDIC, saltCategories.SOLUBLE],
  "KHCO3": [saltCategories.ACIDIC, saltCategories.SOLUBLE],
  "NaHCO3": [saltCategories.ACIDIC, saltCategories.SOLUBLE],
  "Ca(HCO3)2": [saltCategories.ACIDIC, saltCategories.SOLUBLE],
  
  // Basic salts (from partial neutralization of polyacidic bases or hydrolysis)
  "Ca(OH)Cl": [saltCategories.BASIC, saltCategories.SOLUBLE],
  
  // Double salts (containing two different cations or anions)
  "KAl(SO4)2": [saltCategories.DOUBLE, saltCategories.SOLUBLE], // Potassium alum
  
  // Mixed salts (containing different anions)
  "CaOCl2": [saltCategories.MIXED, saltCategories.SOLUBLE] // Bleaching powder
};

/**
 * Determines if a formula represents a salt
 * @param {string} formula - Chemical formula to check
 * @returns {boolean} - True if the formula represents a salt
 */
export function isSalt(formula) {
  // Check if it's a known salt
  if (formula in knownSalts) return true;
  
  // Exclude common non-salts
  const nonSalts = [
    'H2O', 'H2O2', 'H2', 'O2', 'N2', 'Cl2', 'Br2', 'I2', // Elements and simple compounds
    'H2SO4', 'HCl', 'HNO3', 'H3PO4', 'HBr', 'HI', 'H2CO3', // Acids
    'NaOH', 'KOH', 'Ca(OH)2', 'Mg(OH)2', 'Al(OH)3', // Bases
    'CO2', 'SO2', 'NO2', 'P2O5', 'SO3', 'N2O5', 'CaO', 'MgO', 'Al2O3' // Oxides
  ];
  
  if (nonSalts.includes(formula)) return false;
  
  // Check for salt patterns
  
  // Pattern 1: Metal + non-metal/polyatomic ion
  const { cation, anion } = extractIons(formula);
  if (cation && anion) {
    if (isMetal(cation) || cation === 'NH4') {
      const acidAnions = Object.values(acidRadicals);
      if (acidAnions.includes(anion)) {
        return true;
      }
    }
  }

  
  // Pattern 2: Contains both metal and non-metal/polyatomic ion but not H, OH
  if (formula.match(/[A-Z]/) && 
      !formula.startsWith('H') && 
      !formula.includes('OH') &&
      formula.length > 1) {
    // Exclude simple binary compounds like NaCl
    if (formula.match(/[A-Z][a-z]?[0-9]?[A-Z]/)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extracts the cation and anion from a salt formula
 * @param {string} formula - The salt formula
 * @returns {Object} - Object containing cation and anion
 */
export function extractSaltComponents(formula) {
  return extractIons(formula);
}

/**
 * Determines if a salt is soluble in water
 * @param {string} formula - The salt formula
 * @returns {boolean} - Whether the salt is soluble
 */
export function isSoluble(formula) {
  // Check if it's a known salt
  if (knownSalts[formula]) {
    return knownSalts[formula].includes(saltCategories.SOLUBLE);
  }
  
  const { cation, anion } = extractIons(formula);
  if (!cation || !anion) return null;
  
  // General solubility rules
  
  // Rule 1: All sodium, potassium, and ammonium salts are soluble
  if (['Na', 'K', 'NH4'].includes(cation)) {
    return true;
  }
  
  // Rule 2: All nitrates are soluble
  if (anion === 'NO3') {
    return true;
  }
  
  // Rule 3: Most chlorides are soluble (except Ag, Hg, Pb)
  if (anion === 'Cl' && !['Ag', 'Hg', 'Pb'].includes(cation)) {
    return true;
  }
  
  // Rule 4: Most sulfates are soluble (except Ca, Ba, Sr, Pb)
  if (anion === 'SO4' && !['Ca', 'Ba', 'Sr', 'Pb'].includes(cation)) {
    return true;
  }
  
  // Rule 5: Most carbonates, phosphates, and sulfides are insoluble
  if (['CO3', 'PO4', 'S'].includes(anion)) {
    return false;
  }
  
  // Check solubility table if available
  const solubilityKey = `${anion}_${cation}`;
  if (solubilityTable && solubilityTable[solubilityKey]) {
    return solubilityTable[solubilityKey] === 'P'; // P for soluble in the table
  }
  
  // Default assumption
  return false;
}

/**
 * Determines if a salt is acidic, basic, or neutral
 * @param {string} formula - The salt formula
 * @returns {string} - Salt pH category (acidic, basic, or neutral)
 */
export function determineSaltpH(formula) {
  // Check if it's a known salt
  if (knownSalts[formula]) {
    const categories = knownSalts[formula];
    if (categories.includes(saltCategories.ACIDIC)) return "acidic";
    if (categories.includes(saltCategories.BASIC)) return "basic";
    return "neutral"; // Default for normal salts
  }
  
  const { cation, anion } = extractIons(formula);
  if (!cation || !anion) return null;
  
  // Acidic salts: contain hydrogen that can be replaced
  if (formula.includes('H') && !formula.startsWith('H') && !formula.includes('OH')) {
    // Hydrogen in the middle of the formula, like NaHSO4
    return "acidic";
  }
  
  // Basic salts: contain hydroxide groups
  if (formula.includes('OH') && isMetal(formula.charAt(0))) {
    return "basic";
  }
  
  // Salts formed from strong acids and strong bases are neutral
  const strongAcidAnions = ['Cl', 'Br', 'I', 'NO3', 'ClO4', 'ClO3'];
  const strongBaseCations = ['Na', 'K', 'Li', 'Rb', 'Cs', 'Ca', 'Ba', 'Sr'];
  
  if (strongAcidAnions.includes(anion) && strongBaseCations.includes(cation)) {
    return "neutral";
  }
  
  // Salts formed from weak acids and strong bases are basic
  const weakAcidAnions = ['CO3', 'HCO3', 'PO4', 'SO3', 'ClO', 'ClO2', 'F', 'CH3COO'];
  if (weakAcidAnions.includes(anion) && strongBaseCations.includes(cation)) {
    return "basic";
  }
  
  // Salts formed from strong acids and weak bases are acidic
  const weakBaseCations = ['NH4', 'Fe', 'Al', 'Cu', 'Zn', 'Pb'];
  if (strongAcidAnions.includes(anion) && weakBaseCations.includes(cation)) {
    return "acidic";
  }
  
  // Default: assume neutral
  return "neutral";
}

/**
 * Classifies a salt as normal, acidic, basic, double, or mixed
 * @param {string} formula - The salt formula
 * @returns {string} - Salt category
 */
export function classifySaltByType(formula) {
  // Check if it's a known salt
  if (knownSalts[formula]) {
    return knownSalts[formula][0];
  }
  
  // Acidic salts: contain replaceable hydrogen
  if (formula.includes('H') && !formula.startsWith('H') && !formula.includes('OH')) {
    return saltCategories.ACIDIC;
  }
  
  // Basic salts: contain hydroxide groups
  if (formula.includes('OH') && isMetal(formula.charAt(0))) {
    return saltCategories.BASIC;
  }
  
  // Double salts: have two different cations
  // This is a simplification - would need more sophisticated parsing
  const doubleSaltPattern = /\([A-Z][a-z]?[A-Z][a-z]?\)/;
  if (doubleSaltPattern.test(formula)) {
    return saltCategories.DOUBLE;
  }
  
  // Mixed salts: have two different anions
  // This is also a simplification
  const mixedSaltPattern = /[A-Z][a-z]?[A-Z][a-z]?[A-Z]/;
  if (mixedSaltPattern.test(formula) && !formula.includes('(')) {
    return saltCategories.MIXED;
  }
  
  // Default: normal salt
  return saltCategories.NORMAL;
}

/**
 * Comprehensive classification of a salt
 * @param {string} formula - The salt formula
 * @returns {Object|null} - Complete classification or null if not a salt
 */
export function classifySalt(formula) {
  // Check if it's a salt first
  if (!isSalt(formula)) return null;
  
  const { cation, anion } = extractIons(formula);
  const saltType = classifySaltByType(formula);
  const solubility = isSoluble(formula) ? saltCategories.SOLUBLE : saltCategories.INSOLUBLE;
  const pH = determineSaltpH(formula);
  
  let anionName = "";
  // Try to find anion name
  for (const acid in acidRadicals) {
    if (acidRadicals[acid] === anion) {
      anionName = anionNames[anion] || "";
      break;
    }
  }
  
  return {
    formula,
    type: saltType,
    cation,
    anion,
    anionName,
    solubility,
    pH,
    components: extractSaltComponents(formula)
  };
}