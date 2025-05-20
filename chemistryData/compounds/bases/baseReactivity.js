import { baseCategories, classifyBaseByStrength, classifyBaseBySolubility, isAmphotericBase, extractMetal, getHydroxideCount } from './baseTypes.js';
import { oxideCategories, classifyOxide } from '../oxides/oxideTypes.js';
import { extractIons } from '../../core/extractIons.js';
import { elementValences } from '../../core/valences.js';
import { solubilityTable } from '../../core/solubilityTable.js';

/**
 * Reaction patterns for bases with different reactants
 * Each rule defines whether a reaction is possible and what products would form
 */
export const baseReactions = {
  [baseCategories.STRONG]: {
    // Strong Base + Acid -> Salt + Water
    "acid": {
      possible: true,
      products: (base, acid) => {
        const metal = extractMetal(base);
        const { anion } = extractIons(acid);
        if (!metal || !anion) return null;
        
        const hydroxideCount = getHydroxideCount(base);
        
        // Determine salt formula based on metal valence
        let salt;
        if (hydroxideCount === 1) {
          salt = `${metal}${anion}`;
        } else {
          salt = `${metal}${anion}${hydroxideCount}`;
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Base + Acidic Oxide -> Salt + Water
    [oxideCategories.ACIDIC]: {
      possible: true,
      products: (base, acidicOxide) => {
        const metal = extractMetal(base);
        const nonMetal = extractMetal(acidicOxide); // Gets main element from oxide
        if (!metal || !nonMetal) return null;
        
        const hydroxideCount = getHydroxideCount(base);
        
        // Generate salt formula - this is simplified and would need refinement
        if (hydroxideCount === 1) {
          return [`${metal}2${nonMetal}O3`, "H2O"];
        } else if (hydroxideCount === 2) {
          return [`${metal}${nonMetal}O3`, "H2O"];
        } else {
          return [`${metal}2(${nonMetal}O4)3`, "H2O"];
        }
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Base + Amphoteric Oxide -> Complex Salt + Water
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (base, amphoOxide) => {
        const metal = extractMetal(base);
        const amphoMetal = extractMetal(amphoOxide);
        if (!metal || !amphoMetal) return null;
        
        // Form complex salt like Na2ZnO2 from ZnO + 2NaOH
        const hydroxideCount = getHydroxideCount(base);
        if (hydroxideCount === 1) {
          return [`${metal}2${amphoMetal}O2`, "H2O"];
        } else {
          return [`${metal}${amphoMetal}O2`, "H2O"];
        }
      },
      reactionType: "complex_formation",
      conditions: ["room temperature", "aqueous", "excess base"]
    },
    
    // Strong Base + Amphoteric Hydroxide -> Complex Salt + Water
    [baseCategories.AMPHOTERIC]: {
      possible: true,
      products: (strongBase, amphoBase) => {
        const metal = extractMetal(strongBase);
        const amphoMetal = extractMetal(amphoBase);
        if (!metal || !amphoMetal) return null;
        
        // Cases from the reference:
        // Al(OH)3 + NaOH = NaAlO2 + 2H2O
        // Al(OH)3 + excess NaOH = Na[Al(OH)4]
        
        // Standard case - forms aluminate/zincate
        return [`${metal}${amphoMetal}O2`, "H2O"];
      },
      reactionType: "complex_formation",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Base + Soluble Salt -> Possible precipitation reaction
    "salt": {
      possible: (base, salt) => {
        // Check if this could form an insoluble hydroxide
        const { cation } = extractIons(salt);
        if (!cation) return false;
        
        // If salt contains a transition metal cation, a precipitation reaction is likely
        const transitionMetals = ['Fe', 'Cu', 'Zn', 'Ni', 'Co', 'Mn', 'Cr', 'Cd', 'Hg', 'Pb'];
        return transitionMetals.includes(cation);
      },
      products: (base, salt) => {
        const { cation, anion } = extractIons(salt);
        const baseMetalIon = extractMetal(base);
        if (!cation || !anion || !baseMetalIon) return null;
        
        // Form new salt and insoluble hydroxide
        // Example: 2NaOH + CuSO4 → Na2SO4 + Cu(OH)2↓
        const newSalt = `${baseMetalIon}2${anion}`;
        const precipitate = `${cation}(OH)2`;
        
        return [newSalt, precipitate];
      },
      reactionType: "precipitation",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Base + Non-metal -> Salt + Hydrogen
    "nonmetal": {
      possible: true,
      products: (base, nonmetal) => {
        const metal = extractMetal(base);
        if (!metal) return null;
        
        // Reactions with halogens
        if (nonmetal === "Cl2") {
          // KOH + Cl2 → KCl + KClO + H2O
          return [`${metal}Cl`, `${metal}ClO`, "H2O"];
        }
        
        return null;
      },
      reactionType: "redox",
      conditions: ["room temperature", "aqueous"]
    }
  },
  
  [baseCategories.WEAK]: {
    // Weak Base + Acid -> Salt + Water
    "acid": {
      possible: true,
      products: (base, acid) => {
        const metal = extractMetal(base);
        const { anion } = extractIons(acid);
        if (!metal || !anion) return null;
        
        const hydroxideCount = getHydroxideCount(base);
        
        // Similar to strong base reaction
        let salt;
        if (hydroxideCount === 1) {
          salt = `${metal}${anion}`;
        } else {
          salt = `${metal}${anion}${hydroxideCount}`;
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Base + Acidic Oxide -> Limited reaction
    [oxideCategories.ACIDIC]: {
      possible: true,
      products: (base, acidicOxide) => {
        // Similar to strong base but reaction may be incomplete
        const metal = extractMetal(base);
        const nonMetal = extractMetal(acidicOxide);
        if (!metal || !nonMetal) return null;
        
        const hydroxideCount = getHydroxideCount(base);
        
        // Generate salt formula with similar patterns as strong base
        if (hydroxideCount === 1) {
          return [`${metal}2${nonMetal}O3`, "H2O"];
        } else if (hydroxideCount === 2) {
          return [`${metal}${nonMetal}O3`, "H2O"];
        } else {
          return [`${metal}2(${nonMetal}O4)3`, "H2O"];
        }
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak bases typically decompose when heated
    "heat": {
      possible: true,
      products: (base) => {
        const metal = extractMetal(base);
        if (!metal) return null;
        
        // Many weak hydroxides decompose to oxides when heated
        // Example: Cu(OH)2 → CuO + H2O
        const hydroxideCount = getHydroxideCount(base);
        let oxide;
        
        if (hydroxideCount === 2) {
          oxide = `${metal}O`;
        } else if (hydroxideCount === 3) {
          oxide = `${metal}2O3`;
        } else {
          oxide = `${metal}2O`;
        }
        
        return [oxide, "H2O"];
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  },
  
  [baseCategories.AMPHOTERIC]: {
    // Amphoteric Base + Acid -> Salt + Water
    "acid": {
      possible: true,
      products: (base, acid) => {
        const metal = extractMetal(base);
        const { anion } = extractIons(acid);
        if (!metal || !anion) return null;
        
        const hydroxideCount = getHydroxideCount(base);
        
        // Regular neutralization
        // Example: Zn(OH)2 + 2HCl → ZnCl2 + 2H2O
        let salt;
        if (hydroxideCount === 1) {
          salt = `${metal}${anion}`;
        } else {
          salt = `${metal}${anion}${hydroxideCount}`;
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Amphoteric Base + Strong Base -> Complex Salt + Water
    [baseCategories.STRONG]: {
      possible: true,
      products: (amphoBase, strongBase) => {
        const amphoMetal = extractMetal(amphoBase);
        const alkaliMetal = extractMetal(strongBase);
        if (!amphoMetal || !alkaliMetal) return null;
        
        // Examples:
        // Al(OH)3 + NaOH → NaAlO2 + 2H2O
        // With excess base: Al(OH)3 + NaOH → Na[Al(OH)4]
        
        // Regular case - forms aluminate/zincate
        return [`${alkaliMetal}${amphoMetal}O2`, "H2O"];
      },
      reactionType: "complex_formation",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Amphoteric bases typically decompose when heated
    "heat": {
      possible: true,
      products: (base) => {
        const metal = extractMetal(base);
        if (!metal) return null;
        
        // Similar to weak bases
        // Example: Zn(OH)2 → ZnO + H2O
        const hydroxideCount = getHydroxideCount(base);
        let oxide;
        
        if (hydroxideCount === 2) {
          oxide = `${metal}O`;
        } else if (hydroxideCount === 3) {
          oxide = `${metal}2O3`;
        } else {
          oxide = `${metal}2O`;
        }
        
        return [oxide, "H2O"];
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  }
};

//Determines if a reaction involving a base is possible
export function canReact(base, reactant) {
  // Determine the base category
  const baseStrength = classifyBaseByStrength(base);
  if (!baseStrength) return false;
  
  // Check if reactant is an acid
  if (reactant.startsWith('H') && !reactant.startsWith('H2O')) {
    return baseReactions[baseStrength]["acid"].possible;
  }
  
  // Check if reactant is an oxide
  const oxideType = classifyOxide(reactant);
  if (oxideType) {
    return baseReactions[baseStrength][oxideType]?.possible || false;
  }
  
  // Check if reactant is another base (for amphoteric reactions)
  if (reactant.includes('OH')) {
    const reactantStrength = classifyBaseByStrength(reactant);
    
    // Amphoteric base can react with strong base
    if (baseStrength === baseCategories.AMPHOTERIC && 
        reactantStrength === baseCategories.STRONG) {
      return baseReactions[baseCategories.AMPHOTERIC][baseCategories.STRONG].possible;
    }
    
    // Strong base can react with amphoteric base
    if (baseStrength === baseCategories.STRONG && 
        reactantStrength === baseCategories.AMPHOTERIC) {
      return baseReactions[baseCategories.STRONG][baseCategories.AMPHOTERIC].possible;
    }
    
    return false;
  }
  
  // Check for salt (simple detection - not comprehensive)
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !["O", "N", "Cl", "Br", "I", "F", "S", "P", "C"].includes(reactant)) {
    return baseReactions[baseStrength]["salt"]?.possible?.(base, reactant) || false;
  }
  
  // Check for non-metals (simple detection)
  if (["Cl2", "Br2", "I2", "S", "P"].includes(reactant)) {
    return baseReactions[baseStrength]["nonmetal"]?.possible || false;
  }
  
  // For thermal decomposition (special case)
  if (reactant === "heat") {
    return baseReactions[baseStrength]["heat"]?.possible || false;
  }
  
  return false;
}

//Predicts the products of a reaction involving a base
export function predictProducts(base, reactant) {
  // First check if the reaction is possible
  if (!canReact(base, reactant)) {
    return null;
  }
  
  // Determine the base category
  const baseStrength = classifyBaseByStrength(base);
  
  // Check if reactant is an acid
  if (reactant.startsWith('H') && !reactant.startsWith('H2O')) {
    return baseReactions[baseStrength]["acid"].products(base, reactant);
  }
  
  // Check if reactant is an oxide
  const oxideType = classifyOxide(reactant);
  if (oxideType && baseReactions[baseStrength][oxideType]) {
    return baseReactions[baseStrength][oxideType].products(base, reactant);
  }
  
  // Check if reactant is another base (for amphoteric reactions)
  if (reactant.includes('OH')) {
    const reactantStrength = classifyBaseByStrength(reactant);
    
    // Amphoteric base can react with strong base
    if (baseStrength === baseCategories.AMPHOTERIC && 
        reactantStrength === baseCategories.STRONG) {
      return baseReactions[baseCategories.AMPHOTERIC][baseCategories.STRONG].products(base, reactant);
    }
    
    // Strong base can react with amphoteric base
    if (baseStrength === baseCategories.STRONG && 
        reactantStrength === baseCategories.AMPHOTERIC) {
      return baseReactions[baseCategories.STRONG][baseCategories.AMPHOTERIC].products(base, reactant);
    }
    
    return null;
  }
  
  // Check for salt
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !["O", "N", "Cl", "Br", "I", "F", "S", "P", "C"].includes(reactant)) {
    if (baseReactions[baseStrength]["salt"] && 
        baseReactions[baseStrength]["salt"].possible(base, reactant)) {
      return baseReactions[baseStrength]["salt"].products(base, reactant);
    }
  }
  
  // Check for non-metals
  if (["Cl2", "Br2", "I2", "S", "P"].includes(reactant)) {
    if (baseReactions[baseStrength]["nonmetal"]) {
      return baseReactions[baseStrength]["nonmetal"].products(base, reactant);
    }
  }
  
  // For thermal decomposition (special case)
  if (reactant === "heat") {
    if (baseReactions[baseStrength]["heat"]) {
      return baseReactions[baseStrength]["heat"].products(base);
    }
  }
  
  return null;
}

//Gets information about a reaction involving a base
export function getReactionInfo(base, reactant) {
  // First check if the reaction is possible
  if (!canReact(base, reactant)) {
    return null;
  }
  
  // Determine the base category
  const baseStrength = classifyBaseByStrength(base);
  
  // Determine reactant type and get reaction details
  let reactantType;
  let reactionDetails;
  
  // Check if reactant is an acid
  if (reactant.startsWith('H') && !reactant.startsWith('H2O')) {
    reactantType = "acid";
    reactionDetails = baseReactions[baseStrength]["acid"];
  }
  
  // Check if reactant is an oxide
  const oxideType = classifyOxide(reactant);
  if (oxideType) {
    reactantType = `${oxideType} oxide`;
    reactionDetails = baseReactions[baseStrength][oxideType];
  }
  
  // Check if reactant is another base
  if (reactant.includes('OH')) {
    const reactantStrength = classifyBaseByStrength(reactant);
    const isAmphoteric = isAmphotericBase(reactant);
    
    if (isAmphoteric && baseStrength === baseCategories.STRONG) {
      reactantType = "amphoteric hydroxide";
      reactionDetails = baseReactions[baseStrength][baseCategories.AMPHOTERIC];
    } else if (baseStrength === baseCategories.AMPHOTERIC && reactantStrength === baseCategories.STRONG) {
      reactantType = "strong base";
      reactionDetails = baseReactions[baseCategories.AMPHOTERIC][baseCategories.STRONG];
    } else {
      return null; // No reaction between other base combinations
    }
  }
  
  // Check for salt
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !reactantType && !["O", "N", "Cl", "Br", "I", "F", "S", "P", "C"].includes(reactant)) {
    reactantType = "salt";
    reactionDetails = baseReactions[baseStrength]["salt"];
  }
  
  // Check for non-metals
  if (["Cl2", "Br2", "I2", "S", "P"].includes(reactant)) {
    reactantType = "nonmetal";
    reactionDetails = baseReactions[baseStrength]["nonmetal"];
  }
  
  // For thermal decomposition
  if (reactant === "heat") {
    reactantType = "heat";
    reactionDetails = baseReactions[baseStrength]["heat"];
  }
  
  if (!reactionDetails) return null;
  
  return {
    baseType: baseStrength,
    reactantType,
    reactionType: reactionDetails.reactionType,
    products: reactionDetails.products(base, reactant),
    conditions: reactionDetails.conditions || []
  };
}