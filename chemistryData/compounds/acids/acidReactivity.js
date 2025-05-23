import { acidCategories, classifyAcidByStrength, determineBasicity, determineAcidType, extractAcidRadical } from './acidTypes.js';
import { oxideCategories, classifyOxide } from '../oxides/oxideTypes.js';
import { extractIons } from '../../core/extractIons.js';
import { isMetal } from '../../core/elements.js';
import { isBase } from '../bases/baseTypes.js';
import { balanceSaltFormula, polyatomicIons, valenceOverrides } from '../../core/valences.js';
import { extractMetalFromOxide } from '../../core/utils.js';
import { extractSaltComponents } from '../salts/saltTypes.js';


const volatileAcidProducts = {
  CO3: ["H2O", "CO2"],
  HCO3: ["H2O", "CO2"],
  SO3: ["H2O", "SO2"],
  HSO3: ["H2O", "SO2"],
  S: ["H2S"],
  NO2: ["HNO2"]
};


/**
 * Reaction patterns for acids with different reactants
 * Each rule defines whether a reaction is possible and what products would form
 */
export const acidReactions = {
  [acidCategories.STRONG]: {
    // Strong Acid + Metal -> Salt + Hydrogen (for metals above hydrogen in activity series)
    "metal": {
      possible: (acid, metal) => {
        // Metals that don't react with acids (noble metals)
        const nobleMetals = ["Cu", "Ag", "Au", "Pt", "Hg"];
        return !nobleMetals.includes(metal);
      },
      products: (acid, metal) => {
        const radical = extractAcidRadical(acid);
        const basicity = determineBasicity(acid);
        
        // Determine the formula of the salt
        const salt = balanceSaltFormula(metal, radical, metal);
        console.log("Building salt from:", metal, "+", radical);
        console.log("→ Result:", salt);
        
        return [salt, "H2"];
      },
      reactionType: "single_replacement",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Acid + Basic Oxide -> Salt + Water
    [oxideCategories.BASIC]: {
      possible: true,
      products: (acid, oxide) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetalFromOxide(oxide);
        const basicity = determineBasicity(acid);
        
        // Generate salt formula
        const salt = balanceSaltFormula(metal, radical, oxide);
        console.log("Building salt from:", metal, "+", radical);
        console.log("→ Result:", salt);
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Acid + Base -> Salt + Water
    "base": {
      possible: true,
      products: (acid, base) => {
        const radical = extractAcidRadical(acid);
        let metal = null;

        if (valenceOverrides.polyatomicCationMatch[base]) {
          metal = valenceOverrides.polyatomicCationMatch[base];
        } else {
          metal = base.match(/^([A-Z][a-z]*)/) ? base.match(/^([A-Z][a-z]*)/)[1] : null;
        }
        const basicity = determineBasicity(acid);
        
        if (!metal || !radical) return null;
        
        // Generate salt formula
        const salt = balanceSaltFormula(metal, radical, base);
        console.log("Building salt from:", metal, "+", radical);
        console.log("→ Result:", salt);
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Acid + Amphoteric Oxide -> Salt + Water
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (acid, oxide) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetalFromOxide(oxide);
        const basicity = determineBasicity(acid);
        
        // Generate salt formula - similar to basic oxide reaction
        const salt = balanceSaltFormula(metal, radical, oxide);
        console.log("Building salt from:", metal, "+", radical);
        console.log("→ Result:", salt);
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Acid + Salt (with a more volatile acid) -> New salt + New acid
    "salt": {
      possible: (acid, salt) => {
        const { anion } = extractSaltComponents(salt);
        const normalizedAnion = anion?.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return volatileAcidProducts.hasOwnProperty(normalizedAnion);
      },

      products: (acid, salt) => {
        const radical = extractAcidRadical(acid);
        const { cation, anion } = extractSaltComponents(salt);
        
        const normalizedAnion = anion?.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const products = volatileAcidProducts[normalizedAnion];

        if (products) {
          return [`${cation}${radical}`, ...products];
        }

        return null;
      },
      reactionType: "double_replacement",
      conditions: ["room temperature", "aqueous"]
    }
  },
  
  [acidCategories.MODERATE]: {
    // Moderate Acid reactions are similar to strong acids but may be less complete
    // Most reactions are the same as strong acids
    "metal": {
      possible: (acid, metal) => {
        // Exclude noble metals and less reactive metals
        const nonReactiveMetals = ["Cu", "Ag", "Au", "Pt", "Hg"];
        return !nonReactiveMetals.includes(metal);
      },
      products: (acid, metal) => {
        // Same products as strong acid + metal
        return acidReactions[acidCategories.STRONG]["metal"].products(acid, metal);
      },
      reactionType: "single_replacement",
      conditions: ["room temperature", "aqueous"]
    },
    
    [oxideCategories.BASIC]: {
      possible: true,
      products: (acid, oxide) => {
        // Same products as strong acid + basic oxide
        return acidReactions[acidCategories.STRONG][oxideCategories.BASIC].products(acid, oxide);
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    "base": {
      possible: true,
      products: (acid, base) => {
        // Same products as strong acid + base
        return acidReactions[acidCategories.STRONG]["base"].products(acid, base);
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (acid, oxide) => {
        // Same products as strong acid + amphoteric oxide
        return acidReactions[acidCategories.STRONG][oxideCategories.AMPHOTERIC].products(acid, oxide);
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    "salt": {
      possible: (acid, salt) => {
        // More limited than strong acids
        const { anion } = extractIons(salt);
        const volatileAnions = ["CO3", "S"];
        return volatileAnions.includes(anion);
      },
      products: (acid, salt) => {
        // Similar to strong acids but more limited
        return acidReactions[acidCategories.STRONG]["salt"].products(acid, salt);
      },
      reactionType: "double_replacement",
      conditions: ["room temperature", "aqueous"]
    }
  },
  
  [acidCategories.WEAK]: {
    // Weak Acid + Metal -> Limited reactions with active metals only
    "metal": {
      possible: (acid, metal) => {
        // Only very active metals
        const reactiveMetals = ["Na", "K", "Li", "Ca", "Mg", "Al", "Zn", "Fe"];
        return reactiveMetals.includes(metal);
      },
      products: (acid, metal) => {
        // Same products as stronger acids, but reaction may be slower/incomplete
        return acidReactions[acidCategories.STRONG]["metal"].products(acid, metal);
      },
      reactionType: "single_replacement",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Acid + Basic Oxide -> Salt + Water (reaction may be slower/incomplete)
    [oxideCategories.BASIC]: {
      possible: true,
      products: (acid, oxide) => {
        return acidReactions[acidCategories.STRONG][oxideCategories.BASIC].products(acid, oxide);
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Acid + Base -> Salt + Water
    "base": {
      possible: true,
      products: (acid, base) => {
        return acidReactions[acidCategories.STRONG]["base"].products(acid, base);
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Acid + Amphoteric Oxide -> Limited reaction
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (acid, oxide) => {
        return acidReactions[acidCategories.STRONG][oxideCategories.AMPHOTERIC].products(acid, oxide);
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Decomposition reactions specific to certain weak acids
    "heat": {
      possible: (acid) => {
        // Specific acids that decompose with heat
        const decomposableAcids = ["H2SiO3", "HNO3", "H2S"];
        return decomposableAcids.includes(acid);
      },
      products: (acid) => {
        // Specific decomposition products based on the acid
        if (acid === "H2SiO3") {
          return ["H2O", "SiO2"];
        } else if (acid === "HNO3") {
          return ["NO2", "H2O", "O2"];
        } else if (acid === "H2S") {
          return ["H2", "S"];
        }
        return null;
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  },
  
  // Special reactions for concentrated strong acids with metals past hydrogen
  "concentrated": {
    "metal": {
      possible: (acid, metal) => {
        // Only applies to concentrated H2SO4 and HNO3 with specific metals
        if (acid !== "H2SO4" && acid !== "HNO3") return false;
        
        const reactiveMetals = ["Cu", "Ag", "Hg", "Pb"];
        return reactiveMetals.includes(metal);
      },
      products: (acid, metal) => {
        // Different products based on the acid and metal
        if (acid === "H2SO4") {
          // Concentrated H2SO4 + Cu → CuSO4 + SO2 + H2O
          return [`${metal}SO4`, "SO2", "H2O"];
        } else if (acid === "HNO3") {
          // Concentrated HNO3 + Cu → Cu(NO3)2 + NO2 + H2O
          return [`${metal}(NO3)2`, "NO2", "H2O"];
        }
        return null;
      },
      reactionType: "redox",
      conditions: ["concentrated acid", "heating"]
    }
  }
};

//Determines if a reaction involving an acid is possible
export function canReact(acid, reactant, isConcentrated = false) {
  // Handle special case for concentrated acids
  if (isConcentrated && 
      (acid === "H2SO4" || acid === "HNO3") && 
      isMetal(reactant)) {
    return acidReactions["concentrated"]["metal"].possible(acid, reactant);
  }
  
  // Determine the acid strength
  const acidStrength = classifyAcidByStrength(acid);
  
  // Check if reactant is a metal
  if (isMetal(reactant)) {
    return acidReactions[acidStrength]["metal"].possible(acid, reactant);
  }
  
  if (isBase(reactant)) {
    return acidReactions[acidStrength]["base"].possible;
  }

  const oxideType = classifyOxide(reactant);
  if (oxideType) {
    return acidReactions[acidStrength][oxideType]?.possible || false;
  }
  
  // Check for salt (simple detection - not comprehensive)
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !reactant.match(/^[A-Z][a-z]?$/)) { // Not a single element
    return acidReactions[acidStrength]["salt"]?.possible?.(acid, reactant) || false;
  }
  
  // For thermal decomposition (special case)
  if (reactant === "heat") {
    return acidReactions[acidStrength]["heat"]?.possible?.(acid) || false;
  }
  
  return false;
}

//Predicts the products of a reaction involving an acid
export function predictProducts(acid, reactant, isConcentrated = false) {
  // First check if the reaction is possible
  if (!canReact(acid, reactant, isConcentrated)) {
    return null;
  }
  
  // Handle special case for concentrated acids
  if (isConcentrated && 
      (acid === "H2SO4" || acid === "HNO3") && 
      isMetal(reactant)) {
    return acidReactions["concentrated"]["metal"].products(acid, reactant);
  }
  
  // Determine the acid strength
  const acidStrength = classifyAcidByStrength(acid);
  
  // Check if reactant is a metal
  if (isMetal(reactant)) {
    return acidReactions[acidStrength]["metal"].products(acid, reactant);
  }
  
  // Check if reactant is a base
  if (isBase(reactant)) {
    return acidReactions[acidStrength]["base"].products(acid, reactant);
  }

  // Check if reactant is an oxide
  const oxideType = classifyOxide(reactant);
  if (oxideType && acidReactions[acidStrength][oxideType]) {
    return acidReactions[acidStrength][oxideType].products(acid, reactant);
  }

  // Check for salt
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !reactant.match(/^[A-Z][a-z]?$/)) { // Not a single element
    if (acidReactions[acidStrength]["salt"] && 
        acidReactions[acidStrength]["salt"].possible(acid, reactant)) {
      return acidReactions[acidStrength]["salt"].products(acid, reactant);
    }
  }
  
  // For thermal decomposition
  if (reactant === "heat") {
    if (acidReactions[acidStrength]["heat"] && 
        acidReactions[acidStrength]["heat"].possible(acid)) {
      return acidReactions[acidStrength]["heat"].products(acid);
    }
  }
  
  return null;
}

// Gets information about a reaction involving an acid
export function getReactionInfo(acid, reactant, isConcentrated = false) {
  // First check if the reaction is possible
  if (!canReact(acid, reactant, isConcentrated)) {
    return null;
  }

  // Determine acid strength and reaction details
  let acidStrength = classifyAcidByStrength(acid);
  let reactantType;
  let reactionDetails;

  // Handle special case for concentrated acids
  if (
    isConcentrated &&
    (acid === "H2SO4" || acid === "HNO3") &&
    isMetal(reactant)
  ) {
    return {
      acidType: "concentrated " + acid,
      reactantType: "metal",
      reactionType: acidReactions["concentrated"]["metal"].reactionType,
      products: acidReactions["concentrated"]["metal"].products(acid, reactant),
      conditions: acidReactions["concentrated"]["metal"].conditions || [],
    };
  }

    // Check metal
  if (isMetal(reactant)) {
    reactantType = "metal";
    reactionDetails = acidReactions[acidStrength]["metal"];
  }

  // Check salt FIRST
  else if (
    acidReactions[acidStrength]["salt"] &&
    acidReactions[acidStrength]["salt"].possible(acid, reactant)
  ) {
    reactantType = "salt";
    reactionDetails = acidReactions[acidStrength]["salt"];
  }

  // Check base
  else if (isBase(reactant)) {
    reactantType = "base";
    reactionDetails = acidReactions[acidStrength]["base"];
  }

  // Check oxide
  if (!reactionDetails) {
    const oxideType = classifyOxide(reactant);
    if (oxideType) {
      reactantType = `${oxideType} oxide`;
      reactionDetails = acidReactions[acidStrength][oxideType];
    }
  }

  // For thermal decomposition
  if (reactant === "heat") {
    if (
      acidReactions[acidStrength]["heat"] &&
      acidReactions[acidStrength]["heat"].possible(acid)
    ) {
      reactantType = "heat";
      reactionDetails = acidReactions[acidStrength]["heat"];
    }
  }

  if (!reactionDetails) return null;

  return {
    acidType: acidStrength,
    reactantType,
    reactionType: reactionDetails.reactionType,
    products:
      reactantType === "heat"
        ? reactionDetails.products(acid)
        : reactionDetails.products(acid, reactant),
    conditions: reactionDetails.conditions || [],
  };
}
