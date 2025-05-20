import { isMetal, isNonMetal, formsAmphotericOxides, metals, nonMetals } from '../../core/elements.js';
import { elementValences } from '../../core/valences.js';

export const oxideCategories = {
  BASIC: "basic",
  AMPHOTERIC: "amphoteric",
  ACIDIC: "acidic",
  INDIFFERENT: "indifferent",
  PEROXIDE: "peroxide",
  SUPEROXIDE: "superoxide"
};

// Define known oxides by category
export const knownOxides = {
  // Basic oxides - metal oxides from groups 1 and 2, and some transition metals
  "Li2O": oxideCategories.BASIC,
  "Na2O": oxideCategories.BASIC,
  "K2O": oxideCategories.BASIC,
  "Rb2O": oxideCategories.BASIC,
  "Cs2O": oxideCategories.BASIC,
  "BeO": oxideCategories.BASIC,  // Beryllium oxide can show some amphoteric properties
  "MgO": oxideCategories.BASIC,
  "CaO": oxideCategories.BASIC,
  "SrO": oxideCategories.BASIC,
  "BaO": oxideCategories.BASIC,
  "FeO": oxideCategories.BASIC,  // Iron(II) oxide
  "Fe2O3": oxideCategories.BASIC, // Iron(III) oxide (slightly amphoteric)
  "MnO": oxideCategories.BASIC,   // Manganese(II) oxide
  "CuO": oxideCategories.BASIC,   // Copper(II) oxide
  "Cu2O": oxideCategories.BASIC,  // Copper(I) oxide
  "NiO": oxideCategories.BASIC,   // Nickel(II) oxide
  "CoO": oxideCategories.BASIC,   // Cobalt(II) oxide
  "Ag2O": oxideCategories.BASIC,  // Silver oxide
  "HgO": oxideCategories.BASIC,   // Mercury(II) oxide
  "PbO": oxideCategories.BASIC,   // Lead(II) oxide (can be somewhat amphoteric)
  
  // Amphoteric oxides - elements that can act as both acids and bases
  "Al2O3": oxideCategories.AMPHOTERIC,
  "ZnO": oxideCategories.AMPHOTERIC,
  "SnO": oxideCategories.AMPHOTERIC,
  "SnO2": oxideCategories.AMPHOTERIC,
  "PbO2": oxideCategories.AMPHOTERIC,
  "Cr2O3": oxideCategories.AMPHOTERIC,
  "MnO2": oxideCategories.AMPHOTERIC,
  "BeO": oxideCategories.AMPHOTERIC,
  "Ga2O3": oxideCategories.AMPHOTERIC,
  "In2O3": oxideCategories.AMPHOTERIC,
  "TiO2": oxideCategories.AMPHOTERIC,
  "V2O5": oxideCategories.AMPHOTERIC,
  
  // Acidic oxides - non-metal oxides and some metalloid oxides
  "CO2": oxideCategories.ACIDIC,
  "SiO2": oxideCategories.ACIDIC,
  "SO2": oxideCategories.ACIDIC,
  "SO3": oxideCategories.ACIDIC,
  "P2O3": oxideCategories.ACIDIC,
  "P2O5": oxideCategories.ACIDIC,
  "N2O3": oxideCategories.ACIDIC,
  "N2O5": oxideCategories.ACIDIC,
  "Cl2O": oxideCategories.ACIDIC,
  "Cl2O3": oxideCategories.ACIDIC,
  "Cl2O7": oxideCategories.ACIDIC,
  "B2O3": oxideCategories.ACIDIC,
  "As2O3": oxideCategories.ACIDIC,
  "As2O5": oxideCategories.ACIDIC,
  "Sb2O3": oxideCategories.ACIDIC,
  "Sb2O5": oxideCategories.ACIDIC,
  "CrO3": oxideCategories.ACIDIC,
  "Mn2O7": oxideCategories.ACIDIC,
  
  // Indifferent/Neutral oxides - don't typically react as acids or bases
  "N2O": oxideCategories.INDIFFERENT,  // Nitrous oxide/laughing gas
  "NO": oxideCategories.INDIFFERENT,   // Nitric oxide
  "CO": oxideCategories.INDIFFERENT,   // Carbon monoxide
  "H2O": oxideCategories.INDIFFERENT,  // Water
  
  // Peroxides - contain the O2^2- group
  "H2O2": oxideCategories.PEROXIDE,    // Hydrogen peroxide
  "Na2O2": oxideCategories.PEROXIDE,   // Sodium peroxide
  "BaO2": oxideCategories.PEROXIDE,    // Barium peroxide
  
  // Superoxides - contain the O2^- group
  "KO2": oxideCategories.SUPEROXIDE,   // Potassium superoxide
  "RbO2": oxideCategories.SUPEROXIDE,  // Rubidium superoxide
  "CsO2": oxideCategories.SUPEROXIDE   // Cesium superoxide
};

