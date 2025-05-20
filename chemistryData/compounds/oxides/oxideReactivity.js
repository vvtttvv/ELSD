import { oxideCategories, classifyOxide, extractMainElement, getOxidationState, getCorrespondingAcid, getCorrespondingHydroxide } from './oxideTypes.js';
import { extractIons } from '../../core/extractIons.js';
import { elementValences } from '../../core/valences.js';
import { solubilityTable } from '../../core/solubilityTable.js';
import { isMetal, isNonMetal } from '../../core/elements.js';

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
        
        const metalValence = getOxidationState(oxide);
        // Simplified salt formation - would need refinement for complex cases
        let salt;
        if (metalValence === 1) {
          salt = `${metal}${anion}`;
        } else {
          salt = `${metal}${anion}${metalValence}`;
        }
        
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
        const nonMetal = extractMainElement(acidicOxide);
        if (!metal || !nonMetal) return null;
        
        const metalValence = getOxidationState(basicOxide);
        const nonMetalValence = Math.abs(getOxidationState(acidicOxide));
        
        // Generate salt formula based on valences
        let salt;
        if (metalValence === 1 && nonMetalValence === 1) {
          salt = `${metal}${nonMetal}O2`;
        } else if (metalValence === 2 && nonMetalValence === 1) {
          salt = `${metal}(${nonMetal}O2)2`;
        } else if (metalValence === 1 && nonMetalValence === 2) {
          salt = `${metal}2${nonMetal}O3`;
        } else if (metalValence === 2 && nonMetalValence === 2) {
          salt = `${metal}${nonMetal}O3`;
        } else {
          // Generic approach for other cases
          const lcm = leastCommonMultiple(metalValence, nonMetalValence);
          const metalCoeff = lcm / metalValence;
          const nonMetalCoeff = lcm / nonMetalValence;
          salt = `${metal}${metalCoeff > 1 ? metalCoeff : ''}${nonMetal}${nonMetalCoeff > 1 ? nonMetalCoeff : ''}O${nonMetalCoeff + metalCoeff}`;
        }
        
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
        
        const metalValence = getOxidationState(oxide);
        // Generate salt formula
        let salt;
        if (metalValence === 1) {
          salt = `${metal}${anion}`;
        } else if (metalValence === 2) {
          salt = `${metal}${anion}2`;
        } else if (metalValence === 3) {
          salt = `${metal}${anion}3`;
        } else {
          salt = `${metal}${anion}${metalValence}`;
        }
        
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
        
        // Form complex salt like Na2ZnO2 from ZnO + 2NaOH
        const metalValence = getOxidationState(oxide);
        if (metalValence === 2) {
          return [`${cation}2${metal}O2`, "H2O"];
        } else if (metalValence === 3) {
          return [`${cation}3${metal}O3`, "H2O"];
        } else {
          return [`${cation}${metalValence}${metal}O${metalValence}`, "H2O"];
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
        const nonMetal = extractMainElement(oxide);
        const { cation } = extractIons(base);
        if (!nonMetal || !cation) return null;
        
        const cationValence = 1; // Assuming common bases like NaOH, KOH
        const nonMetalValence = Math.abs(getOxidationState(oxide));
        
        // Generate salt formula
        let salt;
        if (nonMetalValence === 1 && cationValence === 1) {
          salt = `${cation}${nonMetal}O2`;
        } else if (nonMetalValence === 2 && cationValence === 1) {
          salt = `${cation}2${nonMetal}O3`;
        } else if (nonMetalValence === 3 && cationValence === 1) {
          salt = `${cation}3${nonMetal}O4`;
        } else {
          // Generic approach
          const lcm = leastCommonMultiple(cationValence, nonMetalValence);
          const cationCoeff = lcm / cationValence;
          const nonMetalCoeff = lcm / nonMetalValence;
          salt = `${cation}${cationCoeff > 1 ? cationCoeff : ''}${nonMetal}${nonMetalCoeff > 1 ? nonMetalCoeff : ''}O${nonMetalCoeff + cationCoeff}`;
        }
        
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
    if (isCompound1Oxide) {
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
    
    if (isCompound2Oxide) {
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
  if (isCompound1Oxide) {
    const oxideType = classifyOxide(compound1);
    // Simple check if compound2 is an acid (contains H in front)
    if (compound2.startsWith("H")) {
      return oxideReactions[oxideType]["acid"].products(compound1, compound2);
    }
    // Simple check if compound2 is a base (contains OH)
    if (compound2.includes("OH")) {
      return oxideReactions[oxideType]["base"].products(compound1, compound2);
    }
  }
  
  if (isCompound2Oxide) {
    const oxideType = classifyOxide(compound2);
    // Simple check if compound1 is an acid (contains H in front)
    if (compound1.startsWith("H")) {
      return oxideReactions[oxideType]["acid"].products(compound2, compound1);
    }
    // Simple check if compound1 is a base (contains OH)
    if (compound1.includes("OH")) {
      return oxideReactions[oxideType]["base"].products(compound2, compound1);
    }
  }
  
  return null;
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