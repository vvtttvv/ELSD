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

  isReactionPossible(reactionString) {
    // Check for the arrow and then validate combustion reaction.
    if (!reactionString.includes("->")) return false;
    const [reactants, products] = reactionString
      .split("->")
      .map((s) => s.trim());
    const requiredProducts = ["CO2", "H2O"];
    return this.isCombustionReaction(reactants, products, requiredProducts);
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
    const hydrocarbonWeights = {
      CH4: 16.04, // Methane
      C2H6: 30.07, // Ethane
      C3H8: 44.1, // Propane
      C4H10: 58.12, // Butane
      C5H12: 72.15, // Pentane
      C6H14: 86.18, // Hexane
      C7H16: 100.21, // Heptane
      C8H18: 114.22, // Octane
      C9H20: 128.25, // Nonane
      C10H22: 142.29, // Decane

      C2H2: 26.04, // Acetylene (Ethyne)
      C2H4: 28.05, // Ethylene (Ethene)
      C3H6: 42.08, // Propylene (Propene)
      C4H8: 56.11, // Butylene (Butene)
      C5H10: 70.13, // Pentene
      C6H12: 84.16, // Hexene
      C7H14: 98.19, // Heptene
      C8H16: 112.21, // Octene
      C9H18: 126.24, // Nonene
      C10H20: 140.27, // Decene

      C6H6: 78.11, // Benzene
      C7H8: 92.14, // Toluene
      C8H10: 106.17, // Xylene
      C9H12: 120.19, // Trimethylbenzene
      C10H14: 134.22, // Tetramethylbenzene

      C6H10: 82.15, // Cyclohexene
      C6H12: 84.16, // Cyclohexane
      C7H14: 98.19, // Cycloheptane
      C8H16: 112.21, // Cyclooctane

      C10H8: 128.17, // Naphthalene
      C14H10: 178.23, // Anthracene
      C14H10: 178.23, // Phenanthrene
      C16H10: 202.26, // Pyrene
      C18H12: 228.29, // Chrysene

      C20H12: 252.31, // Benzo[a]pyrene
      C24H12: 300.36, // Coronene
    };

    if (hydrocarbonWeights[formula]) {
      return hydrocarbonWeights[formula];
    }

    // Otherwise, compute weight using periodic table values.
    const periodicTable = {
      H: 1.008,
      He: 4.0026,
      Li: 6.94,
      Be: 9.0122,
      B: 10.81,
      C: 12.01,
      N: 14.01,
      O: 16.0,
      F: 18.998,
      Ne: 20.18,
      Na: 22.99,
      Mg: 24.305,
      Al: 26.982,
      Si: 28.085,
      P: 30.974,
      S: 32.07,
      Cl: 35.45,
      Ar: 39.948,
      K: 39.098,
      Ca: 40.078,
      Sc: 44.956,
      Ti: 47.867,
      V: 50.942,
      Cr: 51.996,
      Mn: 54.938,
      Fe: 55.845,
      Co: 58.933,
      Ni: 58.693,
      Cu: 63.546,
      Zn: 65.38,
      Ga: 69.723,
      Ge: 72.63,
      As: 74.922,
      Se: 78.971,
      Br: 79.904,
      Kr: 83.798,
      Rb: 85.468,
      Sr: 87.62,
      Y: 88.906,
      Zr: 91.224,
      Nb: 92.906,
      Mo: 95.95,
      Tc: 98,
      Ru: 101.07,
      Rh: 102.91,
      Pd: 106.42,
      Ag: 107.87,
      Cd: 112.41,
      In: 114.82,
      Sn: 118.71,
      Sb: 121.76,
      Te: 127.6,
      I: 126.9,
      Xe: 131.29,
      Cs: 132.91,
      Ba: 137.33,
      La: 138.91,
      Ce: 140.12,
      Pr: 140.91,
      Nd: 144.24,
      Pm: 145,
      Sm: 150.36,
      Eu: 151.96,
      Gd: 157.25,
      Tb: 158.93,
      Dy: 162.5,
      Ho: 164.93,
      Er: 167.26,
      Tm: 168.93,
      Yb: 173.05,
      Lu: 174.97,
      Hf: 178.49,
      Ta: 180.95,
      W: 183.84,
      Re: 186.21,
      Os: 190.23,
      Ir: 192.22,
      Pt: 195.08,
      Au: 196.97,
      Hg: 200.59,
      Tl: 204.38,
      Pb: 207.2,
      Bi: 208.98,
      Po: 209,
      At: 210,
      Rn: 222,
      Fr: 223,
      Ra: 226,
      Ac: 227,
      Th: 232.04,
      Pa: 231.04,
      U: 238.03,
      Np: 237,
      Pu: 244,
      Am: 243,
      Cm: 247,
      Bk: 247,
      Cf: 251,
      Es: 252,
      Fm: 257,
      Md: 258,
      No: 259,
      Lr: 266,
      Rf: 267,
      Db: 270,
      Sg: 271,
      Bh: 270,
      Hs: 277,
      Mt: 278,
      Ds: 281,
      Rg: 282,
      Cn: 285,
      Nh: 286,
      Fl: 289,
      Mc: 290,
      Lv: 293,
      Ts: 294,
      Og: 294,
    };

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
    const R = 0.0821; // ideal gas constant in L·atm/(mol·K)
    return (n * R * T) / P;
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
    const oxidizingAgents = [
      "O2", // Oxygen
      "O3", // Ozone
      "H2O2", // Hydrogen Peroxide
      "KMnO4", // Potassium Permanganate
      "HNO3", // Nitric Acid
      "K2Cr2O7", // Potassium Dichromate
      "CrO3", // Chromium Trioxide
      "H2SO4", // Sulfuric Acid (concentrated)
      "Cl2", // Chlorine
      "Br2", // Bromine
      "I2", // Iodine
      "FeCl3", // Ferric Chloride
      "CuSO4", // Copper(II) Sulfate
      "MnO2", // Manganese Dioxide
      "AgNO3", // Silver Nitrate
      "NaOCl", // Sodium Hypochlorite (Bleach)
      "PbO2", // Lead(IV) Oxide
      "N2O", // Nitrous Oxide
      "NO2", // Nitrogen Dioxide
      "HClO", // Hypochlorous Acid
      "ClO2", // Chlorine Dioxide
      "HBrO", // Hypobromous Acid
      "HIO3", // Iodic Acid
      "XeF4", // Xenon Tetrafluoride
      "C2H5NO2", // Glycine Nitrate
    ];

    const reducingAgents = [
      "H2", // Hydrogen Gas
      "C", // Carbon (Graphite)
      "CO", // Carbon Monoxide
      "CH4", // Methane
      "C2H6", // Ethane
      "C6H6", // Benzene
      "Fe", // Iron
      "Zn", // Zinc
      "Al", // Aluminum
      "Mg", // Magnesium
      "Na", // Sodium
      "K", // Potassium
      "Li", // Lithium
      "Ca", // Calcium
      "Ba", // Barium
      "Sn", // Tin
      "Pb", // Lead
      "NH3", // Ammonia
      "H2S", // Hydrogen Sulfide
      "NaBH4", // Sodium Borohydride
      "LiAlH4", // Lithium Aluminum Hydride
      "SO2", // Sulfur Dioxide
      "FeSO4", // Iron(II) Sulfate
      "TiCl3", // Titanium(III) Chloride
      "Cu", // Copper
      "Cr2O3", // Chromium(III) Oxide
      "AsH3", // Arsine
      "SbH3", // Stibine
      "PH3", // Phosphine
    ];

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
    const validFuels = ["CH4", "C2H6", "C6H6"];
    const hasFuel = reactantParts.some((part) => validFuels.includes(part));
    const hasO2 = reactantParts.includes("O2");

    // Check that every required product (CO2, H2O) is present.
    const productParts = products.split("+").map((s) => s.trim());
    const hasAllProducts = requiredProducts.every((p) =>
      productParts.includes(p)
    );
    return hasFuel && hasO2 && hasAllProducts;
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
