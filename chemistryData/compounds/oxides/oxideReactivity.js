import { oxideCategories, classifyOxide, extractMainElement, getOxidationState, getCorrespondingAcid, getCorrespondingHydroxide } from './oxideTypes.js';
import { extractIons } from '../../core/extractIons.js';
import { elementValences, balanceSaltFormula } from '../../core/valences.js';
import { solubilityTable } from '../../core/solubilityTable.js';
import { isMetal, isNonMetal } from '../../core/elements.js';
import { extractAcidRadical } from '../acids/acidTypes.js';

/**
 * Reaction possibility and product rules for oxide reactions
 * Each rule defines whether a reaction is possible and what products would form
 */
export const oxideReactions = {
  [oxideCategories.BASIC]: {
    // Basic Oxide + Water -> Metal Hydroxide
    "H2O": {
      possible: true,
      products: (oxide) => {
        return [getCorrespondingHydroxide(oxide)];
      },
      reactionType: "hydration",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Basic Oxide + Acid -> Salt + Water
    "acid": {
      possible: true,
      products: (oxide, acid) => {
        const metal = extractMainElement(oxide);
        const { anion } = extractIons(acid);
        if (!metal || !anion) return null;
        
        // Use proper salt formation with valence balancing
        const salt = balanceSaltFormula(metal, anion, oxide);
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Basic Oxide + Acidic Oxide -> Salt
    [oxideCategories.ACIDIC]: {
      possible: true,
      products: (basicOxide, acidicOxide) => {
        const metal = extractMainElement(basicOxide);
        if (!metal) return null;
        
        // Get the corresponding acid for the acidic oxide
        const correspondingAcid = getCorrespondingAcid(acidicOxide);
        if (!correspondingAcid) return null;
        
        // Extract the acid radical (anion) from the corresponding acid
        const anion = extractAcidRadical(correspondingAcid);
        if (!anion) return null;
        
        // Get the metal valence from the basic oxide
        const metalValence = getOxidationState(basicOxide);
        
        // Build the salt using proper valence balancing
        const salt = balanceSaltFormula(metal, anion);
        
        return [salt];
      },
      reactionType: "oxide_combination",
      conditions: ["heating"]
    },
    
    // Basic Oxide + Amphoteric Oxide -> Complex Salt
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (basicOxide, amphoOxide) => {
        const metal = extractMainElement(basicOxide);
        const amphoMetal = extractMainElement(amphoOxide);
        if (!metal || !amphoMetal) return null;
        
        const metalValence = getOxidationState(basicOxide);
        // Simplified complex salt formation
        if (metalValence === 1) {
          return [`${metal}${amphoMetal}O2`];
        } else if (metalValence === 2) {
          return [`${metal}${amphoMetal}2O4`];
        } else {
          return [`${metal}2${amphoMetal}2O5`]; // Approximation
        }
      },
      reactionType: "complex_formation",
      conditions: ["high temperature"]
    },
    
    // Basic Oxide + Basic Oxide -> No reaction in most cases
    [oxideCategories.BASIC]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    
    // Basic Oxide + Indifferent Oxide -> Generally no reaction
    [oxideCategories.INDIFFERENT]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    }
  },
  
  [oxideCategories.AMPHOTERIC]: {
    // Amphoteric Oxide + Acid -> Salt + Water
    "acid": {
      possible: true,
      products: (oxide, acid) => {
        const metal = extractMainElement(oxide);
        const { anion } = extractIons(acid);
        if (!metal || !anion) return null;
        
        // Use proper salt formation with valence balancing
        const salt = balanceSaltFormula(metal, anion, oxide);
        
        return [salt, "H2O"];
      },
      reactionType: "acid_reaction",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Amphoteric Oxide + Strong Base -> Complex Salt + Water
    "base": {
      possible: (oxide, base) => {
        // Only strong alkali bases typically form complex salts with amphoteric oxides
        const { cation } = extractIons(base);
        const strongBases = ["Na", "K", "Li", "Rb", "Cs"];
        return strongBases.includes(cation);
      },
      products: (oxide, base) => {
        const metal = extractMainElement(oxide);
        const { cation } = extractIons(base);
        if (!metal || !cation) return null;
        
        // Common amphoteric oxide + base reactions:
        // Al2O3 + 2NaOH → 2NaAlO2 + H2O  (simplified stoichiometry)
        // ZnO + 2NaOH → Na2ZnO2 + H2O
        // So Al forms M[Al]O2, Zn forms M2[Zn]O2
        
        if (metal === "Al") {
          // Aluminum forms aluminates: M[Al]O2 (1:1 ratio)
          // Al2O3 + 2NaOH → 2NaAlO2 + H2O
          return [`${cation}${metal}O2`, "H2O"];
        } else if (metal === "Zn") {
          // Zinc forms zincates: M2[Zn]O2 (2:1 ratio)
          // ZnO + 2NaOH → Na2ZnO2 + H2O
          return [`${cation}2${metal}O2`, "H2O"];
        } else {
          // For other amphoteric metals (Cr, Sn, Pb, etc.)
          const metalValence = getOxidationState(oxide);
          if (metalValence === 2) {
            return [`${cation}2${metal}O2`, "H2O"];
          } else if (metalValence === 3) {
            return [`${cation}${metal}O2`, "H2O"];
          } else {
            return [`${cation}${metal}O2`, "H2O"];
          }
        }
      },
      reactionType: "complex_formation",
      conditions: ["room temperature", "aqueous", "excess base"]
    },
    
    // Amphoteric Oxide + Basic Oxide -> Complex Salt
    [oxideCategories.BASIC]: {
      possible: true,
      products: (amphoOxide, basicOxide) => {
        const amphoMetal = extractMainElement(amphoOxide);
        const metal = extractMainElement(basicOxide);
        if (!amphoMetal || !metal) return null;
        
        const metalValence = getOxidationState(basicOxide);
        // Generate complex salt formula
        if (metalValence === 1) {
          return [`${metal}2${amphoMetal}O3`];
        } else if (metalValence === 2) {
          return [`${metal}${amphoMetal}2O4`];
        } else {
          return [`${metal}${amphoMetal}O${2 + metalValence}`];
        }
      },
      reactionType: "complex_formation",
      conditions: ["high temperature"]
    },
    
    // Amphoteric Oxide + Acidic Oxide -> Salt
    [oxideCategories.ACIDIC]: {
      possible: true,
      products: (amphoOxide, acidicOxide) => {
        const metal = extractMainElement(amphoOxide);
        const nonMetal = extractMainElement(acidicOxide);
        if (!metal || !nonMetal) return null;
        
        const metalValence = getOxidationState(amphoOxide);
        const nonMetalValence = Math.abs(getOxidationState(acidicOxide));
        
        // Generate salt formula - similar to basic + acidic case
        if (nonMetalValence === 2 && metalValence === 2) {
          return [`${metal}${nonMetal}O3`];
        } else if (nonMetalValence === 3 && metalValence === 2) {
          return [`${metal}3(${nonMetal}O4)2`]; 
        } else {
          // Generic approach for other valence combinations
          const lcm = leastCommonMultiple(metalValence, nonMetalValence);
          const metalCoeff = lcm / metalValence;
          const nonMetalCoeff = lcm / nonMetalValence;
          return [`${metal}${metalCoeff > 1 ? metalCoeff : ''}${nonMetal}${nonMetalCoeff > 1 ? nonMetalCoeff : ''}O${(nonMetalCoeff * 2 + metalCoeff)}`];
        }
      },
      reactionType: "salt_formation",
      conditions: ["heating"]
    },
    
    // Amphoteric Oxide + Amphoteric Oxide -> No reaction in most cases
    [oxideCategories.AMPHOTERIC]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    
    // Amphoteric Oxide + Water -> No reaction in most cases
    "H2O": {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    }
  },
  
  [oxideCategories.ACIDIC]: {
    // Acidic Oxide + Water -> Acid (with exceptions like SiO2)
    "H2O": {
      possible: (oxide) => {
        const nonReactiveWithWater = ["SiO2"];
        return !nonReactiveWithWater.includes(oxide);
      },
      products: (oxide) => {
        return [getCorrespondingAcid(oxide)];
      },
      reactionType: "hydration",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Acidic Oxide + Base -> Salt + Water
    "base": {
      possible: true,
      products: (oxide, base) => {
        // Get the corresponding acid for this oxide
        const correspondingAcid = getCorrespondingAcid(oxide);
        if (!correspondingAcid) return null;
        
        // Extract the acid radical (anion) from the corresponding acid
        const anion = extractAcidRadical(correspondingAcid);
        
        // Extract the cation from the base
        const { cation } = extractIons(base);
        if (!anion || !cation) return null;
        
        // Build the salt using proper valence balancing
        const salt = balanceSaltFormula(cation, anion, base);
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Acidic Oxide + Basic Oxide -> Salt
    [oxideCategories.BASIC]: {
      possible: true,
      products: (acidicOxide, basicOxide) => {
        const nonMetal = extractMainElement(acidicOxide);
        const metal = extractMainElement(basicOxide);
        if (!nonMetal || !metal) return null;
        
        const nonMetalValence = Math.abs(getOxidationState(acidicOxide));
        const metalValence = getOxidationState(basicOxide);
        
        // Generate salt formula - similar to the other direction
        if (metalValence === 2 && nonMetalValence === 2) {
          return [`${metal}${nonMetal}O3`];
        } else if (metalValence === 1 && nonMetalValence === 2) {
          return [`${metal}2${nonMetal}O3`];
        } else {
          // Generic approach
          const lcm = leastCommonMultiple(metalValence, nonMetalValence);
          const metalCoeff = lcm / metalValence;
          const nonMetalCoeff = lcm / nonMetalValence;
          return [`${metal}${metalCoeff > 1 ? metalCoeff : ''}${nonMetal}${nonMetalCoeff > 1 ? nonMetalCoeff : ''}O${(nonMetalCoeff + metalCoeff)}`];
        }
      },
      reactionType: "oxide_combination",
      conditions: ["heating"]
    },
    
    // Acidic Oxide + Amphoteric Oxide -> Salt
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (acidicOxide, amphoOxide) => {
        const nonMetal = extractMainElement(acidicOxide);
        const metal = extractMainElement(amphoOxide);
        if (!nonMetal || !metal) return null;
        
        const nonMetalValence = Math.abs(getOxidationState(acidicOxide));
        const metalValence = getOxidationState(amphoOxide);
        
        // Generate salt formula
        if (metalValence === 3 && nonMetalValence === 2) {
          return [`${metal}2(${nonMetal}O4)3`];
        } else if (metalValence === 2 && nonMetalValence === 3) {
          return [`${metal}3(${nonMetal}O4)2`];
        } else {
          // Generic approach for other valence combinations
          const lcm = leastCommonMultiple(metalValence, nonMetalValence);
          const metalCoeff = lcm / metalValence;
          const nonMetalCoeff = lcm / nonMetalValence;
          return [`${metal}${metalCoeff > 1 ? metalCoeff : ''}(${nonMetal}O${Math.floor(nonMetalValence/2) + 2})${nonMetalCoeff > 1 ? nonMetalCoeff : ''}`];
        }
      },
      reactionType: "salt_formation",
      conditions: ["heating"]
    },
    
    // Acidic Oxide + Acidic Oxide -> No reaction in most cases
    [oxideCategories.ACIDIC]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    
    // Acidic Oxide + Indifferent Oxide -> Generally no reaction
    [oxideCategories.INDIFFERENT]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    }
  },
  
  [oxideCategories.INDIFFERENT]: {
    // Indifferent oxides generally don't react with other compounds
    "acid": {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    "base": {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    "H2O": {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    [oxideCategories.BASIC]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    [oxideCategories.ACIDIC]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    [oxideCategories.AMPHOTERIC]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    },
    [oxideCategories.INDIFFERENT]: {
      possible: false,
      products: () => null,
      reactionType: "no_reaction"
    }
  },
  
  [oxideCategories.PEROXIDE]: {
    // Peroxides have specific reaction patterns
    "acid": {
      possible: true,
      products: (peroxide, acid) => {
        // Peroxides with acids typically form hydrogen peroxide
        return ["H2O2", extractSalt(peroxide, acid)];
      },
      reactionType: "decomposition",
      conditions: ["room temperature", "aqueous"]
    },
    "H2O": {
      possible: true,
      products: (peroxide) => {
        // Metal peroxides with water typically form hydrogen peroxide and metal hydroxide
        const metal = extractMainElement(peroxide);
        if (!metal) return null;
        
        const metalValence = 1; // Most common peroxides are from Group 1/2
        if (metalValence === 1) {
          return [`${metal}OH`, "H2O2"];
        } else {
          return [`${metal}(OH)2`, "H2O2"];
        }
      },
      reactionType: "hydrolysis",
      conditions: ["room temperature", "aqueous"]
    },
    // Other reactions specific to peroxides...
  },
  
  [oxideCategories.SUPEROXIDE]: {
    // Superoxides have specific reaction patterns
    "H2O": {
      possible: true,
      products: (superoxide) => {
        // Superoxides with water typically form hydrogen peroxide, oxygen, and metal hydroxide
        const metal = extractMainElement(superoxide);
        if (!metal) return null;
        
        return [`${metal}OH`, "H2O2", "O2"];
      },
      reactionType: "decomposition",
      conditions: ["room temperature", "aqueous"]
    },
    // Other reactions specific to superoxides...
  }
};

//Determines if a reaction between two compounds is possible based on oxide reactivity rules
  export function canReact(compound1, compound2) {
    // Determine if either compound is an oxide
    const isCompound1Oxide = classifyOxide(compound1) !== null;
    const isCompound2Oxide = classifyOxide(compound2) !== null;
    
    // If neither is an oxide, this module can't determine reactivity
    if (!isCompound1Oxide && !isCompound2Oxide) {
      return false; 
    }
    
    // If one is an oxide and the other is water
    if (isCompound1Oxide && compound2 === "H2O") {
      const oxideType = classifyOxide(compound1);
      const possibleValue = oxideReactions[oxideType]["H2O"].possible;
      
      // Check if possible is a function and execute it if so
      if (typeof possibleValue === 'function') {
        return possibleValue(compound1);
      }
      return possibleValue;
    }
    
    if (isCompound2Oxide && compound1 === "H2O") {
      const oxideType = classifyOxide(compound2);
      const possibleValue = oxideReactions[oxideType]["H2O"].possible;
      
      // Check if possible is a function and execute it if so
      if (typeof possibleValue === 'function') {
        return possibleValue(compound2);
      }
      return possibleValue;
    }
    
    // If both are oxides
    if (isCompound1Oxide && isCompound2Oxide) {
      const oxide1Type = classifyOxide(compound1);
      const oxide2Type = classifyOxide(compound2);
      
      const possibleValue = oxideReactions[oxide1Type][oxide2Type].possible;
      // Check if possible is a function and execute it if so
      if (typeof possibleValue === 'function') {
        return possibleValue(compound1, compound2);
      }
      return possibleValue;
    }
    
      // Handle oxide + acid or base reactions
  if (isCompound1Oxide && !isCompound2Oxide) {
    const oxideType = classifyOxide(compound1);
    // Simple check if compound2 is an acid (contains H in front)
    if (compound2.startsWith("H") && !compound2.startsWith("H2O")) {
      const possibleValue = oxideReactions[oxideType]["acid"].possible;
      if (typeof possibleValue === 'function') {
        return possibleValue(compound1, compound2);
      }
      return possibleValue;
    }
    // Simple check if compound2 is a base (contains OH)
    if (compound2.includes("OH")) {
      const possibleValue = oxideReactions[oxideType]["base"].possible;
      if (typeof possibleValue === 'function') {
        return possibleValue(compound1, compound2);
      }
      return possibleValue;
    }
  }
  
  if (isCompound2Oxide && !isCompound1Oxide) {
    const oxideType = classifyOxide(compound2);
    // Simple check if compound1 is an acid (contains H in front)
    if (compound1.startsWith("H") && !compound1.startsWith("H2O")) {
      const possibleValue = oxideReactions[oxideType]["acid"].possible;
      if (typeof possibleValue === 'function') {
        return possibleValue(compound2, compound1);
      }
      return possibleValue;
    }
    // Simple check if compound1 is a base (contains OH)
    if (compound1.includes("OH")) {
      const possibleValue = oxideReactions[oxideType]["base"].possible;
      if (typeof possibleValue === 'function') {
        return possibleValue(compound2, compound1);
      }
      return possibleValue;
    }
  }
    
    return false;
  }

//Predicts the products of a reaction involving oxides
export function predictProducts(compound1, compound2) {
  // First check if the reaction is possible
  if (!canReact(compound1, compound2)) {
    return null;
  }
  
  // Determine which compound is the oxide (if any)
  const isCompound1Oxide = classifyOxide(compound1) !== null;
  const isCompound2Oxide = classifyOxide(compound2) !== null;
  
  // If one is an oxide and the other is water
  if (isCompound1Oxide && compound2 === "H2O") {
    const oxideType = classifyOxide(compound1);
    return oxideReactions[oxideType]["H2O"].products(compound1);
  }
  
  if (isCompound2Oxide && compound1 === "H2O") {
    const oxideType = classifyOxide(compound2);
    return oxideReactions[oxideType]["H2O"].products(compound2);
  }
  
  // If both are oxides
  if (isCompound1Oxide && isCompound2Oxide) {
    const oxide1Type = classifyOxide(compound1);
    const oxide2Type = classifyOxide(compound2);
    
    return oxideReactions[oxide1Type][oxide2Type].products(compound1, compound2);
  }
  
  // Handle oxide + acid or base reactions
  if (isCompound1Oxide && !isCompound2Oxide) {
    const oxideType = classifyOxide(compound1);
    // Simple check if compound2 is an acid (contains H in front)
    if (compound2.startsWith("H") && !compound2.startsWith("H2O")) {
      return oxideReactions[oxideType]["acid"].products(compound1, compound2);
    }
    // Simple check if compound2 is a base (contains OH)
    if (compound2.includes("OH")) {
      return oxideReactions[oxideType]["base"].products(compound1, compound2);
    }
  }
  
  if (isCompound2Oxide && !isCompound1Oxide) {
    const oxideType = classifyOxide(compound2);
    // Simple check if compound1 is an acid (contains H in front)
    if (compound1.startsWith("H") && !compound1.startsWith("H2O")) {
      return oxideReactions[oxideType]["acid"].products(compound2, compound1);
    }
    // Simple check if compound1 is a base (contains OH)
    if (compound1.includes("OH")) {
      return oxideReactions[oxideType]["base"].products(compound2, compound1);
    }
  }
  
  return null;
}

//Gets complete reaction information including products, type, and conditions
export function getReactionInfo(compound1, compound2) {
  // First check if the reaction is possible
  if (!canReact(compound1, compound2)) {
    return null;
  }
  
  // Determine which compound is the oxide (if any)
  const isCompound1Oxide = classifyOxide(compound1) !== null;
  const isCompound2Oxide = classifyOxide(compound2) !== null;
  
  let reactionData = null;
  
  // If one is an oxide and the other is water
  if (isCompound1Oxide && compound2 === "H2O") {
    const oxideType = classifyOxide(compound1);
    reactionData = oxideReactions[oxideType]["H2O"];
  } else if (isCompound2Oxide && compound1 === "H2O") {
    const oxideType = classifyOxide(compound2);
    reactionData = oxideReactions[oxideType]["H2O"];
  }
  // If both are oxides
  else if (isCompound1Oxide && isCompound2Oxide) {
    const oxide1Type = classifyOxide(compound1);
    const oxide2Type = classifyOxide(compound2);
    reactionData = oxideReactions[oxide1Type][oxide2Type];
  }
  // Handle oxide + acid or base reactions
  else if (isCompound1Oxide && !isCompound2Oxide) {
    const oxideType = classifyOxide(compound1);
    if (compound2.startsWith("H") && !compound2.startsWith("H2O")) {
      reactionData = oxideReactions[oxideType]["acid"];
    } else if (compound2.includes("OH")) {
      reactionData = oxideReactions[oxideType]["base"];
    }
  } else if (isCompound2Oxide && !isCompound1Oxide) {
    const oxideType = classifyOxide(compound2);
    if (compound1.startsWith("H") && !compound1.startsWith("H2O")) {
      reactionData = oxideReactions[oxideType]["acid"];
    } else if (compound1.includes("OH")) {
      reactionData = oxideReactions[oxideType]["base"];
    }
  }
  
  if (!reactionData) return null;
  
  // Get products
  let products = null;
  if (isCompound1Oxide && compound2 === "H2O") {
    products = reactionData.products(compound1);
  } else if (isCompound2Oxide && compound1 === "H2O") {
    products = reactionData.products(compound2);
  } else if (isCompound1Oxide && isCompound2Oxide) {
    products = reactionData.products(compound1, compound2);
  } else if (isCompound1Oxide && !isCompound2Oxide) {
    products = reactionData.products(compound1, compound2);
  } else if (isCompound2Oxide && !isCompound1Oxide) {
    products = reactionData.products(compound2, compound1);
  }
  
  return {
    products,
    reactionType: reactionData.reactionType,
    conditions: reactionData.conditions
  };
}

//Helper function to find the least common multiple of two numbers

function leastCommonMultiple(a, b) {
  return (a * b) / greatestCommonDivisor(a, b);
}

//Helper function to find the greatest common divisor of two numbers
function greatestCommonDivisor(a, b) {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

//Helper function to extract a salt formula from a reaction between an oxide and an acid

function extractSalt(oxide, acid) {
  const metal = extractMainElement(oxide);
  const { anion } = extractIons(acid);
  if (!metal || !anion) return null;
  
  const metalValence = getOxidationState(oxide);
  // Simplified salt formation
  if (metalValence === 1) {
    return `${metal}${anion}`;
  } else if (metalValence === 2) {
    return `${metal}${anion}2`;
  } else {
    return `${metal}${anion}${metalValence}`;
  }
}