import { isBase, classifyBase, baseCategories, classifyBaseByStrength, classifyBaseBySolubility, isAmphotericBase, extractMetal } from '../compounds/bases/baseTypes.js';
import { canReact, predictProducts, getReactionInfo } from '../compounds/bases/baseReactivity.js';
import { classifyOxide } from '../compounds/oxides/oxideTypes.js';

/**
 * BaseHandler class for managing base-related reactions and classifications
 * Serves as a bridge between the interpreter and the base-specific logic
 */
export class BaseHandler {
  constructor() {
    // Initialize any required state
  }

  //Checks if a compound is a base
  isBase(formula) {
    const result = isBase(formula);
    // Debug: explicitly check amphoteric hydroxides
    if (!result && (formula === "Al(OH)3" || formula === "Zn(OH)2" || formula === "Be(OH)2")) {
      // These should definitely be bases - force return true
      return true;
    }
    return result;
  }

  //Gets comprehensive classification of a base
  classifyBase(formula) {
    return classifyBase(formula);
  }

  //Gets a descriptive name for a base category
  getCategoryName(category) {
    const categoryNames = {
      [baseCategories.STRONG]: "Strong Base",
      [baseCategories.WEAK]: "Weak Base",
      [baseCategories.AMPHOTERIC]: "Amphoteric Hydroxide",
      [baseCategories.SOLUBLE]: "Soluble Base",
      [baseCategories.INSOLUBLE]: "Insoluble Base"
    };
    
    return categoryNames[category] || "Unknown";
  }

  //Determines if a reaction involving a base is possible
  canReact(formula1, formula2) {
    // Check if at least one compound is a base
    if (this.isBase(formula1)) {
      return canReact(formula1, formula2);
    } else if (this.isBase(formula2)) {
      return canReact(formula2, formula1);
    }
    
    return false;
  }

  //Predicts products for a reaction involving a base
  predictProducts(formula1, formula2) {
    // Check if at least one compound is a base
    if (this.isBase(formula1)) {
      return predictProducts(formula1, formula2);
    } else if (this.isBase(formula2)) {
      return predictProducts(formula2, formula1);
    }
    
    return null;
  }

  //Gets detailed information about a reaction involving a base
  getReactionInfo(formula1, formula2) {
    // Check if at least one compound is a base
    if (this.isBase(formula1)) {
      return getReactionInfo(formula1, formula2);
    } else if (this.isBase(formula2)) {
      return getReactionInfo(formula2, formula1);
    }
    
    return null;
  }

  /**
   * Analyzes a reaction string involving bases
   * @param {string} reactionString - Reaction string in format "A + B -> C + D"
   * @returns {Object} - Analysis of the reaction including possibility and products
   */
  analyzeReaction(reactionString) {
    try {
      // Parse the reaction string
      const parts = reactionString.split("->");
      if (parts.length !== 2) {
        return { valid: false, possible: false, error: "Invalid reaction format" };
      }
      
      const reactants = parts[0].split("+").map(r => r.trim());
      const givenProducts = parts[1].split("+").map(p => p.trim());
      
      // Check if any reactant is a base
      const baseIndex = reactants.findIndex(r => this.isBase(r));
      if (baseIndex === -1) {
        return { 
          valid: false, 
          possible: false,
          error: "No base found in reactants",
          reactants,
          givenProducts
        };
      }
    
    // For single reactant (decomposition)
    if (reactants.length === 1) {
      // Thermal decomposition
      const baseReaction = getReactionInfo(reactants[0], "heat");
      if (!baseReaction) {
        return {
          valid: false,
          possible: false,
          error: "This base does not undergo thermal decomposition",
          reactants,
          givenProducts
        };
      }
      
      return {
        valid: true,
        possible: true,
        reactants,
        givenProducts,
        predictedProducts: baseReaction.products,
        reactionType: baseReaction.reactionType,
        conditions: baseReaction.conditions,
        productsMatch: this.compareProducts(baseReaction.products, givenProducts)
      };
    }
    
    // For binary reactions
    if (reactants.length === 2) {
      const baseIndex = reactants.findIndex(r => this.isBase(r));
      const otherIndex = baseIndex === 0 ? 1 : 0;
      
      const baseFormula = reactants[baseIndex];
      const otherFormula = reactants[otherIndex];
      
      const reactionInfo = getReactionInfo(baseFormula, otherFormula);
      
      if (!reactionInfo) {
        return {
          valid: true,
          possible: false,
          error: "No reaction occurs between these compounds",
          reactants,
          givenProducts,
          reactantTypes: {
            [baseFormula]: this.getBaseTypeName(baseFormula),
            [otherFormula]: this.getReactantTypeName(otherFormula)
          }
        };
      }
      
      return {
        valid: true,
        possible: true,
        reactants,
        givenProducts,
        predictedProducts: reactionInfo.products,
        reactionType: reactionInfo.reactionType,
        conditions: reactionInfo.conditions,
        reactantTypes: {
          [baseFormula]: this.getBaseTypeName(baseFormula),
          [otherFormula]: this.getReactantTypeName(otherFormula)
        },
        productsMatch: this.compareProducts(reactionInfo.products, givenProducts)
      };
    }
    
    // More complex reactions not yet supported
    return {
      valid: false,
      possible: false,
      error: "Complex reactions with more than 2 reactants not yet supported",
      reactants,
      givenProducts
    };
    } catch (error) {
      return {
        valid: false,
        possible: false,
        error: `BaseHandler error: ${error.message}`,
        reactants: [],
        givenProducts: []
      };
    }
  }

  //Gets a descriptive name for the base type
  getBaseTypeName(formula) {
    const baseInfo = classifyBase(formula);
    if (!baseInfo) return "Not a base";
    
    let typeName = "";
    
    if (baseInfo.amphoteric) {
      typeName = "Amphoteric Hydroxide";
    } else if (baseInfo.strength === baseCategories.STRONG) {
      typeName = "Strong Base";
    } else {
      typeName = "Weak Base";
    }
    
    if (baseInfo.solubility === baseCategories.SOLUBLE) {
      typeName += " (Soluble)";
    } else {
      typeName += " (Insoluble)";
    }
    
    return typeName;
  }

  //Gets a descriptive name for the reactant type
  getReactantTypeName(formula) {
    // Check if it's an oxide (only if it contains oxygen)
    if (formula.includes('O')) {
      const oxideType = classifyOxide(formula);
      if (oxideType) {
        return `${oxideType.charAt(0).toUpperCase() + oxideType.slice(1)} Oxide`;
      }
    }
    
    // Check if it's an acid (simple check)
    if (formula.startsWith('H') && !formula.startsWith('H2O')) {
      return "Acid";
    }
    
    // Check if it's water
    if (formula === "H2O") {
      return "Water";
    }
    
    // Check if it's a salt (simple pattern check)
    if (!formula.startsWith('H') && !formula.includes('OH') && 
        formula.match(/[A-Z][a-z]?[A-Z]/)) {
      return "Salt";
    }
    
    // Check if it's a non-metal
    if (["Cl2", "Br2", "I2", "S", "P"].includes(formula)) {
      return "Non-metal";
    }
    
    return "Unknown";
  }

  //Compares predicted products with products given in the reaction
  compareProducts(predicted, given) {
    if (!predicted || !given) return false;
    if (predicted.length !== given.length) return false;
    
    // Simple comparison
    const normalizedPredicted = predicted.sort();
    const normalizedGiven = given.sort();
    
    return normalizedPredicted.every((product, index) => product === normalizedGiven[index]);
  }
}