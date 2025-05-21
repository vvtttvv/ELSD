import Lexer from "./lexer.js";
import Parser from "./parser.js";
import Interpretor from "./interpretor.js";
 

//To clear input
document.getElementById("clear").onclick = function () {
  document.getElementById("input").value = "";
};

//To handle input
document.getElementById("run").onclick = function () {
  document.getElementById("output").innerHTML = ""; // Clear output
  const input = document.getElementById("input").value;

  const lexer = new Lexer(input);

  try {
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const parseTree = parser.getTree();

    const outputCallback = (message) => {
      const outputElement = document.createElement("div");
      outputElement.innerHTML = message;
      document.getElementById("output").appendChild(outputElement);
    };

    const interpretor = new Interpretor(parseTree, outputCallback);
    interpretor.interpret();
  } catch (error) {
    console.error("Error:", error);
    const errorElement = document.createElement("div");
    errorElement.style.color = "red";
    errorElement.textContent = `Error: ${error.message}`;
    document.getElementById("output").appendChild(errorElement);
  }
};

// To make code typing more convenient
document.getElementById("input").addEventListener("keydown", function (event) {
  const textarea = event.target;
  if (event.key === "Tab") {
    event.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value =
      textarea.value.substring(0, start) +
      "    " +
      textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 4;
  } else if (event.key === "{") {
    event.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value =
      textarea.value.substring(0, start) + "{}" + textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  } else if (event.key === "(") {
    event.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value =
      textarea.value.substring(0, start) + "()" + textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  }
});


document.getElementById("doc").onclick = function () {
  const modal = document.getElementById("docModal");
  modal.style.display = "block";

  document.getElementById("docContent").innerHTML = `
    <h2>ChemOrg DSL - Function Reference</h2>

    <!-- Variable Declaration -->
    <div class="doc-section">
      <h4><code>let variable = value</code></h4>
      <p>Declares and assigns a variable in the local environment.</p>
      <pre><code>let x = "C6H6";</code></pre>
    </div>

    <!-- Variable Assignment -->
    <div class="doc-section">
      <h4><code>variable = value</code></h4>
      <p>Reassigns an existing variable to a new value.</p>
      <pre><code>x = "H2O";</code></pre>
    </div>

    <!-- Output Display -->
    <div class="doc-section">
      <h4><code>show(expression)</code></h4>
      <p>Outputs the result of any evaluated expression in the output panel.</p>
      <pre><code>show("Hello, ChemOrg!");</code></pre>
    </div>

    <!-- Conditional Logic -->
    <div class="doc-section">
      <h4><code>if / elif / else</code></h4>
      <p>Conditionally executes code blocks based on boolean evaluations.</p>
      <pre><code>
if (possible("NaOH + HCl -> NaCl + H2O")) {
  show("Valid reaction");
} else {
  show("Invalid reaction");
}
      </code></pre>
    </div>

    <!-- String Concatenation -->
    <div class="doc-section">
      <h4><code>+</code> (String Concatenation)</h4>
      <p>Joins two strings or variables together.</p>
      <pre><code>
let base = "C6H6";
show(base + " + O2 -> CO2 + H2O");
      </code></pre>
    </div>

    <!-- Chemistry Functionality -->

    <div class="doc-section">
      <h4><code>resolve(expression, outputType?)</code></h4>
      <p>Balances a chemical equation.</p>
      <pre><code>show(resolve("Fe + O2 -> Fe2O3"));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>possible(expression)</code></h4>
      <p>Returns <code>true</code> if the reaction is chemically feasible.</p>
      <pre><code>show(possible("NaOH + HCl -> NaCl + H2O"));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>getOxidixngs(expression)</code></h4>
      <p>Extracts oxidizing agents from the reactants of a given reaction.</p>
      <pre><code>show(getOxidixngs("H2 + Cl2 -> HCl"));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>getReducings(expression)</code></h4>
      <p>Extracts reducing agents from the reactants of a given reaction.</p>
      <pre><code>show(getReducings("Fe + CuSO4 -> FeSO4 + Cu"));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>getMolecWeight(formula, includeIsotopes?)</code></h4>
      <p>Calculates molecular weight of a compound.</p>
      <pre><code>show(getMolecWeight("H2O"));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>getVolume(moles, "custom"?, temperature?, pressure?)</code></h4>
      <p>Calculates volume of a gas using the ideal gas law. Use "custom" to provide conditions.</p>
      <pre><code>show(getVolume(1, "custom", 273.15, 101.325));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>getVolume(mass, density)</code></h4>
      <p>Computes volume using mass and density.</p>
      <pre><code>show(getVolume(10, 2));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>getV(volume, mass)</code></h4>
      <p>Computes specific volume using total volume and molecular mass.</p>
      <pre><code>show(getV(22.414, 18.015));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>isAcid(formula)</code></h4>
      <p>Returns <code>true</code> if the given formula is an acid.</p>
      <pre><code>show(isAcid("HCl"));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>isBase(formula)</code></h4>
      <p>Returns <code>true</code> if the given formula is a base.</p>
      <pre><code>show(isBase("NaOH"));</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>visualise(formula)</code></h4>
      <p>Displays a 2D visual representation of a molecule or compound.</p>
      <pre><code>visualise("C6H6");</code></pre>
    </div>
  `;
};
 
