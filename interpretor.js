import { periodicTable } from './chemistryData/periodicTable.js';
import { hydrocarbonWeights } from './chemistryData/hydrocarbons.js';
import { oxidizingAgents, reducingAgents, validCombustionFuels } from './chemistryData/redoxAgents.js';
import { acids, bases } from './chemistryData/acidsBases.js';
import { physicalConstants } from './chemistryData/constants.js';
import { solubilityTable } from './chemistryData/solubilityTable.js';
import { extractIons } from './chemistryData/extractIons.js';

export default class Interpretor {
  constructor(parseTree, outputCallback) {
    this.parseTree = parseTree;
    this.env = {};
    this.outputCallback = outputCallback;
  }

  interpret() {
    let current = this.parseTree;
    while (current) {
      if (
        current.left &&
        current.left.type === "KEYWORD_TOKEN" &&
        current.left.value === "if"
      ) {
        current = this.handleIfChain(current);
        continue;
      } else if (current.left && current.left.type !== "EXP") {
        this.evaluateNode(current.left);
      }
      current = current.right;
    }
  }

  handleIfChain(chainNode) {
    let node = chainNode;
    let executed = false;

    const ifNode = node.left;
    if (ifNode && ifNode.type === "KEYWORD_TOKEN" && ifNode.value === "if") {
      const condition = this.evaluateCondition(ifNode.left);
      if (condition) {
        this.interpretBody(ifNode.right);
        executed = true;
      }
    }

    let next = node.right;
    while (
      !executed &&
      next &&
      next.left &&
      (next.left.value === "elif" || next.left.value === "else")
    ) {
      if (next.left.value === "elif") {
        const condition = this.evaluateCondition(next.left.left);
        if (condition) {
          this.interpretBody(next.left.right);
          executed = true;
          next = next.right;
          break;
        }
      } else if (next.left.value === "else") {
        this.interpretBody(next.left.right);
        executed = true;
        next = next.right;
        break;
      }
      next = next.right;
    }

    // If no branch executed, nothing is done.
    return next; // return the next node after the entire if-chain
  }

  evaluateNode(node) {
    if (!node) return;

    // If this node is an EXP node wrapping a let statement, unwrap it.
    let stmtNode = node;
    if (
      node.type === "EXP" &&
      node.left &&
      node.left.type === "KEYWORD_TOKEN" &&
      node.left.value === "let"
    ) {
      stmtNode = node.left;
    }

    // Handle variable declaration: let x = "value"
    if (stmtNode.type === "KEYWORD_TOKEN" && stmtNode.value === "let") {
      if (!stmtNode.left || stmtNode.left.type !== "IDENTIFIER_TOKEN") {
        throw new Error("Expected variable identifier in let statement");
      }
      const varName = stmtNode.left.value;
      if (!stmtNode.right) {
        throw new Error(`Missing assignment value for variable ${varName}`);
      }
      const varValue = this.evaluateExpression(stmtNode.right);
      this.env[varName] = this.autoConvertType(varValue);
      console.log("env after assignment:", this.env);
      return;
    }

    // Handle assignment: x = "new value"
    if (node.type === "IDENTIFIER_TOKEN" && node.left?.value === "=") {
      const varName = node.value;
      let varValue = this.evaluateExpression(node.left.left);
      if (typeof varValue === "string" && !isNaN(varValue)) {
        varValue = parseFloat(varValue);
      }
      if (!(varName in this.env)) {
        throw new Error(`Variable ${varName} not declared`);
      }
      this.env[varName] = varValue;
      return;
    }

    if (node.type === "KEYWORD_TOKEN" && node.value === "if") {
      const condition = this.evaluateCondition(node.left);
      if (condition) {
        this.interpretBody(node.right);
      }
      return;
    }

    if (node.type === "KEYWORD_TOKEN" && node.value === "show") {
      const message = this.evaluateExpression(node.left);
      this.outputCallback(message);
      return;
    }
  }

