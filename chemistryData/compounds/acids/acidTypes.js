import { elementValences } from '../../core/valences.js';
import { periodicTable } from '../../core/periodicTable.js';

export const acidCategories = {
  STRONG: "strong",
  MODERATE: "moderate",
  WEAK: "weak",
  MONOPROTIC: "monoprotic",
  DIPROTIC: "diprotic",
  TRIPROTIC: "triprotic",
  OXYACID: "oxyacid",
  NONOXY: "nonoxy"
};

//Mapping of common acids to their categories
export const knownAcids = {
  // Strong acids
  "HCl": [acidCategories.STRONG, acidCategories.MONOPROTIC, acidCategories.NONOXY],
  "HBr": [acidCategories.STRONG, acidCategories.MONOPROTIC, acidCategories.NONOXY],
  "HI": [acidCategories.STRONG, acidCategories.MONOPROTIC, acidCategories.NONOXY],
  "HNO3": [acidCategories.STRONG, acidCategories.MONOPROTIC, acidCategories.OXYACID],
  "H2SO4": [acidCategories.STRONG, acidCategories.DIPROTIC, acidCategories.OXYACID],
  "HClO4": [acidCategories.STRONG, acidCategories.MONOPROTIC, acidCategories.OXYACID],
  
  // Moderate strength acids
  "H3PO4": [acidCategories.MODERATE, acidCategories.TRIPROTIC, acidCategories.OXYACID],
  "H2SO3": [acidCategories.MODERATE, acidCategories.DIPROTIC, acidCategories.OXYACID],
  "HF": [acidCategories.MODERATE, acidCategories.MONOPROTIC, acidCategories.NONOXY],
  
  // Weak acids
  "HCOOH": [acidCategories.WEAK, acidCategories.MONOPROTIC, acidCategories.OXYACID], // Formic acid
  "CH3COOH": [acidCategories.WEAK, acidCategories.MONOPROTIC, acidCategories.OXYACID], // Acetic acid
  "H2CO3": [acidCategories.WEAK, acidCategories.DIPROTIC, acidCategories.OXYACID], // Carbonic acid
  "H2S": [acidCategories.WEAK, acidCategories.DIPROTIC, acidCategories.NONOXY], // Hydrogen sulfide
  "H2SiO3": [acidCategories.WEAK, acidCategories.DIPROTIC, acidCategories.OXYACID], // Silicic acid
  "HClO": [acidCategories.WEAK, acidCategories.MONOPROTIC, acidCategories.OXYACID], // Hypochlorous acid
  "HClO2": [acidCategories.WEAK, acidCategories.MONOPROTIC, acidCategories.OXYACID], // Chlorous acid
  "HClO3": [acidCategories.MODERATE, acidCategories.MONOPROTIC, acidCategories.OXYACID], // Chloric acid
  
  // Additional acids from reference image
  "HNO2": [acidCategories.WEAK, acidCategories.MONOPROTIC, acidCategories.OXYACID], // Nitrous acid
  "HPO3": [acidCategories.MODERATE, acidCategories.MONOPROTIC, acidCategories.OXYACID], // Metaphosphoric acid
  "H4P2O7": [acidCategories.MODERATE, acidCategories.TETRAPROTIC, acidCategories.OXYACID], // Pyrophosphoric acid
  "H2CrO4": [acidCategories.MODERATE, acidCategories.DIPROTIC, acidCategories.OXYACID], // Chromic acid
  "H2Cr2O7": [acidCategories.MODERATE, acidCategories.DIPROTIC, acidCategories.OXYACID], // Dichromic acid
  "H3BO3": [acidCategories.WEAK, acidCategories.TRIPROTIC, acidCategories.OXYACID], // Boric acid
  "HMnO4": [acidCategories.STRONG, acidCategories.MONOPROTIC, acidCategories.OXYACID] // Permanganic acid
};

//Mapping of acids to their corresponding acid radicals
export const acidRadicals = {
  "HF": "F", 
  "HCl": "Cl",
  "HBr": "Br",
  "HI": "I",
  "H2S": "S",
  "HNO3": "NO3",
  "HNO2": "NO2",
  "H2SO4": "SO4",
  "H2SO3": "SO3",
  "H2CO3": "CO3",
  "H2SiO3": "SiO3",
  "H3PO4": "PO4",
  "HPO3": "PO3",
  "H4P2O7": "P2O7",
  "H2CrO4": "CrO4",
  "H2Cr2O7": "Cr2O7",
  "H3BO3": "BO3",
  "HClO": "ClO",
  "HClO2": "ClO2",
  "HClO3": "ClO3",
  "HClO4": "ClO4",
  "H2MnO4": "MnO4",
  "HMnO4": "MnO4"
};

//Mapping of acid radicals to their corresponding anion names
export const anionNames = {
  "F": "fluoride",
  "Cl": "chloride",
  "Br": "bromide",
  "I": "iodide",
  "S": "sulfide",
  "NO3": "nitrate",
  "NO2": "nitrite",
  "SO4": "sulfate",
  "SO3": "sulfite",
  "CO3": "carbonate",
  "SiO3": "silicate",
  "PO4": "phosphate",
  "PO3": "metaphosphate",
  "P2O7": "pyrophosphate",
  "CrO4": "chromate",
  "Cr2O7": "dichromate",
  "BO3": "borate",
  "ClO": "hypochlorite",
  "ClO2": "chlorite",
  "ClO3": "chlorate",
  "ClO4": "perchlorate",
  "MnO4": "permanganate"
};

