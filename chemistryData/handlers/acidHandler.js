import { isAcid, classifyAcid, acidCategories, classifyAcidByStrength, determineAcidType, determineBasicity } from '../compounds/acids/acidTypes.js';
import { canReact, predictProducts, getReactionInfo, acidReactions } from '../compounds/acids/acidReactivity.js';
import { classifyOxide } from '../compounds/oxides/oxideTypes.js';
import { isMetal } from '../core/elements.js';

/**
 * AcidHandler class for managing acid-related reactions and classifications
 * Serves as a bridge between the interpreter and the acid-specific logic
 */
export class AcidHandler {
  constructor() {
    // Initialize any required state
  }

  //Checks if a compound is an acid
  isAcid(formula) {
    return isAcid(formula);
  }

  //Gets comprehensive classification of an acid
  classifyAcid(formula) {
    return classifyAcid(formula);
  }

  //Gets a descriptive name for an acid category
  getCategoryName(category) {
    const categoryNames = {
      [acidCategories.STRONG]: "Strong Acid",
      [acidCategories.MODERATE]: "Moderate Strength Acid",
      [acidCategories.WEAK]: "Weak Acid",
      [acidCategories.MONOPROTIC]: "Monoprotic Acid",
      [acidCategories.DIPROTIC]: "Diprotic Acid",
      [acidCategories.TRIPROTIC]: "Triprotic Acid",
      [acidCategories.OXYACID]: "Oxyacid",
      [acidCategories.NONOXY]: "Non-oxygenated Acid"
    };
    
    return categoryNames[category] || "Unknown";
  }

  //Determines if a reaction involving an acid is possible
  canReact(formula1, formula2, isConcentrated = false) {
    // Check if at least one compound is an acid
    if (this.isAcid(formula1)) {
      return canReact(formula1, formula2, isConcentrated);
    } else if (this.isAcid(formula2)) {
      return canReact(formula2, formula1, isConcentrated);
    }
    
    return false;
  }

  //Predicts products for a reaction involving an acid
  predictProducts(formula1, formula2, isConcentrated = false) {
    // Check if at least one compound is an acid
    if (this.isAcid(formula1)) {
      return predictProducts(formula1, formula2, isConcentrated);
    } else if (this.isAcid(formula2)) {
      return predictProducts(formula2, formula1, isConcentrated);
    }
    
    return null;
  }

  //Gets detailed information about a reaction involving an acid
  getReactionInfo(formula1, formula2, isConcentrated = false) {
    // Check if at least one compound is an acid
    if (this.isAcid(formula1)) {
      return getReactionInfo(formula1, formula2, isConcentrated);
    } else if (this.isAcid(formula2)) {
      return getReactionInfo(formula2, formula1, isConcentrated);
    }
    
    return null;
  }

