import Lexer from "./lexer.js";
import Parser from "./parser.js";
import Interpretor from "./interpretor.js";

//-----------------------------------------------------
// Some cool animation (at least I tried)

const output = document.getElementById("output");
const rect = output.getBoundingClientRect();

const width = rect.width;
const height = rect.height;
 
const animation = document.createElement("div");
animation.id = "loading-animation";
animation.innerHTML = `
  <style>
    #output {
      display: flex;
      justify-content: center;
      padding-top: ${height / 2 - 40}px;
    }
    /* HTML: <div class="loader"></div> */
    .loader {
      width: 100px;
      aspect-ratio: 1.154;
      position: relative;
      background: conic-gradient(from 120deg at 50% 64%,#0000,rgb(0, 0, 0) 1deg 120deg,#0000 121deg);
      animation: l27-0 1.5s infinite cubic-bezier(0.3,1,0,1);
    }
    .loader:before,
    .loader:after {
      content:'';
      position: absolute;
      inset:0;
      background:inherit;
      transform-origin: 50% 66%;
      animation: l27-1 1.5s infinite;
    }
    .loader:after {
      --s:-1;
    }
    @keyframes l27-0 {
      0%,30%      {transform: rotate(0)}
      70%         {transform: rotate(120deg)}
      70.01%,100% {transform: rotate(360deg)}
    }
    @keyframes l27-1 {
      0%      {transform: rotate(calc(var(--s,1)*120deg)) translate(0)}
      30%,70% {transform: rotate(calc(var(--s,1)*120deg)) translate(calc(var(--s,1)*-10px),20px)}
      100%    {transform: rotate(calc(var(--s,1)*120deg)) translate(0)}
    }
  </style>
  <div class="loader"></div>
`;


function updateEmptyState() {

  if (output.childNodes.length  === 0) {
    if (!output.contains(animation)) {
      output.appendChild(animation);
    }
  } else if (output.childNodes.length === 2) {
    if (output.contains(animation)) {
      output.removeChild(animation);
    }
  } 
}
 
const observer = new MutationObserver(() => {
  updateEmptyState();
});

observer.observe(output, { childList: true });

updateEmptyState();
 

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

    <!-- GENERAL SYNTAX -->
    <h3>🟦 General Syntax</h3>

    <div class="doc-section">
      <h4><code>let variable = value</code></h4>
      <p>Declares and assigns a variable in the local environment.</p>
      <pre><code>let x = "C6H6";</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>variable = value</code></h4>
      <p>Reassigns an existing variable to a new value.</p>
      <pre><code>x = "H2O";</code></pre>
    </div>

    <div class="doc-section">
      <h4><code>show(expression)</code></h4>
      <p>Outputs the result of any evaluated expression in the output panel.</p>
      <pre><code>show("Hello, ChemOrg!");</code></pre>
    </div>

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

    <div class="doc-section">
      <h4><code>+</code> (String Concatenation)</h4>
      <p>Joins two strings or variables together.</p>
      <pre><code>
let base = "C6H6";
show(base + " + O2 -> CO2 + H2O");
      </code></pre>
    </div>

    <!-- CHEMISTRY FUNCTIONS -->
    <h3>🧪 Chemistry Functions</h3>

    <div class="doc-section">
      <h4><code>possible(expression)</code></h4>
      <p>Checks if a chemical reaction is feasible.</p>
      <pre><code>show(possible("NaOH + HCl -> NaCl + H2O"));</code></pre>
      <p><strong>Output:</strong><br>
      The reaction "NaOH + HCl -> NaCl + H2O" is chemically possible.<br>
      ✓ Conditions: room temperature, aqueous<br>
      🧪 Reactant information:<br>
      • HCl: Strong Non-oxygenated Acid (monoprotic)<br>
      • NaOH: Strong Base (Soluble)</p>
    </div>

    <div class="doc-section">
      <h4><code>resolve(expression)</code></h4>
      <p>Balances a chemical equation.</p>
      <pre><code>show(resolve("Na3PO4 + CaCl2 -> Ca3(PO4)2 + NaCl"));</code></pre>
      <p><strong>Output:</strong><br>"2 Na3PO4 + 3 CaCl2 -> 1 Ca3(PO4)2 + 6 NaCl"</p>
    </div>

    <div class="doc-section">
      <h4><code>getOxidixngs(expression)</code></h4>
      <p>Returns known oxidizing agents found in the reaction.</p>
      <pre><code>show(getOxidixngs("H2 + Cl2 -> HCl"));</code></pre>
      <p><strong>Output:</strong><br>Oxidizing Agent: Cl2</p>
    </div>

    <div class="doc-section">
      <h4><code>getReducings(expression)</code></h4>
      <p>Returns known reducing agents found in the reaction.</p>
      <pre><code>show(getReducings("Fe + CuSO4 -> FeSO4 + Cu"));</code></pre>
      <p><strong>Output:</strong><br>Reducing Agent: Fe</p>
    </div>

    <div class="doc-section">
      <h4><code>isAcid(formula)</code></h4>
      <p>Returns <code>true</code> if the compound is acidic.</p>
      <pre><code>show(isAcid("HCl"));</code></pre>
      <p><strong>Output:</strong><br>true</p>
    </div>

    <div class="doc-section">
      <h4><code>isBase(formula)</code></h4>
      <p>Returns <code>true</code> if the compound is basic.</p>
      <pre><code>show(isBase("NaOH"));</code></pre>
      <p><strong>Output:</strong><br>true</p>
    </div>

    <div class="doc-section">
      <h4><code>getMolecWeight(formula)</code></h4>
      <p>Calculates molecular weight of a compound.</p>
      <pre><code>show(getMolecWeight("H2O"));</code></pre>
      <p><strong>Output:</strong><br>18.015</p>
    </div>

    <div class="doc-section">
      <h4><code>getVolume(mass, density)</code></h4>
      <p>Computes volume using mass and density.</p>
      <pre><code>show(getVolume(10, 2));</code></pre>
      <p><strong>Output:</strong><br>5</p>
    </div>

    <div class="doc-section">
      <h4><code>getVolume(moles, "custom", temperature, pressure)</code></h4>
      <p>Calculates volume of a gas using the Ideal Gas Law.</p>
      <pre><code>show(getVolume(1, "custom", 273.15, 101.325));</code></pre>
      <p><strong>Output:</strong><br>0.221...</p>
      <pre><code>show(getVolume(2, "custom", 300, 100));</code></pre>
      <p><strong>Output:</strong><br>0.4926...</p>
      <p><em>Note: Returned value is in liters.</em></p>
    </div>

    <div class="doc-section">
      <h4><code>getV(volume, mass)</code></h4>
      <p>Computes specific volume using total volume and mass.</p>
      <pre><code>show(getV(22.4, 1));</code></pre>
      <p><strong>Output:</strong><br>22.4</p>
    </div>

    <!-- VISUALIZATION -->
    <h3>🔬 Visualization</h3>

    <div class="doc-section">
      <h4><code>visualize(formula)</code></h4>
      <p>Displays a 2D and 3D graphical representation of a chemical formula or molecule.<br>
      It's recommended to use the name (e.g., "benzene") for higher accuracy.</p>
      <pre><code>visualize("C6H6");</code>  |  <code>visualize("benzene");</code></pre>
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
    console.log("RDKit initialized successfully");
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





