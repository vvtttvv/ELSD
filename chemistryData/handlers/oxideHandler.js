import { isOxide, classifyOxide, oxideCategories } from '../compounds/oxides/oxideTypes.js';
import { canReact, predictProducts } from '../compounds/oxides/oxideReactivity.js';

/**
 * OxideHandler class for managing oxide-related reactions and classifications
 * Serves as a bridge between the interpreter and the oxide-specific logic
 */
export class OxideHandler {
  constructor() {
    // Initialize any required state
  }

  //Checks if a compound is an oxide
  isOxide(formula) {
    return isOxide(formula);
  }

  //Classifies an oxide into its category
  classifyOxide(formula) {
    return classifyOxide(formula);
  }

  //Gets a descriptive name for an oxide category
  getCategoryName(category) {
    const categoryNames = {
      [oxideCategories.BASIC]: "Basic Oxide",
      [oxideCategories.ACIDIC]: "Acidic Oxide",
      [oxideCategories.AMPHOTERIC]: "Amphoteric Oxide",
      [oxideCategories.INDIFFERENT]: "Indifferent/Neutral Oxide",
      [oxideCategories.PEROXIDE]: "Peroxide",
      [oxideCategories.SUPEROXIDE]: "Superoxide"
    };
    
    return categoryNames[category] || "Unknown";
  }

  //Determines if a reaction involving oxides is possible
  canReact(formula1, formula2) {
    // Check if at least one compound is an oxide
    if (!this.isOxide(formula1) && !this.isOxide(formula2)) {
      return false;
    }
    
    return canReact(formula1, formula2);
  }

  //Predicts products for a reaction involving oxides
  predictProducts(formula1, formula2) {
    // Check if at least one compound is an oxide
    if (!this.isOxide(formula1) && !this.isOxide(formula2)) {
      return null;
    }
    
    return predictProducts(formula1, formula2);
  }

  //Analyzes a reaction string involving oxides
  analyzeReaction(reactionString) {
    // Parse the reaction string
    const parts = reactionString.split("->");
    if (parts.length !== 2) {
      return { valid: false, error: "Invalid reaction format" };
    }
    
    const reactants = parts[0].split("+").map(r => r.trim());
    const givenProducts = parts[1].split("+").map(p => p.trim());
    
    // Check if any reactant is an oxide
    const hasOxide = reactants.some(r => this.isOxide(r));
    if (!hasOxide) {
      return { 
        valid: false, 
        error: "No oxide found in reactants",
        reactants,
        givenProducts
      };
    }
    
    // For single reactant (decomposition)
    if (reactants.length === 1) {
      // Decomposition reactions not fully implemented yet
      return {
        valid: false,
        error: "Decomposition reactions not yet supported",
        reactants,
        givenProducts
      };
    }
    
    // For binary reactions
    if (reactants.length === 2) {
      const canReactResult = this.canReact(reactants[0], reactants[1]);
      const predictedProducts = this.predictProducts(reactants[0], reactants[1]);
      
      return {
        valid: canReactResult,
        possible: canReactResult,
        reactants,
        givenProducts,
        predictedProducts,
        reactantTypes: {
          [reactants[0]]: this.isOxide(reactants[0]) ? this.getCategoryName(this.classifyOxide(reactants[0])) : "Non-oxide",
          [reactants[1]]: this.isOxide(reactants[1]) ? this.getCategoryName(this.classifyOxide(reactants[1])) : "Non-oxide"
        },
        productsMatch: predictedProducts && this.compareProducts(predictedProducts, givenProducts)
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