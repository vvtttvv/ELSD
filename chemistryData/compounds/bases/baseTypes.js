import { isMetal, formsAmphotericOxides } from '../../core/elements.js';
import { elementValences } from '../../core/valences.js';

export const baseCategories = {
  STRONG: "strong",
  WEAK: "weak",
  AMPHOTERIC: "amphoteric",
  SOLUBLE: "soluble",
  INSOLUBLE: "insoluble"
};

// Define known bases by category
export const knownBases = {
  // Strong, soluble bases (alkali metal hydroxides)
  "LiOH": [baseCategories.STRONG, baseCategories.SOLUBLE],
  "NaOH": [baseCategories.STRONG, baseCategories.SOLUBLE],
  "KOH": [baseCategories.STRONG, baseCategories.SOLUBLE],
  "RbOH": [baseCategories.STRONG, baseCategories.SOLUBLE],
  "CsOH": [baseCategories.STRONG, baseCategories.SOLUBLE],
  
  // Strong, soluble bases (alkaline earth metal hydroxides)
  "Ba(OH)2": [baseCategories.STRONG, baseCategories.SOLUBLE],
  "Ca(OH)2": [baseCategories.STRONG, baseCategories.SOLUBLE],
  
  // Weak, insoluble bases
  "Mg(OH)2": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  "Fe(OH)2": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  "Fe(OH)3": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  "Cu(OH)2": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  "Ni(OH)2": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  "Co(OH)2": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  "Pb(OH)2": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  "Mn(OH)2": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  "Cr(OH)3": [baseCategories.WEAK, baseCategories.INSOLUBLE],
  
  // Amphoteric hydroxides
  "Al(OH)3": [baseCategories.AMPHOTERIC, baseCategories.INSOLUBLE],
  "Zn(OH)2": [baseCategories.AMPHOTERIC, baseCategories.INSOLUBLE],
  "Be(OH)2": [baseCategories.AMPHOTERIC, baseCategories.INSOLUBLE],
  "Pb(OH)2": [baseCategories.AMPHOTERIC, baseCategories.INSOLUBLE],
  "Sn(OH)2": [baseCategories.AMPHOTERIC, baseCategories.INSOLUBLE],
  "Cr(OH)3": [baseCategories.AMPHOTERIC, baseCategories.INSOLUBLE],
  
  // Organic bases
  "NH4OH": [baseCategories.WEAK, baseCategories.SOLUBLE]
};

/**
 * Determines if a formula represents a base (hydroxide compound)
 * @param {string} formula - Chemical formula to check
 * @returns {boolean} - True if the formula represents a base
 */
export function isBase(formula) {
  // Check if formula contains OH group and is not an oxoacid or other non-base
  if (!formula.includes('OH')) return false;
  
  // Exclude oxoacids like H2SO4, HNO3, etc.
  if (formula.startsWith('H') && formula.match(/[A-Z]/) && !formula.startsWith('H2O')) {
    return false;
  }
  
  // Check if it's in our known bases list
  if (formula in knownBases) return true;
  
  // Check for base pattern: metal + hydroxide group
  // Standard hydroxide pattern: metal followed by OH or (OH)n
  const basePatterns = [
    /^([A-Z][a-z]?)OH$/,                // Simple hydroxide like NaOH
    /^([A-Z][a-z]?)\(OH\)(\d+)$/,       // Hydroxide with multiple OH groups like Ca(OH)2
    /^([A-Z][a-z]?)(\d+)\(OH\)(\d+)$/,  // Complex hydroxide like Fe2(OH)3
  ];
  
  for (const pattern of basePatterns) {
    if (pattern.test(formula)) {
      const match = formula.match(pattern);
      if (match) {
        const element = match[1];
        return isMetal(element); // It's a base if the element is a metal
      }
    }
  }
  
  return false;
}

/**
 * Extracts the metal element from a base formula
 * @param {string} formula - The base formula
 * @returns {string} - The metal element symbol
 */
