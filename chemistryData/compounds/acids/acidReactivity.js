import { acidCategories, classifyAcidByStrength, determineBasicity, determineAcidType, extractAcidRadical } from './acidTypes.js';
import { oxideCategories, classifyOxide } from '../oxides/oxideTypes.js';
import { extractIons, extractIonsWithOxidationState } from '../../core/extractIons.js';
import { isMetal } from '../../core/elements.js';
import { isBase, extractMetal, getHydroxideCount } from '../bases/baseTypes.js';
import { balanceSaltFormula, balanceSaltFormulaWithOxidationState, balanceSaltFormulaOrganic, polyatomicIons, valenceOverrides } from '../../core/valences.js';
import { extractMetalFromOxide, calculateMetalOxidationState } from '../../core/utils.js';
import { extractSaltComponents } from '../salts/saltTypes.js';


const volatileAcidProducts = {
  CO3: ["H2O", "CO2"],      // Carbonate -> Water + Carbon dioxide (H2CO3 decomposes immediately)
  HCO3: ["H2O", "CO2"],     // Bicarbonate -> Water + Carbon dioxide
  SO3: ["H2O", "SO2"],      // Sulfite -> Water + Sulfur dioxide (H2SO3 decomposes)
  HSO3: ["H2O", "SO2"],     // Bisulfite -> Water + Sulfur dioxide
  S: ["H2S"],               // Sulfide -> Hydrogen sulfide
  NO2: ["HNO2"]             // Nitrite -> Nitrous acid
};

/**
 * Extracts the metal oxidation state from a base formula by counting hydroxide groups
 * @param {string} base - The base formula (e.g., "Fe(OH)3")
 * @returns {number|null} - The oxidation state of the metal, or null if not determinable
 */
function extractMetalOxidationStateFromBase(base) {
  if (!isBase(base)) return null;
  
  const hydroxideCount = getHydroxideCount(base);
  if (hydroxideCount > 0) {
    return hydroxideCount; // Each OH⁻ neutralizes one positive charge
  }
  
  return null;
}


/**
 * Reaction patterns for acids with different reactants
 * Each rule defines whether a reaction is possible and what products would form
 */
