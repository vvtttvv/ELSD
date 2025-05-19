import { saltCategories, classifySaltByType, isSoluble, determineSaltpH, extractSaltComponents } from './saltTypes.js';
import { oxideCategories, classifyOxide } from '../oxides/oxideTypes.js';
import { baseCategories, classifyBaseByStrength } from '../bases/baseTypes.js';
import { acidCategories, classifyAcidByStrength } from '../acids/acidTypes.js';
import { isMetal, isNonMetal } from '../../core/elements.js';
import { extractIons } from '../../core/extractIons.js';
import { solubilityTable } from '../../core/solubilityTable.js';

/**
 * Reaction patterns for salts with different reactants
 * Each rule defines whether a reaction is possible and what products would form
 */
export const saltReactions = {
  [saltCategories.NORMAL]: {
    // Salt + Metal -> New salt + New metal (single replacement)
    "metal": {
      possible: (salt, metal) => {
        const { cation } = extractSaltComponents(salt);
        if (!cation || !metal) return false;
        
        // Only possible if the metal is more reactive than the salt's cation
        // Activity series (simplified): K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Ag > Au
        const activitySeries = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "H", "Cu", "Ag", "Au"];
        
        const metalIndex = activitySeries.indexOf(metal);
        const cationIndex = activitySeries.indexOf(cation);
        
        // Metal must be higher in the activity series (more reactive)
        return metalIndex >= 0 && cationIndex >= 0 && metalIndex < cationIndex;
      },
      products: (salt, metal) => {
        const { cation, anion } = extractSaltComponents(salt);
        if (!cation || !anion || !metal) return null;
        
        // Form new salt with the replacing metal and the original anion
        const newSalt = `${metal}${anion}`;
        
        return [newSalt, cation];
      },
      reactionType: "single_replacement",
      conditions: ["aqueous", "room temperature"]
    },
    
    // Salt + Strong Acid -> New salt + New acid (if the new acid is more volatile)
    "acid": {
      possible: (salt, acid) => {
        const { anion } = extractSaltComponents(salt);
        const acidStrength = classifyAcidByStrength(acid);
        
        // Only strong acids can displace
        if (acidStrength !== acidCategories.STRONG) return false;
        
        // Check if the salt's anion forms a more volatile acid
        const volatileAnions = ["CO3", "HCO3", "SO3", "S", "NO2"];
        return volatileAnions.includes(anion);
      },
      products: (salt, acid) => {
        const { cation, anion } = extractSaltComponents(salt);
        const { anion: acidAnion } = extractIons(acid);
        
        if (!cation || !anion || !acidAnion) return null;
        
        // Form new salt and acid
        const newSalt = `${cation}${acidAnion}`;
        
        // Different products depending on the anion
        if (anion === "CO3") {
          return [newSalt, "H2O", "CO2"];
        } else if (anion === "HCO3") {
          return [newSalt, "H2O", "CO2"];
        } else if (anion === "SO3") {
          return [newSalt, "H2O", "SO2"];
        } else if (anion === "S") {
          return [newSalt, "H2S"];
        } else if (anion === "NO2") {
          return [newSalt, "HNO2"];
        }
        
        return null;
      },
      reactionType: "double_replacement",
      conditions: ["aqueous", "room temperature"]
    },
    
    // Salt + Base -> New salt + New base (precipitation reaction)
    "base": {
      possible: (salt, base) => {
        const { cation } = extractSaltComponents(salt);
        const { cation: baseCation } = extractIons(base);
        
        if (!cation || !baseCation) return false;
        
        // Check if reaction would form an insoluble hydroxide
        const insolubleHydroxides = ["Fe", "Cu", "Zn", "Pb", "Mg", "Ca", "Al"];
        return insolubleHydroxides.includes(cation);
      },
      products: (salt, base) => {
        const { cation, anion } = extractSaltComponents(salt);
        const { cation: baseCation } = extractIons(base);
        
        if (!cation || !anion || !baseCation) return null;
        
        // Form new salt and hydroxide
        let newSalt, hydroxide;
        
        if (cation === "Fe") {
          if (salt.includes("Fe3+") || salt.includes("Fe(III)")) {
            hydroxide = "Fe(OH)3";
          } else {
            hydroxide = "Fe(OH)2";
          }
        } else if (["Mg", "Ca", "Zn", "Cu", "Pb"].includes(cation)) {
          hydroxide = `${cation}(OH)2`;
        } else if (cation === "Al") {
          hydroxide = "Al(OH)3";
        } else {
          hydroxide = `${cation}OH`;
        }
        
        // For the new salt, need to handle the base's anion (OH or O)
        if (baseCation === "Na" || baseCation === "K") {
          newSalt = `${baseCation}${anion}`;
        } else if (["Ca", "Mg", "Ba"].includes(baseCation)) {
          newSalt = `${baseCation}(${anion})2`;
        } else {
          newSalt = `${baseCation}${anion}`;
        }
        
        return [newSalt, hydroxide];
      },
      reactionType: "double_replacement",
      conditions: ["aqueous", "room temperature"]
    },
    
    // Salt + Salt -> New salt + New salt (double replacement/precipitation)
    "salt": {
      possible: (salt1, salt2) => {
        const { cation: cation1, anion: anion1 } = extractSaltComponents(salt1);
        const { cation: cation2, anion: anion2 } = extractSaltComponents(salt2);
        
        if (!cation1 || !anion1 || !cation2 || !anion2) return false;
        
        // Check if either potential product would be insoluble
        // This is a simplification - would need to check solubility rules
        const potentialSalt1 = `${cation1}${anion2}`;
        const potentialSalt2 = `${cation2}${anion1}`;
        
        const insolubleAnions = ["S", "CO3", "PO4", "OH"];
        const insolubleWithCl = ["Ag", "Pb", "Hg"];
        const insolubleWithSO4 = ["Ba", "Sr", "Pb"];
        
        // Check some common insoluble salt patterns
        if (anion2 === "Cl" && insolubleWithCl.includes(cation1)) return true;
        if (anion1 === "Cl" && insolubleWithCl.includes(cation2)) return true;
        if (anion2 === "SO4" && insolubleWithSO4.includes(cation1)) return true;
        if (anion1 === "SO4" && insolubleWithSO4.includes(cation2)) return true;
        if (insolubleAnions.includes(anion1) || insolubleAnions.includes(anion2)) return true;
        
        // Additionally, check known examples from reference
        if ((cation1 === "Ag" && anion1 === "NO3" && cation2 === "Na" && anion2 === "Cl") ||
            (cation2 === "Ag" && anion2 === "NO3" && cation1 === "Na" && anion1 === "Cl")) {
          return true; // AgNO3 + NaCl → AgCl↓ + NaNO3
        }
        
        return false;
      },
      products: (salt1, salt2) => {
        const { cation: cation1, anion: anion1 } = extractSaltComponents(salt1);
        const { cation: cation2, anion: anion2 } = extractSaltComponents(salt2);
        
        if (!cation1 || !anion1 || !cation2 || !anion2) return null;
        
        // Form the new salt combinations
        const newSalt1 = `${cation1}${anion2}`;
        const newSalt2 = `${cation2}${anion1}`;
        
        return [newSalt1, newSalt2];
      },
      reactionType: "double_replacement",
      conditions: ["aqueous", "room temperature"]
    },
    
    // Salt thermal decomposition (specific to certain salts)
    "heat": {
      possible: (salt) => {
        const { anion } = extractSaltComponents(salt);
        
        // Known decomposable salt types
        const decomposableAnions = ["CO3", "HCO3", "NO3", "OH"];
        return decomposableAnions.includes(anion);
      },
      products: (salt) => {
        const { cation, anion } = extractSaltComponents(salt);
        
        if (!cation || !anion) return null;
        
        // Different decomposition patterns based on anion
        if (anion === "CO3") {
          // Carbonate decomposition: MCO3 → MO + CO2
          return [`${cation}O`, "CO2"];
        } else if (anion === "HCO3") {
          // Bicarbonate decomposition: 2MHCO3 → M2CO3 + H2O + CO2
          return [`${cation}2CO3`, "H2O", "CO2"];
        } else if (anion === "NO3") {
          // Nitrate decomposition varies by metal
          if (["Na", "K"].includes(cation)) {
            // Alkali metal nitrates: MNO3 → MNO2 + O2
            return [`${cation}NO2`, "O2"];
          } else if (["Mg", "Ca", "Ba"].includes(cation)) {
            // Alkaline earth metal nitrates: M(NO3)2 → MO + NO2 + O2
            return [`${cation}O`, "NO2", "O2"];
          } else {
            // Other metal nitrates (simplified)
            return [`${cation}O`, "NO2", "O2"];
          }
        } else if (anion === "OH") {
          // Hydroxide decomposition: M(OH)x → MO(x/2) + H2O
          if (["Na", "K"].includes(cation)) {
            return [`${cation}2O`, "H2O"];
          } else if (["Ca", "Mg", "Ba", "Zn", "Cu"].includes(cation)) {
            return [`${cation}O`, "H2O"];
          } else if (cation === "Al") {
            return ["Al2O3", "H2O"];
          } else {
            return [`${cation}O`, "H2O"];
          }
        }
        
        return null;
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  },
  
  [saltCategories.ACIDIC]: {
    // Acidic Salt + Base → Normal Salt + Water
    "base": {
      possible: true,
      products: (salt, base) => {
        const { cation, anion } = extractSaltComponents(salt);
        const { cation: baseCation } = extractIons(base);
        
        if (!cation || !anion || !baseCation) return null;
        
        // Replace H in the acidic salt
        let normalAnion;
        if (anion === "HSO4") {
          normalAnion = "SO4";
        } else if (anion === "HCO3") {
          normalAnion = "CO3";
        } else if (anion === "H2PO4") {
          normalAnion = "HPO4"; // Or could be PO4 depending on stoichiometry
        } else {
          normalAnion = anion.replace("H", "");
        }
        
        // Form normal salt
        const normalSalt = `${cation}${normalAnion}`;
        
        return [normalSalt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["aqueous", "room temperature"]
    },
    
    // Acidic salt decomposition
    "heat": {
      possible: (salt) => {
        const { anion } = extractSaltComponents(salt);
        
        // Most common decomposable acidic salts
        return anion === "HCO3" || anion === "HSO4" || anion === "H2PO4";
      },
      products: (salt) => {
        const { cation, anion } = extractSaltComponents(salt);
        
        if (!cation || !anion) return null;
        
        // Different decomposition patterns
        if (anion === "HCO3") {
          // Example: 2NaHCO3 → Na2CO3 + H2O + CO2
          return [`${cation}2CO3`, "H2O", "CO2"];
        } else if (anion === "HSO4") {
          // Example: 2KHSO4 → K2S2O7 + H2O (simplified)
          return [`${cation}2S2O7`, "H2O"];
        } else if (anion === "H2PO4") {
          // Simplified decomposition
          return [`${cation}PO3`, "H2O"];
        }
        
        return null;
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  },
  
  [saltCategories.BASIC]: {
    // Basic Salt + Acid → Normal Salt + Water
    "acid": {
      possible: true,
      products: (salt, acid) => {
        const { cation, anion } = extractSaltComponents(salt);
        const { anion: acidAnion } = extractIons(acid);
        
        if (!cation || !anion || !acidAnion) return null;
        
        // Remove OH from the basic salt
        const normalAnion = anion.replace("OH", "");
        
        // Form normal salt
        const normalSalt = `${cation}${acidAnion}`;
        
        return [normalSalt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["aqueous", "room temperature"]
    },
    
    // Basic salt decomposition
    "heat": {
      possible: true,
      products: (salt) => {
        const { cation } = extractSaltComponents(salt);
        
        if (!cation) return null;
        
        // Basic salts usually decompose to oxides
        return [`${cation}O`, "H2O"];
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  },
  
  [saltCategories.DOUBLE]: {
    // Double salts typically undergo similar reactions as normal salts
    // but may produce more complex products
    
    // Simplified for now - handling is similar to normal salts
    "acid": {
      possible: (salt, acid) => saltReactions[saltCategories.NORMAL]["acid"].possible(salt, acid),
      products: (salt, acid) => saltReactions[saltCategories.NORMAL]["acid"].products(salt, acid),
      reactionType: "double_replacement",
      conditions: ["aqueous", "room temperature"]
    },
    
    "base": {
      possible: (salt, base) => saltReactions[saltCategories.NORMAL]["base"].possible(salt, base),
      products: (salt, base) => saltReactions[saltCategories.NORMAL]["base"].products(salt, base),
      reactionType: "double_replacement",
      conditions: ["aqueous", "room temperature"]
    },
    
    "heat": {
      possible: true,
      products: (salt) => {
        // Double salts typically decompose to simpler salts or oxides
        // For example: KAl(SO4)2 → K2SO4 + Al2(SO4)3
        // This is a simplification
        return ["Simpler salt components - would need specific handling"];
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  }
};

/**
 * Determines if a reaction involving a salt is possible
 * @param {string} salt - Salt formula
 * @param {string} reactant - Reactant formula
 * @returns {boolean} - Whether the reaction is possible
 */
export function canReact(salt, reactant) {
  // Determine the salt category
  const saltType = classifySaltByType(salt);
  if (!saltType || !saltReactions[saltType]) return false;

  
  // Check if reactant is a metal
  if (isMetal(reactant)) {
    return saltReactions[saltType]["metal"]?.possible?.(salt, reactant) || false;
  }
  
  // Check if reactant is an acid
  if (reactant.startsWith('H') && !reactant.startsWith('H2O')) {
    return saltReactions[saltType]["acid"]?.possible?.(salt, reactant) || false;
  }
  
  // Check if reactant is a base
  if (reactant.includes('OH')) {
    return saltReactions[saltType]["base"]?.possible?.(salt, reactant) || false;
  }
  
  // Check if reactant is another salt
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !reactant.match(/^[A-Z][a-z]?$/) && !reactant.includes('O')) {
    return saltReactions[saltType]["salt"]?.possible?.(salt, reactant) || false;
  }
  
  // For thermal decomposition (special case)
  if (reactant === "heat") {
    return saltReactions[saltType]["heat"]?.possible?.(salt) || false;
  }
  
  return false;
}

/**
 * Predicts the products of a reaction involving a salt
 * @param {string} salt - Salt formula
 * @param {string} reactant - Reactant formula
 * @returns {Array|null} - Array of product formulas or null if no reaction
 */
export function predictProducts(salt, reactant) {
  // First check if the reaction is possible
  if (!canReact(salt, reactant)) {
    return null;
  }
  
  // Determine the salt category
  const saltType = classifySaltByType(salt);
  if (!saltType || !saltReactions[saltType]) return false;
  
  // Check if reactant is a metal
  if (isMetal(reactant)) {
    return saltReactions[saltType]["metal"].products(salt, reactant);
  }
  
  // Check if reactant is an acid
  if (reactant.startsWith('H') && !reactant.startsWith('H2O')) {
    return saltReactions[saltType]["acid"].products(salt, reactant);
  }
  
  // Check if reactant is a base
  if (reactant.includes('OH')) {
    return saltReactions[saltType]["base"].products(salt, reactant);
  }
  
  // Check if reactant is another salt
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !reactant.match(/^[A-Z][a-z]?$/) && !reactant.includes('O')) {
    return saltReactions[saltType]["salt"].products(salt, reactant);
  }
  
  // For thermal decomposition
  if (reactant === "heat") {
    return saltReactions[saltType]["heat"].products(salt);
  }
  
  return null;
}

/**
 * Gets information about a reaction involving a salt
 * @param {string} salt - Salt formula
 * @param {string} reactant - Reactant formula
 * @returns {Object|null} - Information about the reaction or null if not possible
 */
export function getReactionInfo(salt, reactant) {
  // First check if the reaction is possible
  if (!canReact(salt, reactant)) {
    return null;
  }
  
  // Determine the salt category and reaction details
  const saltType = classifySaltByType(salt);
  if (!saltType || !saltReactions[saltType]) return false;
  let reactantType;
  let reactionDetails;
  
  // Check if reactant is a metal
  if (isMetal(reactant)) {
    reactantType = "metal";
    reactionDetails = saltReactions[saltType]["metal"];
  }
  
  // Check if reactant is an acid
  else if (reactant.startsWith('H') && !reactant.startsWith('H2O')) {
    reactantType = "acid";
    reactionDetails = saltReactions[saltType]["acid"];
  }
  
  // Check if reactant is a base
  else if (reactant.includes('OH')) {
    reactantType = "base";
    reactionDetails = saltReactions[saltType]["base"];
  }
  
  // Check if reactant is another salt
  else if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !reactant.match(/^[A-Z][a-z]?$/) && !reactant.includes('O')) {
    reactantType = "salt";
    reactionDetails = saltReactions[saltType]["salt"];
  }
  
  // For thermal decomposition
  else if (reactant === "heat") {
    reactantType = "heat";
    reactionDetails = saltReactions[saltType]["heat"];
  }
  
  if (!reactionDetails) return null;
  
  return {
    saltType,
    reactantType,
    reactionType: reactionDetails.reactionType,
    products: reactantType === "heat" ? 
      reactionDetails.products(salt) : 
      reactionDetails.products(salt, reactant),
    conditions: reactionDetails.conditions || []
  };
}