export function extractMetal(formula) {
  const match = formula.match(/^([A-Z][a-z]?)(?:\d+)?\(?/);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Determines the number of hydroxide groups in a base
 * @param {string} formula - The base formula
 * @returns {number} - The number of OH groups
 */
export function getHydroxideCount(formula) {
  // Simple hydroxides like NaOH
  if (formula.match(/^[A-Z][a-z]?OH$/)) {
    return 1;
  }
  
  // Hydroxides with multiple OH groups like Ca(OH)2
  const multipleOH = formula.match(/\(OH\)(\d+)/);
  if (multipleOH) {
    return parseInt(multipleOH[1]);
  }
  
  return 0;
}

/**
 * Classifies a base by its strength
 * @param {string} formula - The base formula to classify
 * @returns {string} - The base strength category (strong or weak)
 */
export function classifyBaseByStrength(formula) {
  // Check if it's a known base
  if (knownBases[formula]) {
    return knownBases[formula][0];
  }
  
  const metal = extractMetal(formula);
  if (!metal) return null;
  
  // Group 1 (alkali metals) and heavy alkaline earth metals form strong bases
  const strongBaseMetals = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr', 'Ba', 'Sr'];
  if (strongBaseMetals.includes(metal)) {
    return baseCategories.STRONG;
  }
  
  // Amphoteric hydroxides
  if (formsAmphotericOxides(metal)) {
    return baseCategories.AMPHOTERIC;
  }
  
  // Default to weak base for other metal hydroxides
  return baseCategories.WEAK;
}

/**
 * Classifies a base by its solubility
 * @param {string} formula - The base formula to classify
 * @returns {string} - The base solubility category (soluble or insoluble)
 */
export function classifyBaseBySolubility(formula) {
  // Check if it's a known base
  if (knownBases[formula]) {
    return knownBases[formula][1];
  }
  
  const metal = extractMetal(formula);
  if (!metal) return null;
  
  // Group 1 (alkali metals) hydroxides are soluble
  const solubleBaseMetals = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'];
  if (solubleBaseMetals.includes(metal)) {
    return baseCategories.SOLUBLE;
  }
  
  // Group 2 (alkaline earth metals) hydroxides have varied solubility
  const partiallySolubleMetals = ['Ba', 'Sr', 'Ca'];
  if (partiallySolubleMetals.includes(metal)) {
    return baseCategories.SOLUBLE; // Simplified - actually they're partially soluble
  }
  
  // Default to insoluble for other metal hydroxides
  return baseCategories.INSOLUBLE;
}

/**
 * Determines if a base is amphoteric
 * @param {string} formula - The base formula to check
 * @returns {boolean} - True if the base is amphoteric
 */
export function isAmphotericBase(formula) {
  // Check if it's a known amphoteric base
  if (knownBases[formula] && knownBases[formula][0] === baseCategories.AMPHOTERIC) {
    return true;
  }
  
  const metal = extractMetal(formula);
  if (!metal) return false;
  
  // Check if the metal forms amphoteric compounds
  return formsAmphotericOxides(metal);
}

/**
 * Gets the corresponding oxide for a metal hydroxide
 * @param {string} formula - The base formula
 * @returns {string} - The corresponding oxide formula
 */
export function getCorrespondingOxide(formula) {
  const metal = extractMetal(formula);
  if (!metal) return null;
  
  // Get valence of the metal from hydroxide count
  const hydroxideCount = getHydroxideCount(formula);
  if (hydroxideCount === 0) return null;
  
  // Get metal valence from hydroxide count
  const metalValence = hydroxideCount;
  
  // Generate oxide formula based on valence
  if (metalValence === 1) {
    return `${metal}2O`;
  } else if (metalValence === 2) {
    return `${metal}O`;
  } else if (metalValence === 3) {
    return `${metal}2O3`;
  } else {
    return `${metal}O${metalValence/2}`;
  }
}

/**
 * Comprehensive classification of a base
 * @param {string} formula - The base formula to classify
 * @returns {Object} - Complete classification including strength, solubility, and properties
 */
export function classifyBase(formula) {
  // Check if it's a base first
  if (!isBase(formula)) return null;
  
  const metal = extractMetal(formula);
  const strength = classifyBaseByStrength(formula);
  const solubility = classifyBaseBySolubility(formula);
  const amphoteric = isAmphotericBase(formula);
  
  return {
    formula,
    metal,
    hydroxideCount: getHydroxideCount(formula),
    strength,
    solubility,
    amphoteric,
    correspondingOxide: getCorrespondingOxide(formula)
  };
}