  /**
   * Analyzes a reaction string involving acids
   * @param {string} reactionString - Reaction string in format "A + B -> C + D"
   */
  analyzeReaction(reactionString, isConcentrated = false) {
    // Parse the reaction string
    const parts = reactionString.split("->");
    if (parts.length !== 2) {
      return { valid: false, error: "Invalid reaction format" };
    }
    
    const reactants = parts[0].split("+").map(r => r.trim());
    const givenProducts = parts[1].split("+").map(p => p.trim());
    
    // Check if any reactant is an acid
    const acidIndex = reactants.findIndex(r => this.isAcid(r));
    if (acidIndex === -1) {
      return { 
        valid: false, 
        error: "No acid found in reactants",
        reactants,
        givenProducts
      };
    }
    
    // Auto-detect concentrated acid reactions based on products
    if (!isConcentrated) {
      isConcentrated = this.detectConcentratedAcid(reactants, givenProducts);
      if (isConcentrated) {
        console.log("Auto-detected concentrated acid reaction based on products");
      }
    }
    
    // For single reactant (decomposition with heat)
    if (reactants.length === 1) {
      const acidFormula = reactants[0];
      
      // Check if it's an acid that can decompose
      if (this.isAcid(acidFormula)) {
        // For single reactant decomposition, check if the acid can decompose
        const acidStrength = classifyAcidByStrength(acidFormula);
        
        // Check if this acid has decomposition reactions defined
        const heatReaction = acidReactions[acidStrength]["heat"];
        if (!heatReaction || !heatReaction.possible(acidFormula)) {
          return {
            valid: false,
            possible: false,
            error: "This acid does not undergo thermal decomposition under normal heating conditions",
            reactants,
            givenProducts,
            reactantTypes: {
              [acidFormula]: this.getAcidTypeName(acidFormula)
            }
          };
        }
        
        // Get the decomposition products
        const products = heatReaction.products(acidFormula);
        if (!products) {
          return {
            valid: false,
            possible: false,
            error: "Failed to determine decomposition products",
            reactants,
            givenProducts,
            reactantTypes: {
              [acidFormula]: this.getAcidTypeName(acidFormula)
            }
          };
        }
        
        return {
          valid: true,
          possible: true,
          reactants,
          givenProducts,
          predictedProducts: products,
          reactionType: heatReaction.reactionType,
          conditions: heatReaction.conditions,
          reactantTypes: {
            [acidFormula]: this.getAcidTypeName(acidFormula)
          },
          productsMatch: this.compareProducts(products, givenProducts)
        };
      } else {
        return {
          valid: false,
          error: "Single reactant is not an acid",
          reactants,
          givenProducts
        };
      }
    }
    
    // For binary reactions
    if (reactants.length === 2) {
      const acidIndex = reactants.findIndex(r => this.isAcid(r));
      const otherIndex = acidIndex === 0 ? 1 : 0;
      
      const acidFormula = reactants[acidIndex];
      const otherFormula = reactants[otherIndex];
      
      const reactionInfo = getReactionInfo(acidFormula, otherFormula, isConcentrated);
      
      if (!reactionInfo) {
        return {
          valid: false,
          possible: false,
          error: "No reaction occurs between these compounds",
          reactants,
          givenProducts,
          reactantTypes: {
            [acidFormula]: this.getAcidTypeName(acidFormula),
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
          [acidFormula]: this.getAcidTypeName(acidFormula),
          [otherFormula]: this.getReactantTypeName(otherFormula)
        },
        productsMatch: this.compareProducts(reactionInfo.products, givenProducts),
        isConcentrated
      };
    }
    
    // More complex reactions not yet supported
    return {
      valid: false,
      error: "Complex reactions with more than 2 reactants not yet supported",
      reactants,
      givenProducts
    };
  }

  //Detects if a reaction should be treated as concentrated acid based on products
  detectConcentratedAcid(reactants, givenProducts) {
    // Look for acid and metal in reactants
    const acid = reactants.find(r => this.isAcid(r));
    const metal = reactants.find(r => isMetal(r));
    
    if (!acid || !metal) return false;
    
    // Check for concentrated acid indicators in products
    const concentratedIndicators = {
      "H2SO4": ["SO2"],   // Concentrated H2SO4 produces SO2
      "HNO3": ["NO2"]     // Concentrated HNO3 produces NO2
    };
    
    const indicators = concentratedIndicators[acid];
    if (!indicators) return false;
    
    // Check if any indicator is present in products
    return indicators.some(indicator => givenProducts.includes(indicator));
  }

  //Gets a descriptive name for the acid type
  getAcidTypeName(formula) {
    const acidInfo = classifyAcid(formula);
    if (!acidInfo) return "Not an acid";
    
    let typeName = "";
    
    if (acidInfo.strength === acidCategories.STRONG) {
      typeName = "Strong ";
    } else if (acidInfo.strength === acidCategories.MODERATE) {
      typeName = "Moderate ";
    } else {
      typeName = "Weak ";
    }
    
    if (acidInfo.acidType === acidCategories.OXYACID) {
      typeName += "Oxyacid";
    } else {
      typeName += "Non-oxygenated Acid";
    }
    
    // Add basicity information
    if (acidInfo.basicityName) {
      typeName += ` (${acidInfo.basicityName})`;
    }
    
    return typeName;
  }

  //Gets a descriptive name for the reactant type
  getReactantTypeName(formula) {
    // Check if it's a metal
    if (isMetal(formula)) {
      return "Metal";
    }

    if (this.baseHandler && this.baseHandler.isBase(formula)) {
      return this.baseHandler.getBaseTypeName(formula);
    }

    if (this.saltHandler && this.saltHandler.isSalt(formula)) {
      return this.saltHandler.getSaltTypeName(formula);
    }

    const oxideType = classifyOxide(formula);
    if (oxideType) {
      return `${oxideType.charAt(0).toUpperCase() + oxideType.slice(1)} Oxide`;
    }

    // Check if it's water
    if (formula === "H2O") {
      return "Water";
    }

    // Fallback
    return "Unknown Compound";
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