//Mapping of acids to their corresponding oxide sources
export const acidOxides = {
  "HNO3": "N2O5",
  "HNO2": "N2O3",
  "H2SO4": "SO3",
  "H2SO3": "SO2",
  "H2CO3": "CO2",
  "H2SiO3": "SiO2",
  "H3PO4": "P2O5",
  "HPO3": "P2O5",
  "H2CrO4": "CrO3",
  "H2Cr2O7": "Cr2O7",
  "H3BO3": "B2O3",
  "HClO": "Cl2O",
  "HClO2": "ClO2",
  "HClO3": "Cl2O5",
  "HClO4": "Cl2O7"
};

//Determines if a formula represents an acid
export function isAcid(formula) {
  // Check if it's a known acid
  if (formula in knownAcids) return true;
  
  // Check for typical acid patterns
  
  // Pattern 1: Formula starts with H and contains other elements
  if (formula.startsWith('H') && formula.match(/[A-Z]/g).length > 1) {
    // Exclude common non-acids that start with H
    const nonAcids = ['H2O', 'H2O2', 'H2', 'He', 'Hg'];
    if (!nonAcids.includes(formula)) return true;
  }
  
  // Pattern 2: Organic acids like RCOOH
  if (formula.includes('COOH')) return true;
  
  return false;
}

//Extract the acid radical from an acid formula
export function extractAcidRadical(formula) {
  // Check if it's in our known list
  if (acidRadicals[formula]) return acidRadicals[formula];
  
  // Remove H atoms from the front
  if (formula.startsWith('H')) {
    const match = formula.match(/^H(\d?)(.+)$/);
    if (match) {
      // If there's a number after H, it's Hx where x > 1
      if (match[1]) {
        return match[2]; // Return the rest as the radical
      } else {
        // If there's no number, it's just H followed by the radical
        return match[2];
      }
    }
  }
  
  return null;
}

//Determines the basicity (number of replaceable H atoms) of an acid

export function determineBasicity(formula) {
  // Check if it's a known acid
  if (knownAcids[formula]) {
    const categories = knownAcids[formula];
    if (categories.includes(acidCategories.MONOPROTIC)) return 1;
    if (categories.includes(acidCategories.DIPROTIC)) return 2;
    if (categories.includes(acidCategories.TRIPROTIC)) return 3;
    if (categories.includes("tetraprotic")) return 4; // Special case for H4P2O7
  }
  
  // Count the hydrogen atoms at the beginning of the formula
  const match = formula.match(/^H(\d?)/);
  if (match) {
    // If there's a number after H, use that as the basicity
    if (match[1]) {
      return parseInt(match[1]);
    } else {
      // If there's no number, it's just one H atom
      return 1;
    }
  }
  
  return 0; // Not determined
}

//Determines if an acid is an oxyacid (contains oxygen) or non-oxyacid
export function determineAcidType(formula) {
  // Check if it's a known acid
  if (knownAcids[formula]) {
    const categories = knownAcids[formula];
    if (categories.includes(acidCategories.OXYACID)) return acidCategories.OXYACID;
    if (categories.includes(acidCategories.NONOXY)) return acidCategories.NONOXY;
  }
  
  // Check if the formula contains oxygen
  if (formula.includes('O')) {
    return acidCategories.OXYACID;
  } else {
    return acidCategories.NONOXY;
  }
}

//Classifies an acid by its strength
export function classifyAcidByStrength(formula) {
  // Check if it's a known acid
  if (knownAcids[formula]) {
    const categories = knownAcids[formula];
    if (categories.includes(acidCategories.STRONG)) return acidCategories.STRONG;
    if (categories.includes(acidCategories.MODERATE)) return acidCategories.MODERATE;
    if (categories.includes(acidCategories.WEAK)) return acidCategories.WEAK;
  }
  
  // Strong acids list
  const strongAcids = ['HCl', 'HBr', 'HI', 'HNO3', 'H2SO4', 'HClO4', 'HClO3'];
  if (strongAcids.includes(formula)) return acidCategories.STRONG;
  
  // Moderate acids list
  const moderateAcids = ['H3PO4', 'H2SO3', 'HF', 'HNO2'];
  if (moderateAcids.includes(formula)) return acidCategories.MODERATE;
  
  // Default to weak if not recognized
  return acidCategories.WEAK;
}

//Gets the corresponding oxide for an oxyacid
export function getCorrespondingOxide(formula) {
  // Check in our mapping
  if (acidOxides[formula]) return acidOxides[formula];
  
  // If not found, it might not be an oxyacid or not in our database
  return null;
}

//Gets the name of the anion formed from an acid
export function getAnionName(formula) {
  const radical = extractAcidRadical(formula);
  if (radical && anionNames[radical]) {
    return anionNames[radical];
  }
  return null;
}

//Comprehensive classification of an acid
export function classifyAcid(formula) {
  // Check if it's an acid first
  if (!isAcid(formula)) return null;
  
  const strength = classifyAcidByStrength(formula);
  const basicity = determineBasicity(formula);
  const acidType = determineAcidType(formula);
  const radical = extractAcidRadical(formula);
  const anionName = getAnionName(formula);
  const correspondingOxide = acidType === acidCategories.OXYACID ? getCorrespondingOxide(formula) : null;
  
  return {
    formula,
    strength,
    basicity,
    acidType,
    radical,
    anionName,
    correspondingOxide,
    // Determine basicity name
    basicityName: basicity === 1 ? acidCategories.MONOPROTIC :
                  basicity === 2 ? acidCategories.DIPROTIC :
                  basicity === 3 ? acidCategories.TRIPROTIC : 
                  basicity === 4 ? "tetraprotic" : "unknown"
  };
}