  evaluateExpression(node) {
    if (!node) return null;

    console.log(JSON.stringify(node, null, 2));

    // Handle mathematical operations and string concatenation
    if (node.type === "OPERATOR_TOKEN") {
      const leftVal = this.evaluateExpression(node.left);
      const rightVal = this.evaluateExpression(node.right);

      if (node.value == "+") {
        console.log("Concatenating:", { left: leftVal, right: rightVal });
        return String(leftVal) + String(rightVal);
      } else {
        throw new Error(`Unsupported operator: ${node.value}`);
      }
    }

    // Handle function calls
    if (node.type === "KEYWORD_TOKEN") {
      return this.handleFunctionCall(node);
    }

    // Handle basic values
    switch (node.type) {
      case "STRING_TOKEN":
        return node.value;
      case "NUMBER_TOKEN":
        return this.parseNumber(node.value);
      case "IDENTIFIER_TOKEN":
        if (node.value in this.env) {
          const value = this.env[node.value];
          console.log(`Resolved variable ${node.value} =`, value);
          return value;
        } else {
          throw new Error(`Undefined variable: ${node.value}`);
        }
      default:
        return null;
    }
  }

  handleFunctionCall(node) {
    const args = this.evaluateArguments(node.left);
    console.log("args: " + args);
    switch (node.value) {
      case "possible":
        console.log("Checking reaction possibility for:", args[0]);
        return this.isReactionPossible(args[0]);
      case "resolve":
        return this.resolveReaction(args[0]);
      case "getOxidixngs":
        return this.getOxidizingAgents(args[0]);
      case "getMolecWeight":
        return this.getMolecularWeight(args[0]);
      case "getVolume":
        return this.getVolume(args[0], args[1]);
      case "getV":
        return this.getGasVolume(args[0], args[1], args[2]);
      case "isAcid":
        return this.isAcid(args[0]);
      case "isBase":
        return this.isBase(args[0]);
      default:
        throw new Error(`Unknown function: ${node.value}`);
    }
  }

  evaluateArguments(node) {
    if (!node) return [];
    if (node.value === ",") {
      return [
        this.evaluateExpression(node.left),
        ...this.evaluateArguments(node.right),
      ];
    }
    return [this.evaluateExpression(node)];
  }

  evaluateCondition(node) {
    return this.evaluateExpression(node);
  }

  interpretBody(bodyNode) {
    let current = bodyNode;
    while (current) {
      if (current.left) this.evaluateNode(current.left);
      current = current.right;
    }
  }

  // Chemistry Functions

  // isReactionPossible(reactionString) {
  //   // Check for the arrow and then validate combustion reaction.
  //   if (!reactionString.includes("->")) return false;
  //   const [reactants, products] = reactionString
  //     .split("->")
  //     .map((s) => s.trim());
  //   const requiredProducts = ["CO2", "H2O"];
  //   return this.isCombustionReaction(reactants, products, requiredProducts);
  // }

  isReactionPossible(reactionString) {
    // Checking for the arrow
    if (!reactionString.includes("->")) return false;
    
    const [reactants, products] = reactionString.split("->").map(s => s.trim());
    const reactantParts = reactants.split("+").map(s => s.trim());
    const productParts = products.split("+").map(s => s.trim());
    
    // Checking for combustion reaction
    if (this.isCombustionReaction(reactants, products, ["CO2", "H2O"])) {
      return true;
    }
    
    // Check for precipitation reaction (double replacement)
    if (reactantParts.length === 2 && productParts.length === 2) {
      // Identifying potential double replacement reaction
      const ions1 = extractIons(reactantParts[0]);
      const ions2 = extractIons(reactantParts[1]);
      
      if (ions1.cation && ions1.anion && ions2.cation && ions2.anion) {
        // Checking if both reactants are soluble
        const react1Solubility = solubilityTable[`${ions1.anion}_${ions1.cation}`];
        const react2Solubility = solubilityTable[`${ions2.anion}_${ions2.cation}`];
        
        if ((react1Solubility === "P" || react1Solubility === "M") && 
            (react2Solubility === "P" || react2Solubility === "M")) {
          
          // Now checking for potential precipitation in products
          // The products would have swapped ions
          const product1Key = `${ions1.anion}_${ions2.cation}`;
          const product2Key = `${ions2.anion}_${ions1.cation}`;
          
          const prod1Solubility = solubilityTable[product1Key];
          const prod2Solubility = solubilityTable[product2Key];
          
          // If at least one product is insoluble, reaction is likely
          if (prod1Solubility === "H" || prod2Solubility === "H") {
            return true;
          }
        }
      }
    }
    
    // Check for acid-base neutralization
    if (reactantParts.length === 2) {
      const acid = reactantParts.find(r => this.isAcid(r));
      const base = reactantParts.find(r => this.isBase(r));
      
      if (acid && base) {
        // Acid-base reactions typically produce water and a salt
        if (productParts.includes("H2O")) {
          return true;
        }
      }
    }
    
    // If no specific reaction type identified, return false
    return false;
  }

