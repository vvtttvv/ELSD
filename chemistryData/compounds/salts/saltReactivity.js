import { saltCategories, classifySaltByType, isSoluble, determineSaltpH, extractSaltComponents, isSalt } from './saltTypes.js';
import { oxideCategories, classifyOxide } from '../oxides/oxideTypes.js';
import { baseCategories, classifyBaseByStrength, extractMetal, getHydroxideCount } from '../bases/baseTypes.js';
import { acidCategories, classifyAcidByStrength } from '../acids/acidTypes.js';
import { isMetal, isNonMetal } from '../../core/elements.js';
import { extractIons, extractIonsWithOxidationState } from '../../core/extractIons.js';
import { balanceSaltFormula, balanceSaltFormulaWithOxidationState } from '../../core/valences.js';
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
        console.log("[saltReactivity] Checking metal reaction possibility");
        console.log("Salt:", salt, "Metal:", metal);
        
        const { cation } = extractSaltComponents(salt);
        console.log("Extracted cation from salt:", cation);
        
        if (!cation || !metal) {
          console.log("Missing cation or metal");
          return false;
        }
        
        // Only possible if the metal is more reactive than the salt's cation
        // Activity series (simplified): K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Ag > Au
        const activitySeries = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "H", "Cu", "Ag", "Au"];
        
        const metalIndex = activitySeries.indexOf(metal);
        const cationIndex = activitySeries.indexOf(cation);
        
        console.log(`Metal (${metal}) index: ${metalIndex}, Cation (${cation}) index: ${cationIndex}`);
        
        // Metal must be higher in the activity series (more reactive)
        const result = metalIndex >= 0 && cationIndex >= 0 && metalIndex < cationIndex;
        console.log("Metal replacement possible:", result);
        return result;
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
        const baseMetal = extractMetal(base);
        
        if (!cation || !baseMetal) return false;
        
        // Special case: Ammonium salts with strong bases produce NH3 gas
        if (cation === "NH4") return true;
        
        // Check if reaction would form an insoluble hydroxide
        const insolubleHydroxides = ["Fe", "Cu", "Zn", "Pb", "Mg", "Ca", "Al", "Cr", "Ni", "Co", "Mn", "Cd", "Hg"];
        return insolubleHydroxides.includes(cation);
      },
      products: (salt, base) => {
        const saltIons = extractIonsWithOxidationState(salt);
        const baseMetal = extractMetal(base);
        const baseHydroxideCount = getHydroxideCount(base);
        
        if (!saltIons.cation || !saltIons.anion || !baseMetal) return null;
        
        const { cation, anion, cationOxidationState } = saltIons;
        
        // Special case: Ammonium salts produce NH3 gas
        if (cation === "NH4") {
          const newSalt = balanceSaltFormula(baseMetal, anion);
          return [newSalt, "NH3", "H2O"];
        }
        
        // Form the metal hydroxide using the correct oxidation state
        let hydroxide;
        const oxidationState = cationOxidationState || 2; // Default to 2 if not determined
        
        if (oxidationState === 1) {
          hydroxide = `${cation}OH`;
        } else if (oxidationState === 2) {
          hydroxide = `${cation}(OH)2`;
        } else if (oxidationState === 3) {
          hydroxide = `${cation}(OH)3`;
        } else {
          hydroxide = `${cation}(OH)${oxidationState}`;
        }
        
        // Form the new salt using proper balancing
        let newSalt;
        if (baseHydroxideCount) {
          // Use the base's oxidation state for proper balancing
          newSalt = balanceSaltFormulaWithOxidationState(baseMetal, anion, baseHydroxideCount);
        } else {
          // Fallback to standard balancing
          newSalt = balanceSaltFormula(baseMetal, anion);
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
        const insolubleWithI = ["Ag", "Pb", "Hg"]; // Heavy metals form insoluble iodides
        
        // Check some common insoluble salt patterns
        if (anion2 === "Cl" && insolubleWithCl.includes(cation1)) return true;
        if (anion1 === "Cl" && insolubleWithCl.includes(cation2)) return true;
        if (anion2 === "SO4" && insolubleWithSO4.includes(cation1)) return true;
        if (anion1 === "SO4" && insolubleWithSO4.includes(cation2)) return true;
        if (anion2 === "I" && insolubleWithI.includes(cation1)) return true;
        if (anion1 === "I" && insolubleWithI.includes(cation2)) return true;
        if (insolubleAnions.includes(anion1) || insolubleAnions.includes(anion2)) return true;
        
        // Check for slightly soluble to insoluble exchanges
        // CaSO4 is less soluble than most sulfates
        if ((cation1 === "Ca" && anion2 === "SO4") || (cation2 === "Ca" && anion1 === "SO4")) return true;
        
        // Additionally, check known examples from reference
        if ((cation1 === "Ag" && anion1 === "NO3" && cation2 === "Na" && anion2 === "Cl") ||
            (cation2 === "Ag" && anion2 === "NO3" && cation1 === "Na" && anion1 === "Cl")) {
          return true; // AgNO3 + NaCl → AgCl↓ + NaNO3
        }
        
        return false;
      },
      products: (salt1, salt2) => {
        const ionInfo1 = extractIonsWithOxidationState(salt1);
        const ionInfo2 = extractIonsWithOxidationState(salt2);
        
        const { cation: cation1, anion: anion1, cationOxidationState: oxidation1 } = ionInfo1;
        const { cation: cation2, anion: anion2, cationOxidationState: oxidation2 } = ionInfo2;
        
        if (!cation1 || !anion1 || !cation2 || !anion2) return null;
        
        // Form the new salt combinations using oxidation-state aware balancing
        let newSalt1, newSalt2;
        if (oxidation1) {
          newSalt1 = balanceSaltFormulaWithOxidationState(cation1, anion2, oxidation1);
        } else {
          newSalt1 = balanceSaltFormula(cation1, anion2);
        }
        
        if (oxidation2) {
          newSalt2 = balanceSaltFormulaWithOxidationState(cation2, anion1, oxidation2);
        } else {
          newSalt2 = balanceSaltFormula(cation2, anion1);
        }
        
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
        const decomposableAnions = ["CO3", "HCO3", "NO3", "OH", "SO4", "ClO3", "ClO4"];
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
          } else if (cation === "Ag") {
            // Silver nitrate decomposes to metal: 2AgNO3 → 2Ag + 2NO2 + O2
            return ["Ag", "NO2", "O2"];
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
        } else if (anion === "SO4") {
          // Sulfate decomposition (high temperature): MSO4 → MO + SO3
          return [`${cation}O`, "SO3"];
        } else if (anion === "ClO3") {
          // Chlorate decomposition: MClO3 → MCl + O2
          return [`${cation}Cl`, "O2"];
        } else if (anion === "ClO4") {
          // Perchlorate decomposition: MClO4 → MCl + 2O2
          return [`${cation}Cl`, "O2"];
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
      possible: (salt, base) => {
        // Acidic salts can react with bases to form normal salts
        const { anion } = extractSaltComponents(salt);
        const acidicAnions = ["HSO4", "HCO3", "H2PO4", "HPO4"];
        return acidicAnions.includes(anion);
      },
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
      possible: (salt, acid) => {
        // Basic salts can react with acids
        const { anion } = extractSaltComponents(salt);
        return anion && anion.includes("OH");
      },
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

//Determines if a reaction involving a salt is possible
export function canReact(salt, reactant) {
  console.log(`Checking reaction possibility for ${salt} + ${reactant}`);
  
  if (!salt || typeof salt !== 'string') {
    console.warn("Invalid salt parameter:", salt);
    return false;
  }
  
  if (!reactant || typeof reactant !== 'string') {
    console.warn("Invalid reactant parameter:", reactant);
    return false;
  }
  
  // Determine the salt category 
  let saltType;
  try {
    saltType = classifySaltByType(salt);
    if (!saltType) {
      console.warn(`Cannot classify salt type for ${salt}`);
      return false;
    }
  } catch (err) {
    console.warn(`Error classifying salt ${salt}:`, err.message);
    return false;
  }
  
  // Check if reactant is a metal 
  try {
    if (isMetal(reactant)) {
      if (!saltReactions[saltType] || !saltReactions[saltType]["metal"] || !saltReactions[saltType]["metal"].possible) {
        console.warn(`No reaction definition for ${saltType} salt with metal`);
        return false;
      }
      return saltReactions[saltType]["metal"].possible(salt, reactant) || false;
    }
  } catch (err) {
    console.warn(`Error checking metal reaction for ${salt} + ${reactant}:`, err.message);
    return false;
  }
  
  // Check if reactant is an acid
  if (reactant.startsWith('H') && !reactant.startsWith('H2O')) {
    if (!saltReactions[saltType] || !saltReactions[saltType]["acid"] || !saltReactions[saltType]["acid"].possible) {
      return false;
    }
    
    try {
      return saltReactions[saltType]["acid"].possible(salt, reactant) || false;
    } catch (err) {
      console.warn(`Error checking acid reaction:`, err.message);
      return false;
    }
  }
  
  // Check if reactant is a base
  if (reactant.includes('OH')) {
    if (!saltReactions[saltType] || !saltReactions[saltType]["base"] || !saltReactions[saltType]["base"].possible) {
      return false;
    }
    
    try {
      return saltReactions[saltType]["base"].possible(salt, reactant) || false;
    } catch (err) {
      console.warn(`Error checking base reaction:`, err.message);
      return false;
    }
  }
  
  // Check if reactant is another salt
  if (isSalt(reactant)) {
    if (!saltReactions[saltType]?.salt?.possible) return false;
    try {
      return saltReactions[saltType].salt.possible(salt, reactant) || false;
    } catch (err) {
      console.warn(`Error checking salt-salt reaction:`, err.message);
      return false;
    }
  }

  // For thermal decomposition (special case)
  if (reactant === "heat") {
    if (!saltReactions[saltType] || !saltReactions[saltType]["heat"] || !saltReactions[saltType]["heat"].possible) {
      return false;
    }
    
    try {
      return saltReactions[saltType]["heat"].possible(salt) || false;
    } catch (err) {
      console.warn(`Error checking thermal decomposition:`, err.message);
      return false;
    }
  }
  
  return false;
}

//Predicts the products of a reaction involving a salt
export function predictProducts(salt, reactant) {
  // First check if the reaction is possible
  if (!canReact(salt, reactant)) {
    return null;
  }
  
  // Determine the salt category
  const saltType = classifySaltByType(salt);
  
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
  if (isSalt(reactant)) {
    return saltReactions[saltType].salt.products(salt, reactant);
  }

  
  // For thermal decomposition
  if (reactant === "heat") {
    return saltReactions[saltType]["heat"].products(salt);
  }
  
  return null;
}

//Gets information about a reaction involving a salt
export function getReactionInfo(salt, reactant) {
  // First check if the reaction is possible
  if (!canReact(salt, reactant)) {
    return null;
  }
  
  // Determine the salt category and reaction details
  const saltType = classifySaltByType(salt);
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
  else if (isSalt(reactant)) {
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