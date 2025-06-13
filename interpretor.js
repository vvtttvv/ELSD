import { periodicTable } from "./chemistryData/core/periodicTable.js";
import { hydrocarbonWeights } from "./chemistryData/compounds/hydrocarbons/hydrocarbons.js";
import {
  oxidizingAgents,
  reducingAgents,
  validCombustionFuels,
} from "./chemistryData/reactions/redoxAgents.js";
import { physicalConstants } from "./chemistryData/core/constants.js";
import { solubilityTable } from "./chemistryData/core/solubilityTable.js";
import { extractIons } from "./chemistryData/core/extractIons.js";
import { ReactionAnalyzer } from "./chemistryData/reactionAnalyzer.js";
import { balanceEquation } from "./chemistryData/equationBalancer.js";
import { isAcid as checkIfAcid } from "./chemistryData/compounds/acids/acidTypes.js";
import { isBase as checkIfBase } from "./chemistryData/compounds/bases/baseTypes.js";


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

    if (node.type === "KEYWORD_TOKEN" && node.value === "visualize") {
      const message = this.visualize(this.evaluateArguments(node.left)[0]);
      this.outputCallback(message);
      return;
    }

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
      case "getReducings":
        return this.getReducingAgents(args[0]);
      case "getMolecWeight":
        console.log("Checking reaction possibility for:", args[0]);
        return this.getMolecularWeight(args[0]);
      case "visualize":
        return this.visualize(args[0]);
      case "getVolume":
        if (args.length === 2 && typeof args[1] === "number") { 
          return this.getVolumeFromMass(args[0], args[1]);
        } else if (args.length >= 2 && args[1] === "custom") { 
          const moles = args[0];
          const temperature = args[2] ?? physicalConstants.standardTemperature;
          const pressure = args[3] ?? physicalConstants.standardPressure;
          return this.getGasVolume(moles, temperature, pressure);
        } else {
          throw new Error("Invalid arguments for getVolume");
        }
      case "getV":
        return this.getSpecificVolume(args[0], args[1]);
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
    const reactantParts = reactants.split("+").map((s) => s.trim());
    const productParts = products.split("+").map((s) => s.trim());

    if (reactantParts.length === 2 && productParts.length === 2) {
      const hasElement = reactantParts.some((r) => this.isElement(r));
      const hasCompound = reactantParts.some((r) => this.isCompound(r));

      const productHasElement = productParts.some((p) => this.isElement(p));
      const productHasCompound = productParts.some((p) => this.isCompound(p));

      if (
        hasElement &&
        hasCompound &&
        productHasElement &&
        productHasCompound
      ) {
        return true;
      }
    }
    return false;
  }

  isSynthesisOrDecomposition(reactants, products) {
    const reactantParts = reactants.split("+").map((s) => s.trim());
    const productParts = products.split("+").map((s) => s.trim());

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
    const reactantParts = reactants.split("+").map((s) => s.trim());

    const hasOxidizer = reactantParts.some((r) => oxidizingAgents.includes(r));
    const hasReducer = reactantParts.some((r) => reducingAgents.includes(r));

    return hasOxidizer && hasReducer;
  }

  isReactionPossible(reactionString) {
    if (!this.reactionAnalyzer) {
      this.reactionAnalyzer = new ReactionAnalyzer();
    }

    // Check if the reaction should use concentrated acid
    const isConcentrated = reactionString.includes("conc") || 
                          reactionString.includes("concentrated");
    
    // Clean the reaction string if needed
    let cleanReactionString = reactionString;
    if (isConcentrated) {
      cleanReactionString = reactionString
        .replace(/conc\s+/g, '')
        .replace(/concentrated\s+/g, '');
    }

    // Get full reaction analysis
    const analysis = this.reactionAnalyzer.analyzeReaction(cleanReactionString, {
      concentratedAcid: isConcentrated
    });
    
    if (analysis?.predictedProducts) {
      analysis.predictedProducts = analysis.predictedProducts.map(product => 
        product === "CaCO0" ? "CaCO3" : product
      );
      
      // Double-check product matching
      if (analysis.givenProducts && analysis.predictedProducts) {
        // Normalize both arrays for comparison
        const normalizedPredicted = [...analysis.predictedProducts].sort();
        const normalizedGiven = [...analysis.givenProducts].sort();
        
        // Update the productsMatch property
        analysis.productsMatch = normalizedPredicted.length === normalizedGiven.length && 
                                normalizedPredicted.every((product, index) => 
                                  product === normalizedGiven[index]);
      }
    }
    
    // Detailed output
    let message = `The reaction "${reactionString}" is ${analysis?.possible ? "chemically possible" : "not chemically possible"}`;
    
    if (analysis) {
      if (!analysis.possible && analysis.error) {
        message += `: ${analysis.error}`;
      } else {
        message += ".<br>";
        
        // Add reaction conditions if available
        if (analysis.conditions && analysis.conditions.length > 0) {
          message += `<br>✓ Conditions: ${analysis.conditions.join(", ")}`;
        }
        
        // Add information about reactants if available
        if (analysis.reactantTypes) {
          message += "<br><br>🧪 Reactant information:";
          for (const [formula, type] of Object.entries(analysis.reactantTypes)) {
            message += `<br>  • ${formula}: ${type}`;
          }
        }
      }
    }
    message += "<br><br>";
    
    this.outputCallback(message);
    return analysis?.possible || false;
  }

  resolveReaction(reactionString) {
    if (!this.reactionAnalyzer) {
      // Pass parseFormula from Interpretor to ReactionAnalyzer
      this.reactionAnalyzer = new ReactionAnalyzer(
        this.parseFormula.bind(this)
      );
    }
    console.log(reactionString);
    console.log(this.reactionAnalyzer);
    console.log(this.parseFormula);
    return balanceEquation(reactionString, this.parseFormula.bind(this));
  }

  getOxidizingAgents(reactionString) {
    const agents = this.findRedoxAgents(reactionString).oxidizing;
    if (!agents || agents.length === 0) return "No oxidizing agents found.";
    return agents.map(agent => `Oxidizing Agent: ${agent}`).join("\n");
  }

  getReducingAgents(reactionString) {
    const agents = this.findRedoxAgents(reactionString).reducing;
    if (!agents || agents.length === 0) return "No reducing agents found.";
    return agents.map(agent => `Reducing Agent: ${agent}`).join("\n");
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
    this.outputCallback(
      "visualize() expects a valid molecule string (e.g., 'C6H6')."
    );
    return;
  }

  this.outputCallback("Visualizing formula: " + input);

  // Try multiple chemistry APIs to convert input to SMILES
  this.tryMultipleAPIs(input).then((smiles) => {
    if (smiles) {
      this.outputCallback("Chemistry API returned SMILES: " + smiles);

      // Check current visualization mode
      const currentMode = window.getVisualizationMode ? window.getVisualizationMode() : 'kekule';
      
      if (currentMode === 'jsmol') {
        this.outputCallback("Rendering with JSmol...");
        this.renderWithJSmol(smiles);
        // Update status indicator
        if (window.updateVisualizationStatus) {
          window.updateVisualizationStatus('jsmol', true);
        }
      } else {
        this.outputCallback("Rendering with Kekule.js...");
        this.renderMolecule(smiles);
        // Update status indicators
        if (window.updateVisualizationStatus) {
          window.updateVisualizationStatus('2d', true);
          window.updateVisualizationStatus('3d', true);
        }
      }

    } else {
      this.outputCallback(
        `Could not convert "${input}" to a valid molecular structure.`
      );
      this.outputCallback(
        "Please try a different notation or a common chemical name."
      );
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
        const formulaUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/formula/${encodeURIComponent(
          input
        )}/cids/JSON`;
        const formulaResp = await fetch(formulaUrl);
        const formulaData = await formulaResp.json();

        if (formulaData?.Waiting?.ListKey) {
          const listKey = formulaData.Waiting.ListKey;
          this.outputCallback(
            `Waiting for PubChem response. ListKey: ${listKey}`
          );
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
        const nameUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
          input
        )}/cids/JSON`;
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
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }

    throw new Error("PubChem async request timed out or failed.");
  }

  async tryCIRApi(input) {
    try {
      this.outputCallback("Trying CIR API with input: " + input);
      this.outputCallback(
        "Connecting to Chemical Identifier Resolver online database..."
      );

      const response = await fetch(
        `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(
          input
        )}/smiles`
      );
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

  initRDKitModule()
    .then((RDKit) => {
      try {
        this.outputCallback("Creating molecule from SMILES...");
        const mol = RDKit.get_mol(smiles);

        if (!mol) {
          this.outputCallback("RDKit failed to create molecule.");
          return;
        }

        const atomCount = mol.get_num_atoms();
        this.outputCallback(
          `Molecule created successfully with ${atomCount} atoms`
        );

        const molBlock = mol.get_molblock();
        this.outputCallback("MolBlock created successfully");

        try {
          this.outputCallback("Loading into Kekule.js...");
          const kekuleMol = Kekule.IO.loadFormatData(molBlock, "mol");
          
          // Render 2D view
          const parentElem2D = document.getElementById("visualize");
          Kekule.DomUtils.clearChildContent(parentElem2D);

          const viewer2d = new Kekule.ChemWidget.Viewer(parentElem2D);
          viewer2d.setChemObj(kekuleMol);
          viewer2d.setRenderType(Kekule.Render.RendererType.R2D);  
          viewer2d.setPredefinedSetting('fullFunc');
          viewer2d.setMoleculeDisplayType(Kekule.Render.Molecule2DDisplayType.SKELETAL);
          
          // Enhanced 2D styling
          var color2DConfigs = viewer2d.getRenderConfigs().getColorConfigs();
          color2DConfigs.setAtomColor('#2c3e50').setBondColor('#34495e');
          color2DConfigs.setGlyphStrokeColor('#7f8c8d');
          color2DConfigs.setLabelColor('#2c3e50');

          viewer2d.setEnableToolbar(true);
          viewer2d.repaint();

          // Render 3D view
          const parentElem3D = document.getElementById('visualize3d');
          Kekule.DomUtils.clearChildContent(parentElem3D);
          
          const viewer3d = new Kekule.ChemWidget.Viewer(parentElem3D);
          viewer3d.setRenderType(Kekule.Render.RendererType.R3D);
          viewer3d.setChemObj(kekuleMol);
          viewer3d.setEnableToolbar(true);
          viewer3d.setPredefinedSetting('ballStick');
          
          // Enhanced 3D styling
          var display3DConfigs = viewer3d.getRenderConfigs().getMoleculeDisplayConfigs();
          display3DConfigs.setDefAtomColor('#ecf0f1').setDefBondColor('#3498db');
          display3DConfigs.setUseAtomSpecifiedColor(false);
          
          viewer3d.requestRepaint();

          this.outputCallback(`Visualization complete. SMILES: ${smiles}`);

        } catch (e) {
          this.outputCallback(`Error in Kekule rendering: ${e.message}`);
          if (window.updateVisualizationStatus) {
            window.updateVisualizationStatus('2d', false);
            window.updateVisualizationStatus('3d', false);
          }
        }
      } catch (e) {
        this.outputCallback(`Error creating molecule: ${e.message}`);
      }
    })
    .catch((err) => {
      this.outputCallback(`RDKit initialization error: ${err.message}`);
    });
}

  getVolumeFromMass(mass, density) {
    const m = this.ensureNumber(mass, "mass");
    const d = this.ensureNumber(density, "density");
    return m / d;
  }
   
  getGasVolume(moles, temperature, pressure) {
    const n = this.ensureNumber(moles, "moles");
    const T = this.ensureNumber(temperature, "temperature");
    const P = this.ensureNumber(pressure, "pressure");
    return (n * physicalConstants.R * T) / P;
  }


  getSpecificVolume(volume, mass) {
    const V = this.ensureNumber(volume, "volume");
    const m = this.ensureNumber(mass, "mass");
    return V / m;
  }


  ensureNumber(value, name) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Invalid ${name}: Must be a number. Received "${value}"`);
    }
    return num;
  }

 parseFormula(formula) {
  if (!formula || typeof formula !== "string") {
    throw new Error("Formula must be a non-empty string.");
  }

  const stack = [{}];
  const regex = /([A-Z][a-z]*)(\d*)|(\()|(\))(\d*)/g;
  let match;
  let openParens = 0;

  while ((match = regex.exec(formula))) {
    if (match[1]) {
      // Element + optional count
      const el = match[1];
      const count = parseInt(match[2] || "1");
      const top = stack[stack.length - 1];
      top[el] = (top[el] || 0) + count;
    } else if (match[3]) {
      // Opening parenthesis
      stack.push({});
      openParens++;
    } else if (match[4]) {
      // Closing parenthesis
      if (stack.length === 1) {
        throw new Error(`Unexpected closing parenthesis in "${formula}"`);
      }
      openParens--;
      const group = stack.pop();
      const multiplier = parseInt(match[5] || "1");
      const top = stack[stack.length - 1];
      for (const el in group) {
        top[el] = (top[el] || 0) + group[el] * multiplier;
      }
    }
  }

  if (openParens !== 0 || stack.length !== 1) {
    throw new Error(`Unbalanced parentheses in formula "${formula}"`);
  }

  const result = Object.entries(stack[0]);
  if (result.length === 0) {
    throw new Error(`Failed to parse any elements from formula "${formula}"`);
  }

  return result;
}




  findRedoxAgents(reactionStr) {
    if (!reactionStr || typeof reactionStr !== "string") {
      return { oxidizing: [], reducing: [] };
    }

    const parts = reactionStr.split("->");
    const reactants = parts[0].split("+").map(r => r.trim());

    const foundOxidizers = reactants.filter(r => oxidizingAgents.includes(r));
    const foundReducers = reactants.filter(r => reducingAgents.includes(r));

    return {
      oxidizing: foundOxidizers,
      reducing: foundReducers
    };
  }


  isCombustionReaction(reactants, products, requiredProducts) {
    // Check that one valid fuel is present, along with O2 on the reactant side.
    const reactantParts = reactants.split("+").map((s) => s.trim());
    const hasFuel = reactantParts.some((part) =>
      validCombustionFuels.includes(part)
    );
    const hasO2 = reactantParts.includes("O2");

    // Check that every required product (CO2, H2O) is present.
    const productParts = products.split("+").map((s) => s.trim());
    const hasAllProducts = requiredProducts.every((p) =>
      productParts.includes(p)
    );
    return hasFuel && hasO2 && hasAllProducts;
  }

  // Functions for checking whether the substance is Acid or Base
  isAcid(formula) {
    try {
      return checkIfAcid(formula);
    } catch (err) {
      console.error("isAcid error:", err);
      return false;
    }
  }

  isBase(formula) {
    try {
      return checkIfBase(formula);
    } catch (err) {
      console.error("isBase error:", err);
      return false;
    }
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

  renderWithJSmol(smiles) {
  if (!smiles) {
    this.outputCallback("No valid SMILES to render for JSmol.");
    return;
  }

  this.outputCallback("Initializing JSmol with enhanced features...");

  const Info = {
    width: "100%",
    height: "100%",
    use: "HTML5",
    j2sPath: "https://chemapps.stolaf.edu/jmol/jsmol/j2s",
    script: `
      load $${smiles}; 
      background white;
      set antialiasDisplay true;
      set ambientPercent 20;
      set diffusePercent 80;
      set specular true;
      set specularPercent 10;
      set spinX 1; set spinY 1; set spinZ 0;
      spin on;
      set frank off;
      color bonds lightgray;
      spacefill 20%;
      wireframe 0.15;
    `,
    debug: false,
    disableInitialConsole: true,
    disableJ2SLoadMonitor: true,
    readyFunction: function(applet) {
      console.log("JSmol applet is ready");
      if (window.updateVisualizationStatus) {
        window.updateVisualizationStatus('jsmol', true);
      }
    },
    loadStructCallback: function(applet, fullPathName, fileName, modelName, errorMsg, ptLoad) {
      if (errorMsg) {
        console.error("JSmol load error:", errorMsg);
        if (window.updateVisualizationStatus) {
          window.updateVisualizationStatus('jsmol', false);
        }
      } else {
        console.log("JSmol structure loaded successfully");
      }
    }
  };

  const jsmolContainer = document.getElementById("jsmolContainer");
  jsmolContainer.innerHTML = "";  // clear previous
  
  try {
    jsmolContainer.innerHTML = Jmol.getAppletHtml("jsmolApplet0", Info);
    this.outputCallback("JSmol visualization initialized successfully.");
    
    // Add some interactive controls
    setTimeout(() => {
      this.addJSmolControls();
    }, 2000);
    
  } catch (error) {
    this.outputCallback(`JSmol initialization error: ${error.message}`);
    if (window.updateVisualizationStatus) {
      window.updateVisualizationStatus('jsmol', false);
    }
  }
}

addJSmolControls() {
  try {
    // Create control panel if it doesn't exist
    let controlPanel = document.getElementById('jsmolControls');
    if (!controlPanel) {
      controlPanel = document.createElement('div');
      controlPanel.id = 'jsmolControls';
      controlPanel.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(255,255,255,0.9);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        font-size: 12px;
        z-index: 1000;
      `;
      
      controlPanel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold;">JSmol Controls:</div>
        <button onclick="Jmol.script(jsmolApplet0, 'spin on')" style="margin: 2px; padding: 4px 8px; font-size: 11px;">Spin On</button>
        <button onclick="Jmol.script(jsmolApplet0, 'spin off')" style="margin: 2px; padding: 4px 8px; font-size: 11px;">Spin Off</button><br>
        <button onclick="Jmol.script(jsmolApplet0, 'spacefill 100%')" style="margin: 2px; padding: 4px 8px; font-size: 11px;">Space Fill</button>
        <button onclick="Jmol.script(jsmolApplet0, 'wireframe only')" style="margin: 2px; padding: 4px 8px; font-size: 11px;">Wireframe</button><br>
        <button onclick="Jmol.script(jsmolApplet0, 'spacefill 20%; wireframe 0.15')" style="margin: 2px; padding: 4px 8px; font-size: 11px;">Ball & Stick</button>
      `;
      
      const jsmolContainer = document.getElementById("jsmolContainer");
      jsmolContainer.style.position = 'relative';
      jsmolContainer.appendChild(controlPanel);
    }
  } catch (error) {
    console.error("Error adding JSmol controls:", error);
  }
}
}
