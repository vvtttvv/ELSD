import { baseCategories, classifyBaseByStrength, classifyBaseBySolubility, isAmphotericBase, extractMetal, getHydroxideCount } from './baseTypes.js';
import { classifyOxide, oxideCategories, getCorrespondingAcid, extractMainElement } from '../oxides/oxideTypes.js';
import { extractIons, extractIonsWithOxidationState } from '../../core/extractIons.js';
import { elementValences } from '../../core/valences.js';
import { solubilityTable } from '../../core/solubilityTable.js';
import { balanceSaltFormula, balanceSaltFormulaOrganic, balanceSaltFormulaWithOxidationState } from '../../core/valences.js';
import { extractAcidRadical } from '../acids/acidTypes.js';


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
        const salt = balanceSaltFormulaOrganic(metal, anion);
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Base + Acidic Oxide -> Salt + Water
    [oxideCategories.ACIDIC]: {
      possible: true,
      products: (base, acidicOxide) => {
        // Get the corresponding acid for this oxide
        const correspondingAcid = getCorrespondingAcid(acidicOxide);
        if (!correspondingAcid) return null;
        
        // Extract the acid radical (anion) from the corresponding acid
        const anion = extractAcidRadical(correspondingAcid);
        
        // Extract the metal from the base
        const metal = extractMetal(base);
        if (!anion || !metal) return null;
        
        // Build the salt using proper valence balancing
        const salt = balanceSaltFormula(metal, anion, base);
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Strong Base + Amphoteric Oxide -> Complex Salt + Water
    [oxideCategories.AMPHOTERIC]: {
      possible: true,
      products: (base, amphoOxide) => {
        const metal = extractMetal(base);
        const amphoMetal = extractMainElement(amphoOxide);  // Use extractMainElement for oxides
        if (!metal || !amphoMetal) return null;
        
        // Stoichiometry depends on the amphoteric metal, not the base:
        // Al2O3 + 2NaOH → 2NaAlO2 + H2O (Al forms 1:1 with alkali metal)
        // ZnO + 2NaOH → Na2ZnO2 + H2O (Zn forms 2:1 with alkali metal)
        if (amphoMetal === "Al") {
          return [`${metal}${amphoMetal}O2`, "H2O"];
        } else if (amphoMetal === "Zn") {
          return [`${metal}2${amphoMetal}O2`, "H2O"];
        } else {
          // For other amphoteric metals, use 1:1 ratio as default
          return [`${metal}${amphoMetal}O2`, "H2O"];
        }
      },
      reactionType: "complex_formation",
      conditions: ["room temperature", "aqueous", "excess base"]
    },
    
    // Strong Base + Amphoteric Hydroxide -> Complex Salt + Water
    "amphoteric_hydroxide": {
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
        const ionInfo = extractIonsWithOxidationState(salt);
        const { cation, anion, cationOxidationState } = ionInfo;
        const baseMetalIon = extractMetal(base);
        if (!cation || !anion || !baseMetalIon) return null;

        const newSalt = balanceSaltFormula(baseMetalIon, anion);
        
        // Use oxidation state to form the correct hydroxide
        let precipitate;
        if (cationOxidationState) {
          precipitate = balanceSaltFormulaWithOxidationState(cation, "OH", cationOxidationState);
        } else {
          precipitate = balanceSaltFormula(cation, "OH");
        }

        return [precipitate, newSalt];
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
        const salt = balanceSaltFormulaOrganic(metal, anion);
        
        return [salt, "H2O"];
      },
      reactionType: "neutralization",
      conditions: ["room temperature", "aqueous"]
    },
    
    // Weak Base + Acidic Oxide -> Limited reaction
    [oxideCategories.ACIDIC]: {
      possible: true,
      products: (base, acidicOxide) => {
        // Get the corresponding acid for this oxide
        const correspondingAcid = getCorrespondingAcid(acidicOxide);
        if (!correspondingAcid) return null;
        
        // Extract the acid radical (anion) from the corresponding acid
        const anion = extractAcidRadical(correspondingAcid);
        
        // Extract the metal from the base
        const metal = extractMetal(base);
        if (!anion || !metal) return null;
        
        // Build the salt using proper valence balancing
        const salt = balanceSaltFormula(metal, anion, base);
        
        return [salt, "H2O"];
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
        const salt = balanceSaltFormulaOrganic(metal, anion);
        
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
        // ZnO + 2NaOH → Na2ZnO2 + H2O (but for simple cases, usually NaAlO2)
        
        // For most common cases, forms simple aluminates/zincates
        // Al(OH)3 + NaOH → NaAlO2 + 2H2O
        // Zn(OH)2 + 2NaOH → Na2ZnO2 + 2H2O  
        
        const amphoOxidationState = getHydroxideCount(amphoBase) || 3; // Default to 3 for Al
        
        // Simple stoichiometry: 1 alkali metal per 1 amphoteric metal for Al, 2 for Zn
        if (amphoMetal === "Al") {
          return [`${alkaliMetal}${amphoMetal}O2`, "H2O"];
        } else if (amphoMetal === "Zn") {
          return [`${alkaliMetal}2${amphoMetal}O2`, "H2O"];
        } else {
          // General case
          return [`${alkaliMetal}${amphoMetal}O2`, "H2O"];
        }
      },
      reactionType: "complex_formation",
      conditions: ["room temperature", "aqueous", "excess base"]
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
  if ((reactant.startsWith('H') && !reactant.startsWith('H2O')) || 
      reactant.includes('COOH')) {  // Include organic acids
    return baseReactions[baseStrength]["acid"].possible;
  }
  
  // Check if reactant is an oxide
  const oxideType = classifyOxide(reactant);
  if (oxideType && reactant.includes("O")) {  // Only match true oxides
    return baseReactions[baseStrength][oxideType]?.possible || false;
  }

  
  // Check if reactant is another base (for amphoteric reactions)
  if (reactant.includes('OH')) {
    const reactantStrength = classifyBaseByStrength(reactant);
    const isReactantAmphoteric = isAmphotericBase(reactant);
    const isBaseAmphoteric = isAmphotericBase(base);
    
    // Strong base + amphoteric hydroxide
    if (isReactantAmphoteric && baseStrength === baseCategories.STRONG) {
      return baseReactions[baseStrength]["amphoteric_hydroxide"].possible;
    }
    
    // Amphoteric base + strong base - explicit check
    if (isBaseAmphoteric && reactantStrength === baseCategories.STRONG) {
      // Direct check for amphoteric base + strong base reactions
      return true; // These reactions are always possible
    }
    
    return false;
  }
  
  // Check for salt (improved detection)
  // A salt typically has a metal cation + anion, doesn't start with H, and doesn't contain OH
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      reactant.match(/[A-Z][a-z]?.*[A-Z]/) && !reactant.includes("O2")) {  // Exclude oxides
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
  if ((reactant.startsWith('H') && !reactant.startsWith('H2O')) || 
      reactant.includes('COOH')) {  // Include organic acids
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
    const isReactantAmphoteric = isAmphotericBase(reactant);
    const isBaseAmphoteric = isAmphotericBase(base);
    
    // Strong base + amphoteric hydroxide
    if (isReactantAmphoteric && baseStrength === baseCategories.STRONG) {
      return baseReactions[baseStrength]["amphoteric_hydroxide"].products(base, reactant);
    }
    
    // Amphoteric base + strong base - explicit implementation
    if (isBaseAmphoteric && reactantStrength === baseCategories.STRONG) {
      const amphoMetal = extractMetal(base);
      const alkaliMetal = extractMetal(reactant);
      if (!amphoMetal || !alkaliMetal) return null;
      
      // Al(OH)3 + NaOH → NaAlO2 + H2O
      // Zn(OH)2 + 2NaOH → Na2ZnO2 + H2O
      if (amphoMetal === "Al") {
        return [`${alkaliMetal}${amphoMetal}O2`, "H2O"];
      } else if (amphoMetal === "Zn") {
        return [`${alkaliMetal}2${amphoMetal}O2`, "H2O"];
      } else if (amphoMetal === "Be") {
        return [`${alkaliMetal}2${amphoMetal}O2`, "H2O"];
      } else {
        // General case - use 1:1 ratio
        return [`${alkaliMetal}${amphoMetal}O2`, "H2O"];
      }
    }
    
    return null;
  }
  
  // Check for salt
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      reactant.match(/[A-Z][a-z]?.*[A-Z]/) && !reactant.includes("O2")) {  // Exclude oxides
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
  if ((reactant.startsWith('H') && !reactant.startsWith('H2O')) || 
      reactant.includes('COOH')) {  // Include organic acids
    reactantType = "acid";
    reactionDetails = baseReactions[baseStrength]["acid"];
  }
  
  // Check if reactant is another base FIRST (before checking oxides)
  if (!reactantType && reactant.includes('OH')) {
    const reactantStrength = classifyBaseByStrength(reactant);
    const isReactantAmphoteric = isAmphotericBase(reactant);
    const isBaseAmphoteric = isAmphotericBase(base);
    
    // Strong base + amphoteric hydroxide
    if (isReactantAmphoteric && baseStrength === baseCategories.STRONG) {
      reactantType = "amphoteric hydroxide";
      reactionDetails = baseReactions[baseStrength]["amphoteric_hydroxide"];
    } 
    // Amphoteric base + strong base - explicit implementation
    else if (isBaseAmphoteric && reactantStrength === baseCategories.STRONG) {
      reactantType = "strong base";
      // Create explicit reaction details
      const amphoMetal = extractMetal(base);
      const alkaliMetal = extractMetal(reactant);
      if (!amphoMetal || !alkaliMetal) return null;
      
      let products;
      if (amphoMetal === "Al") {
        products = [`${alkaliMetal}${amphoMetal}O2`, "H2O"];
      } else if (amphoMetal === "Zn") {
        products = [`${alkaliMetal}2${amphoMetal}O2`, "H2O"];
      } else if (amphoMetal === "Be") {
        products = [`${alkaliMetal}2${amphoMetal}O2`, "H2O"];
      } else {
        products = [`${alkaliMetal}${amphoMetal}O2`, "H2O"];
      }
      
      return {
        baseType: baseStrength,
        reactantType,
        reactionType: "complex_formation",
        products: products,
        conditions: ["room temperature", "aqueous", "excess base"]
      };
    } 
    else {
      return null; // No reaction between other base combinations
    }
  }
  
  // Check if reactant is an oxide (check before salts for true oxides)
  if (!reactantType) {
    const oxideType = classifyOxide(reactant);
    if (oxideType && reactant.includes("O") && !reactant.includes("OH")) {  // Only true oxides (not hydroxides)
      reactantType = `${oxideType} oxide`;
      reactionDetails = baseReactions[baseStrength][oxideType];
    }
  }
  
  // Check for salt (only if not an oxide)
  if (!reactant.startsWith('H') && !reactant.includes('OH') && 
      !reactantType && reactant.match(/[A-Z][a-z]?.*[A-Z]/) && !reactant.includes("O2")) {  // Exclude oxides
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