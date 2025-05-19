import { periodicTable } from './chemistryData/core/periodicTable.js';
import { hydrocarbonWeights } from './chemistryData/compounds/hydrocarbons/hydrocarbons.js';
import { oxidizingAgents, reducingAgents, validCombustionFuels } from './chemistryData/reactions/redoxAgents.js';
import { physicalConstants } from './chemistryData/core/constants.js';
import { solubilityTable } from './chemistryData/core/solubilityTable.js';
import { extractIons } from './chemistryData/core/extractIons.js';
import { ReactionAnalyzer } from './chemistryData/reactionAnalyzer.js';
import { balanceEquation } from './chemistryData/equationBalancer.js';

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
          console.warn(`Warning: Undefined variable: ${node.value}`);
          return null;
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
        console.log("Checking reaction possibility for:", args[0]);
        return this.getMolecularWeight(args[0]);
      case "visualize":
        return this.visualize(args[0]);
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

  isElement(compound) {
    return /^[A-Z][a-z]?$/.test(compound.trim()); // Zn, O, Fe, etc.
  }
  
  isCompound(compound) {
    return /[A-Z][a-z]?[0-9]?/.test(compound.trim()) && compound.length > 1;
  }

  // like Fe + CuSO4 = FeSO4 + Cu
  isSingleReplacementReaction(reactants, products) {
    const reactantParts = reactants.split("+").map(s => s.trim());
    const productParts = products.split("+").map(s => s.trim());
  
    if (reactantParts.length === 2 && productParts.length === 2) {
      const hasElement = reactantParts.some(r => this.isElement(r));
      const hasCompound = reactantParts.some(r => this.isCompound(r));
  
      const productHasElement = productParts.some(p => this.isElement(p));
      const productHasCompound = productParts.some(p => this.isCompound(p));
  
      if (hasElement && hasCompound && productHasElement && productHasCompound) {
        return true;
      }
    }
    return false;
  }

  isSynthesisOrDecomposition(reactants, products) {
    const reactantParts = reactants.split("+").map(s => s.trim());
    const productParts = products.split("+").map(s => s.trim());
  
    // A + B → AB
    if (reactantParts.length >= 2 && productParts.length === 1) {
      return true;
    }
  
    // AB → A + B
    if (reactantParts.length === 1 && productParts.length >= 2) {
      return true;
    }
  
    return false;
  }

  isRedoxReaction(reactants) {
    const reactantParts = reactants.split("+").map(s => s.trim());
  
    const hasOxidizer = reactantParts.some(r => oxidizingAgents.includes(r));
    const hasReducer = reactantParts.some(r => reducingAgents.includes(r));
  
    return hasOxidizer && hasReducer;
  }  
  

  isReactionPossible(reactionString) {
    if (!this.reactionAnalyzer) {
      this.reactionAnalyzer = new ReactionAnalyzer();
    }
  
    const result = this.reactionAnalyzer.isPossible(reactionString, {
      concentratedAcid: reactionString.includes("conc") || reactionString.includes("concentrated")
    });
  
    const msg = `The reaction "${reactionString}" is ${result ? "" : "not "}chemically possible.`;
    this.outputCallback(msg);
  
    return result;
  }  


  resolveReaction(reactionString) {
    if (!this.reactionAnalyzer) {
      // Pass parseFormula from Interpretor to ReactionAnalyzer
      this.reactionAnalyzer = new ReactionAnalyzer(this.parseFormula.bind(this));
    }
      return balanceEquation(reactionString, this.parseFormula.bind(this));
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

  visualize(input) {
  if (!input || typeof input !== "string") {
    this.outputCallback("visualize() expects a valid molecule string (e.g., 'C6H6').");
    return;
  }

  this.outputCallback("Visualizing formula: " + input);
  
  // Try multiple chemistry APIs to convert input to SMILES
  this.tryMultipleAPIs(input)
    .then(smiles => {
      if (smiles) {
        this.outputCallback("Chemistry API returned SMILES: " + smiles);
        this.renderMolecule(smiles);
      } else {
        this.outputCallback(`Could not convert "${input}" to a valid molecular structure.`);
        this.outputCallback("Please try a different notation or a common chemical name.");
      }
    });
  }

// Try multiple APIs in sequence
async tryMultipleAPIs(input) {
  // Try PubChem first (best for formulas)
  try {
    const pubchemResult = await this.tryPubChemAPI(input);
    if (pubchemResult) {
      return pubchemResult;
    }
  } catch (error) {
    this.outputCallback(`PubChem API error: ${error.message}`);
  }
  
  // Then try CIR API
  try {
    const cirResult = await this.tryCIRApi(input);
    if (cirResult) {
      return cirResult;
    }
  } catch (error) {
    this.outputCallback(`CIR API error: ${error.message}`);
  }
  
  return null; // Both APIs failed
}

async tryPubChemAPI(input) {
  this.outputCallback("Querying PubChem API...");

  const isFormula = /^([A-Z][a-z]?\d*)+$/.test(input.trim());

  try {
    let cid = null;

    if (isFormula) {
      const formulaUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/formula/${encodeURIComponent(input)}/cids/JSON`;
      const formulaResp = await fetch(formulaUrl);
      const formulaData = await formulaResp.json();

      if (formulaData?.Waiting?.ListKey) {
        const listKey = formulaData.Waiting.ListKey;
        this.outputCallback(`Waiting for PubChem response. ListKey: ${listKey}`);
        cid = await this.pollForCID(listKey);
      } else {
        const cidList = formulaData?.IdentifierList?.CID;
        if (!cidList || cidList.length === 0) {
          this.outputCallback("No CIDs found for formula.");
          return null;
        }
        cid = cidList[0];
      }
    } else {
      const nameUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(input)}/cids/JSON`;
      const nameResp = await fetch(nameUrl);
      const nameData = await nameResp.json();
      cid = nameData?.IdentifierList?.CID?.[0];
      if (!cid) {
        this.outputCallback("No CID found for compound name.");
        return null;
      }
    }

    const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/CanonicalSMILES,IUPACName/JSON`;
    const propResp = await fetch(propUrl);
    const propData = await propResp.json();
    const props = propData?.PropertyTable?.Properties?.[0];

    if (!props || !props.CanonicalSMILES) {
      this.outputCallback("No SMILES found for CID.");
      return null;
    }

    this.outputCallback(`IUPAC Name: ${props.IUPACName}`);
    this.outputCallback(`PubChem returned SMILES: ${props.CanonicalSMILES}`);
    return props.CanonicalSMILES;

  } catch (error) {
    this.outputCallback(`PubChem API error: ${error.message}`);
    return null;
  }
}

async pollForCID(listKey, retries = 10, delay = 1000) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/listkey/${listKey}/cids/JSON`;

  for (let i = 0; i < retries; i++) {
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.IdentifierList?.CID?.length > 0) {
      return data.IdentifierList.CID[0];
    }

    if (data.Waiting) {
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      break;
    }
  }

  throw new Error("PubChem async request timed out or failed.");
}



async tryCIRApi(input) {
  try {
    this.outputCallback("Trying CIR API with input: " + input);
    this.outputCallback("Connecting to Chemical Identifier Resolver online database...");
    
    const response = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(input)}/smiles`);
    if (response.ok) {
      const smiles = await response.text();
      this.outputCallback("Found molecule in online chemical database.");
      this.outputCallback("CIR API returned SMILES: " + smiles);
      return smiles;
    }
    this.outputCallback(`CIR API could not resolve: ${input}`);
    return null;
  } catch (error) {
    this.outputCallback(`CIR API error: ${error.message}`);
    return null;
  }
}

renderMolecule(smiles) {
  if (!smiles) {
    this.outputCallback("No valid SMILES to render.");
    return;
  }
  
  this.outputCallback("Rendering SMILES: " + smiles);
  
  initRDKitModule().then(RDKit => {
    try {
      this.outputCallback("Creating molecule from SMILES...");
      const mol = RDKit.get_mol(smiles);
      
      if (!mol) {
        this.outputCallback("RDKit failed to create molecule.");
        return;
      }
      
      try {
        const atomCount = mol.get_num_atoms();
        this.outputCallback(`Molecule created successfully with ${atomCount} atoms`);
      } catch (e) {
        this.outputCallback("Failed to get atom count: " + e.message);
      }
      
      const molBlock = mol.get_molblock();
      this.outputCallback("MolBlock created successfully");
      
      try {
        this.outputCallback("Loading into Kekule.js...");
        const kekuleMol = Kekule.IO.loadFormatData(molBlock, 'mol');
        const parentElem = document.getElementById('visualize');
        
        Kekule.DomUtils.clearChildContent(parentElem);
        this.outputCallback("Cleared visualization area");
        
        // for the visualization area
        parentElem.style.height = '300px';
        parentElem.style.width = '500px';
        parentElem.style.border = '5px solid red';
        parentElem.style.backgroundColor = 'white';
        parentElem.style.margin = '20px auto';
        parentElem.style.display = 'block'; 
        parentElem.style.zIndex = '1000'; 
        this.outputCallback("Set visualization area styles");
        
        this.outputCallback("Creating drawing context...");
        const drawBridgeManager = Kekule.Render.DrawBridge2DMananger;
        const drawBridge = drawBridgeManager.getPreferredBridgeInstance();
        
        const context = drawBridge.createContext(parentElem, 500, 300);
        
        try {
          drawBridge.drawRect(context, 100, 100, 300, 500, {strokeColor: '#FF0000', fillColor: '#FFCCCC'});
          this.outputCallback("Drew test rectangle - if you can't see it, rendering context has issues");
        } catch(e) {
          this.outputCallback("Failed to draw test shape: " + e.message);
        }
        
        this.outputCallback("Creating renderer...");
        const rendererClass = Kekule.Render.get2DRendererClass(kekuleMol);
        const renderer = new rendererClass(kekuleMol, drawBridge);
        const configObj = Kekule.Render.Render2DConfigs.getInstance();
        const options = Kekule.Render.RenderOptionUtils.convertConfigsToPlainHash(configObj);
        options.zoom = 3.0;
        
        this.outputCallback("Drawing molecule...");
        renderer.draw(context, {x: 250, y: 150}, options);
        
        this.outputCallback(`Visualization complete. SMILES: ${smiles}`);
        
        const statusDiv = document.createElement('div');
        statusDiv.textContent = "Visualization attempt complete - check area below";
        statusDiv.style.color = "blue";
        statusDiv.style.fontWeight = "bold";
        document.getElementById('output').appendChild(statusDiv);
        
      } catch (e) {
        this.outputCallback(`Error in Kekule rendering: ${e.message}`);
      }
    } catch (e) {
      this.outputCallback(`Error creating molecule: ${e.message}`);
    }
  }).catch(err => {
    this.outputCallback(`RDKit initialization error: ${err.message}`);
  });
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