  resolveReaction(reactionString) {
    // Very basic "balancing" just reformats the equation.
    const [left, right] = reactionString.split("->").map((s) => s.trim());
    const leftParts = left.split("+").map((s) => s.trim());
    const rightParts = right.split("+").map((s) => s.trim());
    return leftParts.join(" + ") + " → " + rightParts.join(" + ");
  }

  getOxidizingAgents(reactionString) {
    // Return only the oxidizing agents identified from the reaction string.
    const agents = this.findRedoxAgents(reactionString);
    return agents.oxidizing;
  }

  getMolecularWeight(formula) {
    // First, try a lookup for common hydrocarbons.

    if (hydrocarbonWeights[formula]) {
      return hydrocarbonWeights[formula];
    }

    // Otherwise, compute weight using periodic table values.
    const parsed = this.parseFormula(formula);
    return parsed.reduce((sum, [element, count]) => {
      return sum + (periodicTable[element] || 0) * count;
    }, 0);
  }

  getVolume(mass, density) {
    return mass / density;
  }

  getGasVolume(moles, temperature, pressure) {
    // Ideal Gas Law: PV = nRT → V = (nRT) / P
    const n = this.ensureNumber(moles, "moles");
    const T = this.ensureNumber(temperature, "temperature");
    const P = this.ensureNumber(pressure, "pressure");
    return (n * physicalConstants.R * T) / P;
  }

  ensureNumber(value, name) {
    if (typeof value !== "number") {
      throw new Error(
        `Invalid ${name}: Must be a number. Received ${typeof value}`
      );
    }
    return value;
  }

  parseFormula(formula) {
    // Parse a chemical formula into an array of [element, count] pairs.
    const regex = /([A-Z][a-z]*)(\d*)/g;
    const components = [];
    let match;
    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      const count = match[2] === "" ? 1 : parseInt(match[2]);
      components.push([element, count]);
    }
    console.log("Parsed formula components for:", formula, components);
    return components;
  }

  findRedoxAgents(compounds) {
    // Split the reaction string (by '+') and filter for known agents.
    return {
      oxidizing: compounds
        .split("+")
        .map((c) => c.trim())
        .filter((c) => oxidizingAgents.includes(c)),
      reducing: compounds
        .split("+")
        .map((c) => c.trim())
        .filter((c) => reducingAgents.includes(c)),
    };
  }

  isCombustionReaction(reactants, products, requiredProducts) {
    // Check that one valid fuel is present, along with O2 on the reactant side.
    const reactantParts = reactants.split("+").map((s) => s.trim());
    const hasFuel = reactantParts.some((part) => validCombustionFuels.includes(part));
    const hasO2 = reactantParts.includes("O2");

    // Check that every required product (CO2, H2O) is present.
    const productParts = products.split("+").map((s) => s.trim());
    const hasAllProducts = requiredProducts.every((p) =>
      productParts.includes(p)
    );
    return hasFuel && hasO2 && hasAllProducts;
  }

  // Functions for checking whether the substance is Acid or Base
  isAcid(compound) {
    return acids.includes(compound);
  }
  
  isBase(compound) {
    return bases.includes(compound);
  }

  validateNumberOperands(left, right, operator) {
    if (typeof left !== "number" || typeof right !== "number") {
      throw new Error(
        `Operator '${operator}' requires numeric operands. ` +
          `Received: ${typeof left} and ${typeof right}`
      );
    }
  }

  getVariableValue(name) {
    if (!(name in this.env)) {
      throw new Error(`Undefined variable: ${name}`);
    }
    return this.env[name];
  }

  parseNumber(value) {
    if (typeof value === "number") return value;
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`Invalid number: ${value}`);
    }
    return parsed;
  }

  autoConvertType(value) {
    if (typeof value === "string") {
      if (!isNaN(value) && value.trim() !== "") {
        return parseFloat(value);
      }
      return value;
    }
    return value;
  }
}

/*
input 1:
let variable = "C6H6";

if (possible(variable + " + O2 -> CO2 + H2O")) {
  show("Valid combustion reaction!");
} else {
  show("Invalid reaction!");
}

*/