export const acidReactions = {
  [acidCategories.STRONG]: {
    // Strong Acid + Metal -> Salt + H2
    "metal": {
      possible: (acid, metal) => {
        // Activity series check - metals above hydrogen can react
        const activitySeries = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "H", "Cu", "Ag", "Au"];
        const metalIndex = activitySeries.indexOf(metal);
        const hydrogenIndex = activitySeries.indexOf("H");
        
        return metalIndex >= 0 && metalIndex < hydrogenIndex;
      },
      products: (acid, metal) => {
        const radical = extractAcidRadical(acid);
        if (!radical) return null;
        
        // Use organic salt balancing for better handling
        const salt = balanceSaltFormulaOrganic(metal, radical, metal);
        return [salt, "H2"];
      },
      reactionType: "single_replacement",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Acid + Base -> Salt + Water
    "base": {
      possible: true,
      products: (acid, base) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetal(base);
        if (!radical || !metal) return null;
        
        // Extract the metal oxidation state from the base formula
        const metalOxidationState = extractMetalOxidationStateFromBase(base);
        
        let salt;
        if (metalOxidationState) {
          // Use the specific oxidation state from the base
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          // Fallback to organic salt balancing
          salt = balanceSaltFormulaOrganic(metal, radical);
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Acid + Basic Oxide -> Salt + Water
    [oxideCategories.BASIC]: {
      possible: true,
      products: (acid, basicOxide) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetalFromOxide(basicOxide);
        if (!radical || !metal) return null;
        
        // Calculate the metal oxidation state from the oxide
        const metalOxidationState = calculateMetalOxidationState(basicOxide);
        
        let salt;
        if (metalOxidationState) {
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          salt = balanceSaltFormula(metal, radical);
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Acid + Amphoteric Oxide -> Salt + Water
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (acid, amphoOxide) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetalFromOxide(amphoOxide);
        if (!radical || !metal) return null;
        
        // Calculate the metal oxidation state from the oxide
        const metalOxidationState = calculateMetalOxidationState(amphoOxide);
        
        let salt;
        if (metalOxidationState) {
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          salt = balanceSaltFormula(metal, radical);
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Acid + Salt -> New acid + New salt (if the new acid is more volatile)
    "salt": {
      possible: (acid, salt) => {
        const { anion } = extractSaltComponents(salt);
        const volatileAnions = ["CO3", "HCO3", "SO3", "S", "NO2"];
        return volatileAnions.includes(anion);
      },
      products: (acid, salt) => {
        const { cation, anion } = extractSaltComponents(salt);
        const acidRadical = extractAcidRadical(acid);
        
        if (!cation || !anion || !acidRadical) return null;
        
        // Form new salt
        const newSalt = balanceSaltFormula(cation, acidRadical);
        
        // Different volatile acid products depending on the anion
        const volatileProducts = volatileAcidProducts[anion];
        if (volatileProducts) {
          return [newSalt, ...volatileProducts];
        }
        
        return null;
      },
      reactionType: "double_replacement",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Thermal decomposition reactions for strong acids
    "heat": {
      possible: (acid) => {
        // Strong acids that can decompose with heat
        const decomposableStrongAcids = [
          "HNO3", "H2SO4", "HClO4", "HClO3"
        ];
        return decomposableStrongAcids.includes(acid);
      },
      products: (acid) => {
        if (acid === "HNO3") {
          return ["NO2", "H2O", "O2"];
        } else if (acid === "H2SO4") {
          return ["H2O", "SO3"];  // Sulfuric acid (very high temp)
        } else if (acid === "HClO4") {
          return ["HClO3", "O2"]; // Perchloric acid
        } else if (acid === "HClO3") {
          return ["HClO", "O2"];  // Chloric acid
        }
        return null;
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  },
  
  [acidCategories.MODERATE]: {
    // Moderate Acid + Metal -> Salt + H2 (similar to strong acids but slower)
    "metal": {
      possible: (acid, metal) => {
        // Activity series check - metals above hydrogen can react
        const activitySeries = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "H", "Cu", "Ag", "Au"];
        const metalIndex = activitySeries.indexOf(metal);
        const hydrogenIndex = activitySeries.indexOf("H");
        
        return metalIndex >= 0 && metalIndex < hydrogenIndex;
      },
      products: (acid, metal) => {
        const radical = extractAcidRadical(acid);
        if (!radical) return null;
        
        const salt = balanceSaltFormula(metal, radical);
        return [salt, "H2"];
      },
      reactionType: "single_replacement",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Moderate Acid + Base -> Salt + Water
    "base": {
      possible: true,
      products: (acid, base) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetal(base);
        if (!radical || !metal) return null;
        
        // Extract the metal oxidation state from the base formula
        const metalOxidationState = extractMetalOxidationStateFromBase(base);
        
        let salt;
        if (metalOxidationState) {
          // Use the specific oxidation state from the base
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          // Fallback to organic salt balancing
          salt = balanceSaltFormulaOrganic(metal, radical);
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Moderate Acid + Basic Oxide -> Salt + Water
    [oxideCategories.BASIC]: {
      possible: true,
      products: (acid, basicOxide) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetalFromOxide(basicOxide);
        if (!radical || !metal) return null;
        
        // Calculate the metal oxidation state from the oxide
        const metalOxidationState = calculateMetalOxidationState(basicOxide);
        
        let salt;
        if (metalOxidationState) {
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          salt = balanceSaltFormula(metal, radical);
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Moderate Acid + Amphoteric Oxide -> Salt + Water
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (acid, amphoOxide) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetalFromOxide(amphoOxide);
        if (!radical || !metal) return null;
        
        // Calculate the metal oxidation state from the oxide
        const metalOxidationState = calculateMetalOxidationState(amphoOxide);
        
        let salt;
        if (metalOxidationState) {
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          salt = balanceSaltFormula(metal, radical);
        }
        
        return [salt, "H2O"];
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
    },
    
    // Thermal decomposition reactions for moderate acids
    "heat": {
      possible: (acid) => {
        // Moderate acids that can decompose with heat
        const decomposableModeateAcids = [
          "H3PO4", "H2SO3", "HNO2", "H3BO3"
        ];
        return decomposableModeateAcids.includes(acid);
      },
      products: (acid) => {
        if (acid === "H3PO4") {
          return ["H2O", "P2O5"]; // Phosphoric acid (high temp)
        } else if (acid === "H2SO3") {
          return ["H2O", "SO2"];  // Sulfurous acid (unstable)
        } else if (acid === "HNO2") {
          return ["NO", "H2O", "O2"]; // Nitrous acid
        } else if (acid === "H3BO3") {
          return ["H2O", "B2O3"]; // Boric acid
        }
        return null;
      },
      reactionType: "decomposition",
      conditions: ["heating"]
    }
  },
  
  [acidCategories.WEAK]: {
    // Weak Acid + Metal -> Salt + H2 (only with very reactive metals)
    "metal": {
      possible: (acid, metal) => {
        // Only very reactive metals can react with weak acids
        const veryReactiveMetals = ["K", "Na", "Ca", "Mg", "Al", "Zn"];
        return veryReactiveMetals.includes(metal);
      },
      products: (acid, metal) => {
        // Delegate to strong acid implementation
        return acidReactions[acidCategories.STRONG]["metal"].products(acid, metal);
      },
      reactionType: "single_replacement",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Acid + Base -> Salt + Water
    "base": {
      possible: true,
      products: (acid, base) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetal(base);
        if (!radical || !metal) return null;
        
        // Extract the metal oxidation state from the base formula
        const metalOxidationState = extractMetalOxidationStateFromBase(base);
        
        let salt;
        if (metalOxidationState) {
          // Use the specific oxidation state from the base
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          // Fallback to organic salt balancing
          salt = balanceSaltFormulaOrganic(metal, radical);
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Acid + Basic Oxide -> Salt + Water
    [oxideCategories.BASIC]: {
      possible: true,
      products: (acid, basicOxide) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetalFromOxide(basicOxide);
        if (!radical || !metal) return null;
        
        // Calculate the metal oxidation state from the oxide
        const metalOxidationState = calculateMetalOxidationState(basicOxide);
        
        let salt;
        if (metalOxidationState) {
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          salt = balanceSaltFormula(metal, radical);
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Acid + Amphoteric Oxide -> Salt + Water
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (acid, amphoOxide) => {
        const radical = extractAcidRadical(acid);
        const metal = extractMetalFromOxide(amphoOxide);
        if (!radical || !metal) return null;
        
        // Calculate the metal oxidation state from the oxide
        const metalOxidationState = calculateMetalOxidationState(amphoOxide);
        
        let salt;
        if (metalOxidationState) {
          salt = balanceSaltFormulaWithOxidationState(metal, radical, metalOxidationState);
        } else {
          salt = balanceSaltFormula(metal, radical);
        }
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Acid + Salt -> New acid + New salt (limited reactions)
    "salt": {
      possible: (acid, salt) => {
        // Very limited reactions for weak acids
        const { anion } = extractSaltComponents(salt);
        const volatileAnions = ["CO3", "HCO3", "SO3", "S"];
        return volatileAnions.includes(anion);
      },
      products: (acid, salt) => {
        const { cation, anion } = extractSaltComponents(salt);
        const acidRadical = extractAcidRadical(acid);
        
        if (!cation || !anion || !acidRadical) return null;
        
        // Form new salt
        const newSalt = balanceSaltFormula(cation, acidRadical);
        
        // Different volatile acid products depending on the anion
        const volatileProducts = volatileAcidProducts[anion];
        if (volatileProducts) {
          return [newSalt, ...volatileProducts];
        }
        
        return null;
      },
      reactionType: "double_replacement",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Decomposition reactions specific to certain weak acids
    "heat": {
      possible: (acid) => {
        // Specific acids that decompose with heat
        const decomposableAcids = [
          // Currently supported
          "H2SiO3", "HNO3", "H2S",
          // Adding more common decomposable acids
          "H2CO3", "H2SO3", "H3PO4", "H2SO4", 
          "HCOOH", "CH3COOH", "H2C2O4", "HClO4",
          "HNO2", "HClO3", "H3BO3"
        ];
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
        // Adding new decomposition reactions
        else if (acid === "H2CO3") {
          return ["H2O", "CO2"];  // Carbonic acid (unstable)
        } else if (acid === "H2SO3") {
          return ["H2O", "SO2"];  // Sulfurous acid (unstable)
        } else if (acid === "H3PO4") {
          return ["H2O", "P2O5"]; // Phosphoric acid (high temp)
        } else if (acid === "H2SO4") {
          return ["H2O", "SO3"];  // Sulfuric acid (very high temp)
        } else if (acid === "HCOOH") {
          return ["H2O", "CO"];   // Formic acid
        } else if (acid === "CH3COOH") {
          return ["CH4", "CO2"];  // Acetic acid (dry distillation)
        } else if (acid === "H2C2O4") {
          return ["H2O", "CO", "CO2"]; // Oxalic acid
        } else if (acid === "HClO4") {
          return ["HClO3", "O2"]; // Perchloric acid
        } else if (acid === "HNO2") {
          return ["NO", "H2O", "O2"]; // Nitrous acid
        } else if (acid === "HClO3") {
          return ["HClO", "O2"];  // Chloric acid
        } else if (acid === "H3BO3") {
          return ["H2O", "B2O3"]; // Boric acid
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
          // Concentrated H2SO4 + Metal → Metal sulfate + SO2 + H2O
          // Need to balance the salt formula properly
          const salt = balanceSaltFormulaOrganic(metal, "SO4");
          console.log("Building concentrated acid salt:", metal, "+ SO4 →", salt);
          return [salt, "SO2", "H2O"];
        } else if (acid === "HNO3") {
          // Concentrated HNO3 + Metal → Metal nitrate + NO2 + H2O
          const salt = balanceSaltFormulaOrganic(metal, "NO3");
          console.log("Building concentrated acid salt:", metal, "+ NO3 →", salt);
          return [salt, "NO2", "H2O"];
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

  // Check base FIRST (before salt, since bases can be misidentified as salts)
  else if (isBase(reactant)) {
    reactantType = "base";
    reactionDetails = acidReactions[acidStrength]["base"];
  }

  // Check salt
  else if (
    acidReactions[acidStrength]["salt"] &&
    acidReactions[acidStrength]["salt"].possible(acid, reactant)
  ) {
    reactantType = "salt";
    reactionDetails = acidReactions[acidStrength]["salt"];
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
