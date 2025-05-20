import { OxideHandler } from './handlers/oxideHandler.js';
import { BaseHandler } from './handlers/baseHandler.js';
import { AcidHandler } from './handlers/acidHandler.js';
import { SaltHandler } from './handlers/saltHandler.js';

/**
 * Main ReactionAnalyzer class that coordinates all compound handlers
 * and provides a unified interface for reaction analysis
 */
export class ReactionAnalyzer {
  constructor() {
    // Initialize all handlers
    this.oxideHandler = new OxideHandler();
    this.baseHandler = new BaseHandler();
    this.acidHandler = new AcidHandler();
    this.saltHandler = new SaltHandler();
  }

  /**
 * Determines if a reaction is possible
 * @param {string} reactionString - Reaction string in format "A + B -> C + D"
 * @param {Object} options - Additional options (like concentrated acid)
 * @returns {boolean} - Whether the reaction is possible
 */
isPossible(reactionString, options = {}) {
  console.log("isPossible() called with:", reactionString);
  
  try {
    // Validate reaction string format
    if (!reactionString || typeof reactionString !== 'string') {
      console.warn("Invalid reaction string provided");
      return false;
    }
    
    const analysis = this.analyzeReaction(reactionString, options);
    return analysis && analysis.possible || false;
  } catch (error) {
    console.error("Error in isPossible():", error.message);
    return false;
  }
}

  /**
   * Analyzes a reaction string by trying all handlers until one returns a possible match
   * @param {string} reactionString - Reaction string in format "A + B -> C + D"
   * @param {Object} options - Additional options (like concentrated acid)
   * @returns {Object} - Comprehensive analysis of the reaction
   */
  analyzeReaction(reactionString, options = {}) {
    console.log("analyzeReaction() called with:", reactionString);
    const parts = reactionString.split("->");
    if (parts.length !== 2) {
      return { valid: false, error: "Invalid reaction format", possible: false };
    }

    const reactants = parts[0].split("+").map(r => r.trim());
    const givenProducts = parts[1].split("+").map(p => p.trim());

    if (reactants.length === 0 || givenProducts.length === 0) {
      return { valid: false, error: "Missing reactants or products", possible: false };
    }

    const handlers = [
      this.acidHandler,
      this.baseHandler,
      this.oxideHandler,
      this.saltHandler
    ];

    for (const handler of handlers) {
      console.log("Trying handler:", handler.constructor.name);
      try {
        const result = handler.analyzeReaction(reactionString, options.concentratedAcid || false);
        if (result?.possible) {
          console.log("Match found in:", handler.constructor.name);
          return result;
        }
      } catch (err) {
        console.warn("Handler error in", handler.constructor.name, ":", err.message);
      }
    }

    return {
      valid: false,
      possible: false,
      error: "No handler recognized the reaction",
      reactants,
      givenProducts,
      compoundTypes: this.identifyCompoundTypes(reactants)
    };
  }

  /**
   * Identifies the types of compounds in a reaction
   * @param {Array} compounds - Array of chemical formulas
   * @returns {Object} - Object indicating what types of compounds are present
   */
  identifyCompoundTypes(compounds) {
    return {
      hasOxide: compounds.some(c => this.oxideHandler.isOxide(c)),
      hasBase: compounds.some(c => this.baseHandler.isBase(c)),
      hasAcid: compounds.some(c => this.acidHandler.isAcid(c)),
      hasSalt: compounds.some(c => this.saltHandler.isSalt(c))
    };
  }

  /**
   * Predicts the products of a reaction
   * @param {string} reactionString - Reaction string with or without products
   * @param {Object} options - Additional options (like concentrated acid)
   * @returns {Array|null} - Predicted products or null if reaction not possible
   */
  predictProducts(reactionString, options = {}) {
    if (!reactionString.includes("->")) {
      reactionString = reactionString + " -> ?";
    }

    const analysis = this.analyzeReaction(reactionString, options);
    return analysis.predictedProducts || null;
  }

  /**
   * Gets detailed information about a specific compound
   * @param {string} formula - Chemical formula
   * @returns {Object} - Detailed information about the compound
   */
  getCompoundInfo(formula) {
    if (this.acidHandler.isAcid(formula)) {
      const acidInfo = this.acidHandler.classifyAcid(formula);
      return {
        type: "acid",
        info: acidInfo,
        name: this.acidHandler.getAcidTypeName(formula),
        formula
      };
    } else if (this.oxideHandler.isOxide(formula)) {
      const oxideType = this.oxideHandler.classifyOxide(formula);
      return {
        type: "oxide",
        subtype: oxideType,
        name: this.oxideHandler.getCategoryName(oxideType),
        formula
      };
    } else if (this.baseHandler.isBase(formula)) {
      const baseInfo = this.baseHandler.classifyBase(formula);
      return {
        type: "base",
        info: baseInfo,
        name: this.baseHandler.getBaseTypeName(formula),
        formula
      };
    } else if (this.saltHandler.isSalt(formula)) {
      const saltInfo = this.saltHandler.classifySalt(formula);
      return {
        type: "salt",
        info: saltInfo,
        name: this.saltHandler.getSaltTypeName(formula),
        formula
      };
    }

    return {
      type: "unknown",
      formula
    };
  }
}
