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

  //Determines if a reaction is possible
isPossible(reactionString, options = {}) {
  console.log("isPossible() called with:", reactionString);
  
  try {
    // Validate reaction string format
    if (!reactionString || typeof reactionString !== 'string') {
      console.warn("Invalid reaction string provided");
      this.outputCallback && this.outputCallback(`Invalid reaction format: "${reactionString}"`);
      return false;
    }
    
    const analysis = this.analyzeReaction(reactionString, options);
    const isPossible = analysis && analysis.possible || false;
    
    // Format the detailed output if outputCallback is available
    if (this.outputCallback) {
      this.outputCallback(this.formatReactionAnalysis(reactionString, analysis));
    }
    
    return isPossible;
  } catch (error) {
    console.error("Error in isPossible():", error.message);
    this.outputCallback && this.outputCallback(`Error analyzing reaction: ${error.message}`);
    return false;
  }
}

  //Analyzes a reaction string by trying all handlers until one returns a possible match
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

  //Identifies the types of compounds in a reaction
  identifyCompoundTypes(compounds) {
    return {
      hasOxide: compounds.some(c => this.oxideHandler.isOxide(c)),
      hasBase: compounds.some(c => this.baseHandler.isBase(c)),
      hasAcid: compounds.some(c => this.acidHandler.isAcid(c)),
      hasSalt: compounds.some(c => this.saltHandler.isSalt(c))
    };
  }

  //Predicts the products of a reaction
  predictProducts(reactionString, options = {}) {
    if (!reactionString.includes("->")) {
      reactionString = reactionString + " -> ?";
    }

    const analysis = this.analyzeReaction(reactionString, options);
    return analysis.predictedProducts || null;
  }

  //Gets detailed information about a specific compound
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


  //Formats the reaction analysis result into a user-friendly message
  formatReactionAnalysis(reactionString, analysis) {
    if (!analysis) {
      return `The reaction "${reactionString}" could not be analyzed.`;
    }
    
    // Basic possibility statement
    let message = `The reaction "${reactionString}" is ${analysis.possible ? "chemically possible" : "not chemically possible"}`;
    if (analysis.possible) {
      message += ".";
    } else if (analysis.error) {
      message += `: ${analysis.error}`;
    } else {
      message += ".";
    }
    
    // Add reaction type if available
    if (analysis.reactionType) {
      const formattedType = analysis.reactionType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      message += `\nReaction type: ${formattedType}`;
    }
    
    // Add reaction conditions if available
    if (analysis.conditions && analysis.conditions.length > 0) {
      message += `\nConditions: ${analysis.conditions.join(", ")}`;
    }
    
    // Add information about reactants if available
    if (analysis.reactantTypes) {
      message += "\n\nReactant information:";
      for (const [formula, type] of Object.entries(analysis.reactantTypes)) {
        message += `\n• ${formula}: ${type}`;
      }
    }
    
    // Add information about predicted products if available
    if (analysis.predictedProducts && analysis.predictedProducts.length > 0) {
      message += `\n\nPredicted products: ${analysis.predictedProducts.join(" + ")}`;
      
      // Add information about whether products match
      if (analysis.productsMatch !== undefined) {
        if (analysis.productsMatch) {
          message += "\nThe predicted products match the given products.";
        } else {
          message += "\nThe predicted products differ from the given products.";
        }
      }
    }
    
    return message;
  }
  
  setOutputCallback(callback) {
    this.outputCallback = callback;
  }
}