document.querySelector(".close-button").onclick = function () {
  document.getElementById("docModal").style.display = "none";
};
 
window.onclick = function (event) {
  const modal = document.getElementById("docModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

 
window.addEventListener('load', () => {
  initRDKitModule().then(RDKit => {
    const mol = RDKit.get_mol("c1ccc(CC)cc1");
    const molBlock = mol.get_molblock();
    const kekuleMol = Kekule.IO.loadFormatData(molBlock, 'mol');

    const parentElem = document.getElementById('visualize');
    Kekule.DomUtils.clearChildContent(parentElem);

    const viewer2d = new Kekule.ChemWidget.Viewer(parentElem);
    viewer2d.setChemObj(kekuleMol);
    viewer2d.setRenderType(Kekule.Render.RendererType.R2D);  
    viewer2d.setPredefinedSetting('fullFunc');
    viewer2d.setMoleculeDisplayType(Kekule.Render.Molecule2DDisplayType.ATOM_SYMBOL); 
    var color2DConfigs = viewer2d.getRenderConfigs().getColorConfigs();
    color2DConfigs.setAtomColor('#A00000').setBondColor('#000000');  // set the default color for atoms and bonds
    color2DConfigs.setGlyphStrokeColor('#C0C0C0');  
    color2DConfigs.setLabelColor('#C0C0C0'); 

    viewer2d.setEnableToolbar(true);  
    
    viewer2d.repaint();

    var parentElem3d = document.getElementById('visualize3d');
    Kekule.DomUtils.clearChildContent(parentElem3d);
    var viewer3d = new Kekule.ChemWidget.Viewer(parentElem3d);
    viewer3d.setRenderType(Kekule.Render.RendererType.R3D);  // Use 3D render
    viewer3d.setChemObj(kekuleMol);  // Assign molecule
    viewer3d.setEnableToolbar(true);  // Optional UI toolbar
    viewer3d.setPredefinedSetting('ballStick');   
    var display3DConfigs = viewer3d.getRenderConfigs().getMoleculeDisplayConfigs();
    display3DConfigs.setDefAtomColor('#FFFFFF').setDefBondColor('#A0A000');
    display3DConfigs.setUseAtomSpecifiedColor(false);  // turn off this to take the color to effect
    viewer3d.requestRepaint();    


    const outputCallback = (message) => {
    const outputElement = document.createElement("div");
    outputElement.textContent = message;
    document.getElementById("output").appendChild(outputElement);
  };
  
  // Initialize RDKit but don't render anything yet
  initRDKitModule().then(RDKit => {
    outputCallback("RDKit initialized successfully");
  }).catch(err => {
    outputCallback("Error initializing RDKit: " + err.message);
  });
  });
});  
 

/*
let variable = "C6H6";
variable = "C2H6";
if (possible("C6H6" + variable)) {
  let reaction = resolve("C6H6" + variable);
  if (getOxidixngs(reaction)) {
    let oxidizers = getReducings(reaction);
    if (getMolecWeight(oxidizers) > 50) {
      let volume = getVolume(oxidizers);
      if (getV(volume, getMolecWeight(reaction)) < 100) {
        show("Reaction is stable with low volume");
      }
    }
  }
} else {
  show("Reaction is not possible");
}
*/
