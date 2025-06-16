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
import { explainBalancingSteps } from "./chemistryData/explainBalancingSteps.js";
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
      const args = this.evaluateArguments(node.left);
      const formula = args[0];
      const options = args[1] || null;
      
      // Parse options if it's a string (for cases like visualize("C6H6", "jsmol"))
      let parsedOptions = options;
      if (typeof options === "string") {
        if (options === "jsmol") {
          parsedOptions = { mode: "jsmol" };
        } else {
          // Try to parse as JSON string
          try {
            parsedOptions = JSON.parse(options);
          } catch (e) {
            // Try to parse simple key:value syntax
            parsedOptions = this.parseSimpleOptions(options);
            if (!parsedOptions) {
              this.outputCallback("Warning: Could not parse options. Using default settings.");
              parsedOptions = null;
            }
          }
        }
      }
      
      this.visualize(formula, parsedOptions);
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
        return this.resolveReaction(args[0], args[1] || "balanced");
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
        
        // Add reaction type if available
        if (analysis.reactionType) {
          const formattedType = analysis.reactionType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          message += `<br>⚗️ Reaction type: ${formattedType}`;
        }
        
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
        
        // Add predicted products information
        if (analysis.predictedProducts && analysis.predictedProducts.length > 0) {
          message += "<br><br>🔬 Predicted products: " + analysis.predictedProducts.join(" + ");
          
          // Show comparison with given products
          if (analysis.givenProducts && analysis.givenProducts.length > 0) {
            message += "<br>📝 Given products: " + analysis.givenProducts.join(" + ");
            
            if (analysis.productsMatch !== undefined) {
              if (analysis.productsMatch) {
                message += "<br>✅ The predicted products match the given products.";
              } else {
                message += "<br>❌ The predicted products differ from the given products.";
              }
            }
          }
        }
      }
    }
    message += "<br><br>";
    
    this.outputCallback(message);
    return analysis?.possible || false;
  }

  resolveReaction(reactionString, mode = "balanced") {
    if (!this.reactionAnalyzer) {
      this.reactionAnalyzer = new ReactionAnalyzer(
        this.parseFormula.bind(this)
      );
    }

    if (mode === "raw") {
      const [lhs, rhs] = reactionString.split("->");
      const reactants = lhs ? lhs.split("+").map(r => r.trim()) : [];
      const products = rhs ? rhs.split("+").map(p => p.trim()) : [];

      return `Reactants: ${reactants.join(", ")} <br> Products: ${products.join(", ")}`;
    }


    if (mode === "steps") {
      return explainBalancingSteps(reactionString, this.parseFormula.bind(this));
    }

    // Default: balanced mode
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

  visualize(input, options = null) {
    if (!input || typeof input !== "string") {
      this.outputCallback(
        "visualize() expects a valid molecule string (e.g., 'C6H6')."
      );
      return;
    }

    // If options is provided and contains mode: "jsmol", force JSmol mode
    if (options && options.mode === "jsmol") {
      this.outputCallback("Visualizing formula: " + input);
      this.outputCallback("Mode: JSmol (forced by options)");
      
      // Switch to JSmol mode if not already active
      this.ensureJSmolMode().then(() => {
        // Try multiple chemistry APIs to convert input to SMILES
        this.tryMultipleAPIs(input).then((smiles) => {
          if (smiles) {
            this.outputCallback("Chemistry API returned SMILES: " + smiles);
            this.outputCallback("Rendering with JSmol...");
            this.renderWithJSmol(smiles, options);
          } else {
            this.outputCallback(
              `Could not convert "${input}" to a valid molecular structure.`
            );
            this.outputCallback(
              "Please try a different notation or a common chemical name."
            );
          }
        });
      });
      return;
    }

    // Default behavior (unchanged)
    this.outputCallback("Visualizing formula: " + input);

    // Try multiple chemistry APIs to convert input to SMILES
    this.tryMultipleAPIs(input).then((smiles) => {
      if (smiles) {
        this.outputCallback("Chemistry API returned SMILES: " + smiles);

        // Check current visualization mode
        const currentMode = window.getVisualizationMode ? window.getVisualizationMode() : 'kekule';
        
        this.outputCallback(`Current visualization mode: ${currentMode}`);
        
        if (currentMode === 'jsmol') {
          this.outputCallback("Rendering with JSmol...");
          this.renderWithJSmol(smiles, options);
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

  // Helper function to ensure JSmol mode is active
  async ensureJSmolMode() {
    const currentMode = window.getVisualizationMode ? window.getVisualizationMode() : 'kekule';
    if (currentMode !== 'jsmol') {
      this.outputCallback("Switching to JSmol mode...");
      // Trigger the mode switch
      const toggle = document.getElementById('visualizationToggle');
      if (toggle) {
        toggle.click();
        // Wait a bit for the mode switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
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

      // Get comprehensive molecular data
      const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/CanonicalSMILES,IUPACName,MolecularFormula,MolecularWeight,HeavyAtomCount/JSON`;
      const propResp = await fetch(propUrl);
      const propData = await propResp.json();
      const props = propData?.PropertyTable?.Properties?.[0];

      if (!props || !props.CanonicalSMILES) {
        this.outputCallback("No SMILES found for CID.");
        return null;
      }

      // Store molecular data globally for the info panel
      window.currentMoleculeData = {
        name: props.IUPACName || input,
        formula: props.MolecularFormula || 'Unknown',
        weight: props.MolecularWeight || 'N/A',
        atomCount: props.HeavyAtomCount || 'N/A',
        smiles: props.CanonicalSMILES,
        source: 'PubChem'
      };

      this.outputCallback(`IUPAC Name: ${props.IUPACName}`);
      this.outputCallback(`Molecular Formula: ${props.MolecularFormula}`);
      this.outputCallback(`Molecular Weight: ${props.MolecularWeight} g/mol`);
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
        
        // Store basic molecular data from CIR (limited info available)
        window.currentMoleculeData = {
          name: input,
          formula: 'Unknown', // CIR doesn't provide formula directly
          weight: 'N/A',
          atomCount: 'N/A',
          smiles: smiles,
          source: 'CIR'
        };
        
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

  async getMolBlockFromSmiles(smiles, use3D = false) {
    if (!smiles || typeof smiles !== "string") {
      throw new Error("Invalid SMILES string.");
    }

    const RDKit = await initRDKitModule();
    const mol = RDKit.get_mol(smiles);

    if (!mol) {
      throw new Error("RDKit failed to parse SMILES.");
    }

    if (use3D && mol.EmbedMolecule) {
      try {
        mol.EmbedMolecule();
        if (mol.MMFFOptimizeMolecule) {
          mol.MMFFOptimizeMolecule();
        }
      } catch (e) {
        console.warn("3D embedding failed, falling back to 2D.", e);
      }
    }

    let molBlock = mol.get_molblock();

    // Check if the MOL block is 3D (z-coords not all zero)
    const lines = molBlock.split('\n');
    let has3D = false;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4 && parts[3] !== "0.0000") {
        has3D = true;
        break;
      }
    }
    if (use3D && !has3D) {
      console.warn("Warning: 3D coordinates not generated, MOL block is 2D. JSmol may not render correctly.");
    }

    if (!molBlock) {
      throw new Error("Failed to generate MOL block from SMILES.");
    }

    return molBlock;
  }


  async renderMolecule(smiles) {
  try {
    const molBlock = await this.getMolBlockFromSmiles(smiles, false);
    this.outputCallback("Rendering molecule with Kekule.js...");

    const kekuleMol = Kekule.IO.loadFormatData(molBlock, "mol");

    // Render 2D
    const parentElem2D = document.getElementById("visualize");
    Kekule.DomUtils.clearChildContent(parentElem2D);

    const viewer2d = new Kekule.ChemWidget.Viewer(parentElem2D);
    viewer2d.setChemObj(kekuleMol);
    viewer2d.setRenderType(Kekule.Render.RendererType.R2D);
    viewer2d.setPredefinedSetting('fullFunc');
    viewer2d.setMoleculeDisplayType(Kekule.Render.Molecule2DDisplayType.SKELETAL);
    viewer2d.setEnableToolbar(true);
    viewer2d.repaint();

    // Render 3D
    const parentElem3D = document.getElementById('visualize3d');
    Kekule.DomUtils.clearChildContent(parentElem3D);

    const viewer3d = new Kekule.ChemWidget.Viewer(parentElem3D);
    viewer3d.setChemObj(kekuleMol);
    viewer3d.setRenderType(Kekule.Render.RendererType.R3D);
    viewer3d.setPredefinedSetting('ballStick');
    viewer3d.setEnableToolbar(true);
    viewer3d.repaint();
  } catch (error) {
    this.outputCallback("Kekule.js rendering error: " + error.message);
  }
}

async renderWithJSmol(smiles, options) {
  const jsmolContainer = document.getElementById("jsmolContainer");
  if (!jsmolContainer) {
    this.outputCallback("Error: JSmol container not found.");
    return;
  }

  if (typeof Jmol === "undefined") {
    this.outputCallback("Error: JSmol library not loaded.");
    return;
  }

  // Convert SMILES to MOL block
  let molBlock;
  try {
    molBlock = await this.getMolBlockFromSmiles(smiles, true);
  } catch (err) {
    this.outputCallback("Error converting SMILES: " + err.message);
    return;
  }

  jsmolContainer.innerHTML = "";
  const appletId = "jsmolApplet_" + Date.now();
  const info = {
    width: 600,
    height: 600,
    use: "HTML5",
    j2sPath: "./jsmol/j2s",
    debug: false,
    readyFunction: (applet) => {
      this.outputCallback("JSmol applet ready. Loading molecule...");
      console.log("MOL block for JSmol:", molBlock);
      
      // Build initial script based on options or defaults
      const defaultOptions = {
        style: "ballstick",
        background: "white",
        quality: "high",
        dipoles: "hide",
        mep: "off"
      };
      
      const appliedOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
      
      let script = `load DATA "model"\n${molBlock}\nEND "model"; `;
      
      // Apply background
      script += `background ${appliedOptions.background}; `;
      
      // Apply quality settings
      if (appliedOptions.quality === "high") {
        script += `set antialiasDisplay true; set ambient 40; set diffuse 80; set specular 80; set specularPower 40; `;
      } else {
        script += `set antialiasDisplay false; set ambient 20; set diffuse 60; set specular 0; `;
      }
      
      // Apply base style
      script += `color atoms cpk; `;
      
      // Apply representation style
      switch(appliedOptions.style) {
        case "ballstick":
          script += `spacefill 20%; wireframe 0.15; `;
          break;
        case "stick":
          script += `spacefill off; wireframe 0.3; `;
          break;
        case "spacefill":
          script += `spacefill 100%; wireframe off; `;
          break;
        case "wireframe":
          script += `spacefill off; wireframe 0.05; `;
          break;
      }
      
      script += `zoom 120; rotate best;`;
      
      Jmol.script(applet, script);
      this.outputCallback("Molecule loaded!");
      
      // Apply additional options after initial load
      setTimeout(() => {
        this.applyJSmolOptions(applet, appliedOptions);
        
        // Update molecule information panel
        if (window.updateMoleculeInfo) {
          window.updateMoleculeInfo();
        }
      }, 1000);
      
      // Set initial button states based on applied options
      setTimeout(() => {
        this.updateButtonStates(appliedOptions);
      }, 500);
      
      if (window.updateVisualizationStatus) {
        window.updateVisualizationStatus("jsmol", true);
      }
    }
  };

  // Create the applet
  const applet = Jmol.getApplet(appletId, info);
  jsmolContainer.innerHTML = Jmol.getAppletHtml(applet);
  window.currentJsmolApplet = applet;
}

  // Helper function to apply additional JSmol options after molecule is loaded
  applyJSmolOptions(applet, options) {
    try {
      // Apply dipoles
      if (options.dipoles === "show") {
        if (options.dipoles.includes("bond") || options.dipoles === "show") {
          Jmol.script(applet, `dipole bonds on; vectors on; vector scale 3.0; color vectors red;`);
          this.outputCallback("Bond dipoles displayed");
        }
        if (options.dipoles.includes("overall") || options.dipoles === "show") {
          Jmol.script(applet, `dipole molecular on; vector on; vector scale 5.0; color vector blue;`);
          this.outputCallback("Overall dipole displayed");
        }
      }
      
      // Apply MEP surface
      if (options.mep && options.mep !== "off") {
        let mepScript;
        if (options.mep === "lucent") {
          mepScript = `isosurface delete; isosurface molecular map mep colorscheme "rwb" translucent 0.5;`;
        } else {
          mepScript = `isosurface delete; isosurface molecular map mep colorscheme "rwb";`;
        }
        Jmol.script(applet, mepScript);
        this.outputCallback(`MEP surface rendered (${options.mep})`);
      }
      
      // Apply measurement tools
      if (options.tools && Array.isArray(options.tools)) {
        options.tools.forEach(tool => {
          switch(tool) {
            case "distance":
              Jmol.script(applet, 'set picking distance; set pickCallback "jmolPickCallback";');
              this.outputCallback("Distance measurement tool enabled");
              break;
            case "angle":
              Jmol.script(applet, 'set picking angle; set pickCallback "jmolPickCallback";');
              this.outputCallback("Angle measurement tool enabled");
              break;
            case "torsion":
              Jmol.script(applet, 'set picking torsion; set pickCallback "jmolPickCallback";');
              this.outputCallback("Torsion measurement tool enabled");
              break;
          }
        });
      }
      
      // Apply export if requested
      if (options.export === "save") {
        setTimeout(() => {
          this.exportJSmolImage(applet);
        }, 2000);
      }
      
    } catch (error) {
      console.error("Error applying JSmol options:", error);
      this.outputCallback("Warning: Some visualization options could not be applied.");
    }
  }

  // Helper function to update button states based on applied options
  updateButtonStates(options) {
    try {
      // Update style buttons
      document.querySelectorAll('#ballStickBtn, #stickBtn, #spacefillBtn, #wireframeBtn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      const styleMapping = {
        "ballstick": "ballStickBtn",
        "stick": "stickBtn", 
        "spacefill": "spacefillBtn",
        "wireframe": "wireframeBtn"
      };
      
      const styleBtn = document.getElementById(styleMapping[options.style]);
      if (styleBtn) styleBtn.classList.add('active');
      
      // Update background buttons
      document.querySelectorAll('#whiteBgBtn, #blackBgBtn, #grayBgBtn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      const bgBtn = document.getElementById(options.background + 'BgBtn');
      if (bgBtn) bgBtn.classList.add('active');
      
      // Update quality button
      const qualityBtn = document.getElementById('qualityBtn');
      if (qualityBtn) {
        if (options.quality === "high") {
          qualityBtn.classList.add('active');
          qualityBtn.textContent = 'High Quality ✓';
        } else {
          qualityBtn.classList.remove('active');
          qualityBtn.textContent = 'High Quality';
        }
      }
      
      // Update measurement tool buttons
      if (options.tools && Array.isArray(options.tools)) {
        const distanceBtn = document.getElementById('distanceBtn');
        const angleBtn = document.getElementById('angleBtn');
        const torsionBtn = document.getElementById('torsionBtn');
        
        if (options.tools.includes('distance') && distanceBtn) {
          distanceBtn.classList.add('active');
          distanceBtn.textContent = 'Distance ✓';
        }
        if (options.tools.includes('angle') && angleBtn) {
          angleBtn.classList.add('active');
          angleBtn.textContent = 'Angle ✓';
        }
        if (options.tools.includes('torsion') && torsionBtn) {
          torsionBtn.classList.add('active');
          torsionBtn.textContent = 'Torsion ✓';
        }
      }
      
      // Update dipole buttons
      if (options.dipoles === "show") {
        const bondDipoleBtn = document.getElementById('bondDipolesBtn');
        const overallDipoleBtn = document.getElementById('overallDipoleBtn');
        if (bondDipoleBtn) bondDipoleBtn.classList.add('active');
        if (overallDipoleBtn) overallDipoleBtn.classList.add('active');
      }

      // Update MEP buttons
      if (options.mep && options.mep !== "off") {
        document.querySelectorAll('#mepLucentBtn, #mepOpaqueBtn, #mepOffBtn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        const mepBtnId = options.mep === "lucent" ? "mepLucentBtn" : 
                        options.mep === "opaque" ? "mepOpaqueBtn" : "mepOffBtn";
        const mepBtn = document.getElementById(mepBtnId);
        if (mepBtn) mepBtn.classList.add('active');
      }
      
    } catch (error) {
      console.error("Error updating button states:", error);
    }
  }

  // Helper function to export JSmol image
  exportJSmolImage(applet) {
    try {
      if (typeof Jmol !== 'undefined' && applet) {
        Jmol.script(applet, 'write IMAGE PNG "molecule.png"');
        this.outputCallback("Image export initiated");
      }
    } catch (error) {
      console.error("Error exporting image:", error);
      this.outputCallback("Error: Could not export image");
    }
  }

  // Helper function to parse simple option strings
  parseSimpleOptions(optionsStr) {
    try {
      // Handle simple comma-separated key:value pairs
      // e.g., "mode:jsmol, style:ballstick, background:black"
      const options = {};
      const pairs = optionsStr.split(',');
      
      for (const pair of pairs) {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          // Handle array values like "tools:distance,angle"
          if (key === 'tools') {
            options[key] = value.split(',').map(s => s.trim());
          } else {
            options[key] = value;
          }
        }
      }
      
      return Object.keys(options).length > 0 ? options : null;
    } catch (error) {
      return null;
    }
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