/**
 * Determines if a formula represents an oxide compound
 * @param {string} formula - Chemical formula to check
 * @returns {boolean} - True if the formula represents an oxide
 */
export function isOxide(formula) {
  // Check if the formula contains oxygen and is not a hydroxide, acid, or other non-oxide
  if (!formula.includes('O')) return false;
  
  // Exclude hydroxides (contain OH group)
  if (formula.includes('OH')) return false;
  
  // Exclude common oxoanions and oxoacids
  const nonOxides = ['CO3', 'SO4', 'NO3', 'PO4', 'ClO', 'H2SO4', 'HNO3', 'H3PO4', 'HClO'];
  for (const nonOxide of nonOxides) {
    if (formula.includes(nonOxide)) return false;
  }
  
  // Check if it's in our known oxides list
  if (formula in knownOxides) return true;
  
  // Check for basic oxide pattern: metal + oxygen
  const metalElements = Object.keys(metals);
  for (const metal of metalElements) {
    if (formula.match(new RegExp(`^${metal}O\\d*$`)) || 
        formula.match(new RegExp(`^${metal}\\d*O\\d*$`))) {
      return true;
    }
  }
  
  // Check for acidic oxide pattern: non-metal + oxygen
  const nonMetalElements = Object.keys(nonMetals);
  for (const nonMetal of nonMetalElements) {
    if (formula.match(new RegExp(`^${nonMetal}O\\d*$`)) || 
        formula.match(new RegExp(`^${nonMetal}\\d*O\\d*$`))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extracts the main element (non-oxygen) from an oxide formula
 * @param {string} formula - The oxide formula
 * @returns {string} - The main element symbol
 */
export function extractMainElement(formula) {
  // Extract the first element symbol
  const match = formula.match(/^([A-Z][a-z]?)(\d*)/);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Determines if a formula represents a peroxide (contains O2^2- group)
 * @param {string} formula - Chemical formula to check
 * @returns {boolean} - True if the formula represents a peroxide
 */
export function isPeroxide(formula) {
  if (knownOxides[formula] === oxideCategories.PEROXIDE) return true;
  
  // Check for known patterns: metal + O2
  return formula.match(/^([A-Z][a-z]?)(\d*)O2$/);
}

/**
 * Determines if a formula represents a superoxide (contains O2^- group)
 * @param {string} formula - Chemical formula to check
 * @returns {boolean} - True if the formula represents a superoxide
 */
export function isSuperoxide(formula) {
  if (knownOxides[formula] === oxideCategories.SUPEROXIDE) return true;
  
  // Most superoxides are alkali metals (Group 1) with formula MO2
  const alkaliMetals = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'];
  for (const metal of alkaliMetals) {
    if (formula === `${metal}O2`) return true;
  }
  
  return false;
}

/**
 * Classifies an oxide based on its chemical formula
 * @param {string} formula - The oxide formula to classify
 * @returns {string} - The oxide category (basic, acidic, amphoteric, etc.)
 */
export function classifyOxide(formula) {
  // Check if it's a known oxide
  if (knownOxides[formula]) {
    return knownOxides[formula];
  }
  
  // Check for peroxides and superoxides first
  if (isPeroxide(formula)) return oxideCategories.PEROXIDE;
  if (isSuperoxide(formula)) return oxideCategories.SUPEROXIDE;
  
  // Extract the main element
  const element = extractMainElement(formula);
  if (!element) return null;
  
  // Classify based on element properties
  if (formsAmphotericOxides(element)) {
    return oxideCategories.AMPHOTERIC;
  } else if (isMetal(element)) {
    return oxideCategories.BASIC;
  } else if (isNonMetal(element)) {
    return oxideCategories.ACIDIC;
  }
  
  return null;
}

/**
 * Extracts the oxidation state of the main element in an oxide
 * @param {string} formula - The oxide formula
 * @returns {number} - The oxidation state
 */
export function getOxidationState(formula) {
  // Extract elements and their counts
  const mainElement = extractMainElement(formula);
  
  if (!mainElement) return null;
  
  // Extract counts using regex
  const elementMatch = formula.match(/([A-Z][a-z]*)(\d*)/);
  const oxygenMatch = formula.match(/O(\d*)/);
  
  if (!elementMatch || !oxygenMatch) return null;
  
  const elementCount = elementMatch[2] ? parseInt(elementMatch[2]) : 1;
  const oxygenCount = oxygenMatch[1] ? parseInt(oxygenMatch[1]) : 1;
  
  // Oxygen typically has -2 oxidation state in oxides (except peroxides and superoxides)
  if (isPeroxide(formula)) {
    // In peroxides, oxygen has -1 oxidation state
    return (oxygenCount * -1) / elementCount;
  } else if (isSuperoxide(formula)) {
    // In superoxides, oxygen has -1/2 oxidation state
    return (oxygenCount * -0.5) / elementCount;
  } else {
    // In normal oxides, oxygen has -2 oxidation state
    return (oxygenCount * -2) / elementCount;
  }
}

/**
 * Gets the corresponding acid for an acidic oxide
 * @param {string} formula - The acidic oxide formula
 * @returns {string} - The corresponding acid formula
 */
export function getCorrespondingAcid(formula) {
  if (classifyOxide(formula) !== oxideCategories.ACIDIC) return null;
  
  // Some special cases
  const acidMap = {
    "CO2": "H2CO3",    // Carbon dioxide → Carbonic acid
    "SO2": "H2SO3",    // Sulfur dioxide → Sulfurous acid
    "SO3": "H2SO4",    // Sulfur trioxide → Sulfuric acid
    "N2O3": "HNO2",    // Dinitrogen trioxide → Nitrous acid
    "N2O5": "HNO3",    // Dinitrogen pentoxide → Nitric acid
    "P2O5": "H3PO4",   // Phosphorus pentoxide → Phosphoric acid
    "P2O3": "H3PO3",   // Phosphorus trioxide → Phosphorous acid
    "Cl2O": "HClO",    // Dichlorine monoxide → Hypochlorous acid
    "Cl2O7": "HClO4",  // Dichlorine heptoxide → Perchloric acid
    "B2O3": "H3BO3",    // Diboron trioxide → Boric acid
    "SiO2": "H2SiO3"    // Silicon dioxide → Silicic acid (added for completeness)
  };
  
  return acidMap[formula] || null;
}

/**
 * Gets the corresponding hydroxide for a basic oxide
 * @param {string} formula - The basic oxide formula
 * @returns {string} - The corresponding hydroxide formula
 */
export function getCorrespondingHydroxide(formula) {
  if (classifyOxide(formula) !== oxideCategories.BASIC) return null;
  
  const element = extractMainElement(formula);
  if (!element) return null;
  
  // Get the valence of the metal
  let valence;
  if (formula.match(/^([A-Z][a-z]?)2O$/)) {
    // Formula like Li2O or Na2O (Group 1 metals)
    valence = 1;
  } else if (formula.match(/^([A-Z][a-z]?)O$/)) {
    // Formula like MgO or CaO (Group 2 metals)
    valence = 2;
  } else {
    // Try to determine from oxidation state
    valence = getOxidationState(formula);
    if (!valence) return null;
  }
  
  // Generate hydroxide formula
  if (valence === 1) {
    return `${element}OH`;
  } else {
    return `${element}(OH)${valence}`;
  }
}