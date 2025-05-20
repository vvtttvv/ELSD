import { isSalt, classifySalt, saltCategories, classifySaltByType, isSoluble, determineSaltpH, extractSaltComponents } from '../compounds/salts/saltTypes.js';
import { canReact, predictProducts, getReactionInfo } from '../compounds/salts/saltReactivity.js';
import { classifyOxide } from '../compounds/oxides/oxideTypes.js';
import { isAcid } from '../compounds/acids/acidTypes.js';
import { isBase } from '../compounds/bases/baseTypes.js';
import { isMetal, isNonMetal } from '../core/elements.js';

/**
 * SaltHandler class for managing salt-related reactions and classifications
 * Serves as a bridge between the interpreter and the salt-specific logic
 */
export class SaltHandler {
  constructor() {
    // Initialize any required state
  }

  //Checks if a compound is a salt
  isSalt(formula) {
    return isSalt(formula);
  }

  //Gets comprehensive classification of a salt
  classifySalt(formula) {
    return classifySalt(formula);
  }

  //Gets a descriptive name for a salt category
  getCategoryName(category) {
    const categoryNames = {
      [saltCategories.NORMAL]: "Normal Salt",
      [saltCategories.ACIDIC]: "Acidic Salt",
      [saltCategories.BASIC]: "Basic Salt",
      [saltCategories.DOUBLE]: "Double Salt",
      [saltCategories.MIXED]: "Mixed Salt",
      [saltCategories.SOLUBLE]: "Soluble Salt",
      [saltCategories.INSOLUBLE]: "Insoluble Salt"
    };
    
    return categoryNames[category] || "Unknown";
  }

  //Determines if a reaction involving a salt is possible
  canReact(formula1, formula2) {
    // Check if at least one compound is a salt
    if (this.isSalt(formula1)) {
      return canReact(formula1, formula2);
    } else if (this.isSalt(formula2)) {
      return canReact(formula2, formula1);
    }
    
    return false;
  }

  //Predicts products for a reaction involving a salt
  predictProducts(formula1, formula2) {
    // Check if at least one compound is a salt
    if (this.isSalt(formula1)) {
      return predictProducts(formula1, formula2);
    } else if (this.isSalt(formula2)) {
      return predictProducts(formula2, formula1);
    }
    
    return null;
  }

  //Gets detailed information about a reaction involving a salt
  getReactionInfo(formula1, formula2) {
    // Check if at least one compound is a salt
    if (this.isSalt(formula1)) {
      return getReactionInfo(formula1, formula2);
    } else if (this.isSalt(formula2)) {
      return getReactionInfo(formula2, formula1);
    }
    
    return null;
  }

