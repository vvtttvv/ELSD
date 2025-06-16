import { isOxide, classifyOxide, oxideCategories } from '../compounds/oxides/oxideTypes.js';
import { canReact, predictProducts, getReactionInfo } from '../compounds/oxides/oxideReactivity.js';
import { extractMetalFromOxide } from '../core/utils.js';
import { isMetal } from '../core/elements.js';

/**
 * Metal oxides that can undergo thermal decomposition
 * Listed with their decomposition temperatures (approximate, in Celsius)
 */
const thermallyDecomposableOxides = {
  // Mercury compounds (low decomposition temperature)
  "HgO": { temperature: 500, products: ["Hg", "O2"] },
  
  // Silver compounds
  "Ag2O": { temperature: 300, products: ["Ag", "O2"] },
  
  // Lead compounds
  "PbO2": { temperature: 290, products: ["PbO", "O2"] },
  
  // Copper compounds (high temperature)
  "CuO": { temperature: 1026, products: ["Cu", "O2"] },
  
  // Manganese compounds
  "MnO2": { temperature: 535, products: ["Mn2O3", "O2"] },
  
  // Zinc compounds (very high temperature)
  "ZnO": { temperature: 1975, products: ["Zn", "O2"] },
  
  // Iron compounds (very high temperature, limited decomposition)
  "Fe2O3": { temperature: 1565, products: ["Fe", "O2"], note: "Requires very high temperature" },
  
  // Additional decomposable oxides
  "NiO": { temperature: 1955, products: ["Ni", "O2"] },
  "CoO": { temperature: 1900, products: ["Co", "O2"] },
  "SnO2": { temperature: 1630, products: ["SnO", "O2"] },
  "PbO": { temperature: 888, products: ["Pb", "O2"] }
};

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

  //Checks if an oxide can undergo thermal decomposition
  canDecompose(oxideFormula) {
    return thermallyDecomposableOxides.hasOwnProperty(oxideFormula);
  }

  //Predicts products of thermal decomposition
  predictDecompositionProducts(oxideFormula) {
    const decompositionData = thermallyDecomposableOxides[oxideFormula];
    if (!decompositionData) return null;
    
    return decompositionData.products;
  }

  //Gets thermal decomposition info
  getDecompositionInfo(oxideFormula) {
    const decompositionData = thermallyDecomposableOxides[oxideFormula];
    if (!decompositionData) return null;
    
    return {
      reactionType: "thermal_decomposition",
      products: decompositionData.products,
      conditions: [`heating to ${decompositionData.temperature}°C`, "thermal decomposition"],
      temperature: decompositionData.temperature,
      note: decompositionData.note
    };
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
    
    // For single reactant (thermal decomposition)
    if (reactants.length === 1) {
      const oxideFormula = reactants[0];
      
      if (!this.isOxide(oxideFormula)) {
        return {
          valid: false,
          error: "Single reactant is not an oxide",
          reactants,
          givenProducts
        };
      }
      
      if (!this.canDecompose(oxideFormula)) {
        return {
          valid: false,
          possible: false,
          error: `${oxideFormula} does not undergo thermal decomposition under normal heating conditions`,
          reactants,
          givenProducts,
          reactantTypes: {
            [oxideFormula]: this.getCategoryName(this.classifyOxide(oxideFormula))
          }
        };
      }
      
      const decompositionInfo = this.getDecompositionInfo(oxideFormula);
      
      return {
        valid: true,
        possible: true,
        reactants,
        givenProducts,
        predictedProducts: decompositionInfo.products,
        reactionType: decompositionInfo.reactionType,
        conditions: decompositionInfo.conditions,
        reactantTypes: {
          [oxideFormula]: this.getCategoryName(this.classifyOxide(oxideFormula))
        },
        productsMatch: this.compareProducts(decompositionInfo.products, givenProducts),
        note: decompositionInfo.note
      };
    }
    
    // For binary reactions
    if (reactants.length === 2) {
      const canReactResult = this.canReact(reactants[0], reactants[1]);
      const reactionInfo = getReactionInfo(reactants[0], reactants[1]);
      
      return {
        valid: canReactResult,
        possible: canReactResult,
        reactants,
        givenProducts,
        predictedProducts: reactionInfo?.products,
        reactionType: reactionInfo?.reactionType,
        conditions: reactionInfo?.conditions,
        reactantTypes: {
          [reactants[0]]: this.isOxide(reactants[0]) ? this.getCategoryName(this.classifyOxide(reactants[0])) : "Non-oxide",
          [reactants[1]]: this.isOxide(reactants[1]) ? this.getCategoryName(this.classifyOxide(reactants[1])) : "Non-oxide"
        },
        productsMatch: reactionInfo?.products && this.compareProducts(reactionInfo.products, givenProducts)
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