  //Analyzes a reaction string involving salts
  analyzeReaction(reactionString) {
    console.log("SaltHandler analyzing reaction:", reactionString);

    const parts = reactionString.split("->");
    if (parts.length !== 2) {
      return { valid: false, error: "Invalid reaction format" };
    }
    
    const reactants = parts[0].split("+").map(r => r.trim());
    const givenProducts = parts[1].split("+").map(p => p.trim());
    
    const saltIndex = reactants.findIndex(r => this.isSalt(r));
    if (saltIndex === -1) {
      return { 
        valid: false, 
        error: "No salt found in reactants",
        reactants,
        givenProducts
      };
    }
    
    if (reactants.length === 1) {
      const saltFormula = reactants[0];
      
      try {
        const decompositionInfo = getReactionInfo(saltFormula, "heat");
        if (!decompositionInfo) {
          return {
            valid: false,
            error: "This salt does not undergo thermal decomposition",
            reactants,
            givenProducts
          };
        }
        
        return {
          valid: true,
          possible: true,
          reactants,
          givenProducts,
          predictedProducts: decompositionInfo.products,
          reactionType: decompositionInfo.reactionType,
          conditions: decompositionInfo.conditions,
          productsMatch: this.compareProducts(decompositionInfo.products, givenProducts)
        };
      } catch (err) {
        console.warn("Decomposition analysis error:", err.message);
        return {
          valid: false,
          error: `Error analyzing decomposition reaction: ${err.message}`,
          reactants,
          givenProducts
        };
      }
    }
    
    if (reactants.length === 2) {
      const saltIndex = reactants.findIndex(r => this.isSalt(r));
      const otherIndex = saltIndex === 0 ? 1 : 0;
      
      const saltFormula = reactants[saltIndex];
      const otherFormula = reactants[otherIndex];
      
      try {
        const reactionInfo = getReactionInfo(saltFormula, otherFormula);
        
        if (!reactionInfo) {
          return {
            valid: false,
            possible: false,
            error: "No reaction occurs between these compounds",
            reactants,
            givenProducts,
            reactantTypes: {
              [saltFormula]: this.getSaltTypeName(saltFormula),
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
            [saltFormula]: this.getSaltTypeName(saltFormula),
            [otherFormula]: this.getReactantTypeName(otherFormula)
          },
          productsMatch: this.compareProducts(reactionInfo.products, givenProducts)
        };
      } catch (err) {
        console.warn("Handler error in SaltHandler:", err.message);
        return {
          valid: false,
          error: `Analysis error: ${err.message}`,
          reactants,
          givenProducts
        };
      }
    }
    
    return {
      valid: false,
      error: "Complex reactions with more than 2 reactants not yet supported",
      reactants,
      givenProducts
    };
  }

  // Gets a descriptive name for the salt type
  getSaltTypeName(formula) {
    const saltInfo = classifySalt(formula);
    if (!saltInfo) return "Not a salt";
    
    let typeName = "";
    
    // Salt type (normal, acidic, basic, etc.)
    if (saltInfo.type === saltCategories.NORMAL) {
      typeName = "Normal ";
    } else if (saltInfo.type === saltCategories.ACIDIC) {
      typeName = "Acidic ";
    } else if (saltInfo.type === saltCategories.BASIC) {
      typeName = "Basic ";
    } else if (saltInfo.type === saltCategories.DOUBLE) {
      typeName = "Double ";
    } else if (saltInfo.type === saltCategories.MIXED) {
      typeName = "Mixed ";
    }
    
    typeName += "Salt";
    
    // Add solubility information
    if (saltInfo.solubility === saltCategories.SOLUBLE) {
      typeName += " (Soluble)";
    } else {
      typeName += " (Insoluble)";
    }
    
    // Add pH character if relevant
    if (saltInfo.pH === "acidic") {
      typeName += " - Acidic in solution";
    } else if (saltInfo.pH === "basic") {
      typeName += " - Basic in solution";
    } else if (saltInfo.pH === "neutral") {
      typeName += " - Neutral in solution";
    }
    
    return typeName;
  }

  //Gets a descriptive name for the reactant type
  getReactantTypeName(formula) {
    // Check if it's a metal
    if (isMetal(formula)) {
      return "Metal";
    }
    
    // Check if it's an acid
    if (isAcid(formula)) {
      return "Acid";
    }
    
    // Check if it's a base
    if (isBase(formula)) {
      return "Base";
    }
    
    // Check if it's another salt
    if (this.isSalt(formula)) {
      return this.getSaltTypeName(formula);
    }
    
    // Check if it's an oxide
    const oxideType = classifyOxide(formula);
    if (oxideType) {
      return `${oxideType.charAt(0).toUpperCase() + oxideType.slice(1)} Oxide`;
    }
    
    // Check if it's water
    if (formula === "H2O") {
      return "Water";
    }
    
    // Check if it's for thermal decomposition
    if (formula === "heat") {
      return "Heat (Thermal Decomposition)";
    }
    
    return "Unknown";
  }

  //Compares predicted products with products given in the reaction
  compareProducts(predicted, given) {
    if (!predicted || !given) return false;
    if (predicted.length !== given.length) return false;
    
    // Simple comparison
    const normalizedPredicted = [...predicted].sort();
    const normalizedGiven = [...given].sort();
    
    return normalizedPredicted.every((product, index) => product === normalizedGiven[index]);
  }
}