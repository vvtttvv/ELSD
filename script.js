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

function loadJSmolLibrary() {
  return new Promise((resolve, reject) => {
    if (typeof Jmol !== 'undefined') {
      resolve();
      return;
    }
    
    console.log("Loading local JSmol library...");
    
    // Load from local jsmol folder
    const script = document.createElement('script');
    script.src = './jsmol/JSmol.min.js';  // Local path
    script.onload = () => {
      console.log("JSmol loaded from local files");
      // Jmol.setDocument(document); // Optional, can be kept or removed
      resolve();
    };
    script.onerror = () => {
      console.error("Failed to load local JSmol library");
      reject(new Error("Failed to load local JSmol library"));
    };
    document.head.appendChild(script);
  });
}

// Function to insert JSmol applet into the container
function insertJSmolApplet() {
  const jsmolContainer = document.getElementById('jsmolContainer');
  if (!jsmolContainer) return;

  // Clear previous content
  jsmolContainer.innerHTML = "";

  // JSmol Info object
  const Info = {
    width: 600,
    height: 600,
    use: "HTML5",
    j2sPath: "./jsmol/j2s",
    script: "load $caffeine", // or any default molecule
    debug: false,
    disableJ2SLoadMonitor: true,
    addSelectionOptions: false
  };

  // Create the applet
  const applet = Jmol.getApplet("jsmolApplet", Info);
  jsmolContainer.innerHTML = Jmol.getAppletHtml(applet);
  window.currentJsmolApplet = applet;
  
  // Update molecule info when applet is ready
  setTimeout(() => {
    if (typeof window.updateMoleculeInfo === 'function') {
      window.updateMoleculeInfo();
    }
  }, 3000); 
}

//-----------------------------------------------------
// VISUALIZATION TOGGLE FUNCTIONALITY

// Global variables for visualization mode
let isJSmolMode = false;
let currentJsmolApplet = null;
let highQualityEnabled = true;

// Function to clear visualization containers
function clearVisualizationContainers() {
  const visualize2D = document.getElementById('visualize');
  const visualize3D = document.getElementById('visualize3d');
  const jsmolContainer = document.getElementById('jsmolContainer');
  
  if (visualize2D) {
    if (typeof Kekule !== 'undefined' && Kekule.DomUtils) {
      Kekule.DomUtils.clearChildContent(visualize2D);
    } else {
      visualize2D.innerHTML = '';
    }
    visualize2D.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Ready for 2D visualization</p></div>';
  }
  
  if (visualize3D) {
    if (typeof Kekule !== 'undefined' && Kekule.DomUtils) {
      Kekule.DomUtils.clearChildContent(visualize3D);
    } else {
      visualize3D.innerHTML = '';
    }
    visualize3D.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Ready for 3D visualization</p></div>';
  }
  
  if (jsmolContainer) {
    jsmolContainer.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Ready for JSmol visualization</p></div>';
  }

  // Reset status indicators
  const status2d = document.getElementById('status2d');
  const status3d = document.getElementById('status3d');
  const statusJsmol = document.getElementById('statusJsmol');
  
  if (status2d) status2d.classList.add('inactive');
  if (status3d) status3d.classList.add('inactive');
  if (statusJsmol) statusJsmol.classList.add('inactive');
}

// Initialize toggle functionality when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('visualizationToggle');
  const container = document.getElementById('visualizationContainer');
  const kekuleLabel = document.getElementById('kekuleLabel');
  const jsmolLabel = document.getElementById('jsmolLabel');
  const currentMode = document.getElementById('currentMode');
  const status2d = document.getElementById('status2d');
  const status3d = document.getElementById('status3d');
  const statusJsmol = document.getElementById('statusJsmol');

  // Initialize status indicators
  if (status2d) status2d.classList.add('inactive');
  if (status3d) status3d.classList.add('inactive');
  if (statusJsmol) statusJsmol.classList.add('inactive');

   if (toggle) {
    toggle.addEventListener('click', async () => {
      isJSmolMode = !isJSmolMode;
      
      console.log('Toggle clicked, new mode:', isJSmolMode ? 'JSmol' : 'Kekule');
      
      if (isJSmolMode) {
        // Switch to JSmol mode
        toggle.classList.add('active');
        if (container) {
          container.classList.remove('kekule-mode');
          container.classList.add('jsmol-mode');
        }
        if (kekuleLabel) kekuleLabel.classList.remove('active');
        if (jsmolLabel) jsmolLabel.classList.add('active');
        if (currentMode) currentMode.textContent = 'Current Mode: JSmol (Interactive 3D)';
        
        // Ensure JSmol is loaded
        if (typeof Jmol === 'undefined') {
          console.log('Loading JSmol library...');
          try {
            await loadJSmolLibrary();
            console.log('JSmol library loaded successfully');
          } catch (error) {
            console.error('Failed to load JSmol:', error);
            alert('Failed to load JSmol library. Please check your internet connection.');
            // Revert the toggle
            isJSmolMode = false;
            toggle.classList.remove('active');
            return;
          }
        }

        clearVisualizationContainers();
        setTimeout(() => {
          insertJSmolApplet();
        }, 100);
        
        console.log('Switched to JSmol mode');
        
      } else {
        // Switch to Kekule mode
        toggle.classList.remove('active');
        if (container) {
          container.classList.remove('jsmol-mode');
          container.classList.add('kekule-mode');
        }
        if (jsmolLabel) jsmolLabel.classList.remove('active');
        if (kekuleLabel) kekuleLabel.classList.add('active');
        if (currentMode) currentMode.textContent = 'Current Mode: Kekule.js (2D + 3D)';
        
        console.log('Switched to Kekule mode');
      }
      
      // Clear previous visualizations when switching modes
      clearVisualizationContainers();
    });
  }
});

// Expose functions globally for use in interpreter
window.getVisualizationMode = function() {
  return isJSmolMode ? 'jsmol' : 'kekule';
};

window.updateVisualizationStatus = function(mode, active) {
  const indicators = {
    '2d': document.getElementById('status2d'),
    '3d': document.getElementById('status3d'),
    'jsmol': document.getElementById('statusJsmol')
  };
  
  if (indicators[mode]) {
    if (active) {
      indicators[mode].classList.remove('inactive');
    } else {
      indicators[mode].classList.add('inactive');
    }
  }
};

window.clearVisualizationContainers = clearVisualizationContainers;


//-----------------------------------------------------
 
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

// JSmol Control Functions
window.setJSmolStyle = function(style) {
    console.log('setJSmolStyle called with:', style);
    console.log('currentJsmolApplet:', window.currentJsmolApplet);
    console.log('Jmol available:', typeof Jmol !== 'undefined');
    
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready - applet:', !!window.currentJsmolApplet, 'Jmol:', typeof Jmol !== 'undefined');
        return;
    }

    try {
        document.querySelectorAll('#ballStickBtn, #stickBtn, #spacefillBtn, #wireframeBtn').forEach(btn => {
            btn.classList.remove('active');
        });

        let script = '';
        switch(style) {
            case 'ballAndStick':
                script = 'spacefill 20%; wireframe 0.15; color atoms cpk;';
                document.getElementById('ballStickBtn').classList.add('active');
                console.log('Ball & Stick representation applied');
                break;
            case 'stick':
                script = 'spacefill off; wireframe 0.3; color atoms cpk;';
                document.getElementById('stickBtn').classList.add('active');
                console.log('Stick representation applied');
                break;
            case 'spacefill':
                script = 'spacefill 100%; wireframe off; color atoms cpk;';
                document.getElementById('spacefillBtn').classList.add('active');
                console.log('Spacefill representation applied');
                break;
            case 'wireframe':
                script = 'spacefill off; wireframe 0.05; color atoms cpk;';
                document.getElementById('wireframeBtn').classList.add('active');
                console.log('Wireframe representation applied');
                break;
        }
        
        console.log('Executing JSmol script:', script);
        Jmol.script(window.currentJsmolApplet, script);
    } catch (error) {
        console.error('Error in setJSmolStyle:', error);
    }
};

window.setJSmolBackground = function(color) {
    console.log('setJSmolBackground called with:', color);
    
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready - applet:', !!window.currentJsmolApplet, 'Jmol:', typeof Jmol !== 'undefined');
        return;
    }

    try {
        // Remove active class from all bg buttons
        document.querySelectorAll('#whiteBgBtn, #blackBgBtn, #grayBgBtn').forEach(btn => {
            btn.classList.remove('active');
        });

        const script = `background ${color};`;
        console.log('Executing background script:', script);
        Jmol.script(window.currentJsmolApplet, script);
        
        // Add active class to clicked button
        const buttonId = color + 'BgBtn';
        const targetButton = document.getElementById(buttonId);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        console.log(`Background color set to ${color}`);
    } catch (error) {
        console.error('Error in setJSmolBackground:', error);
    }
};

window.toggleJSmolQuality = function() {
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready');
        return;
    }

    const qualityBtn = document.getElementById('qualityBtn');
    const isActive = qualityBtn.classList.contains('active');
    
    if (isActive) {
        const script = 'set antialiasDisplay false; set ambient 20; set diffuse 60; set specular 0;';
        Jmol.script(window.currentJsmolApplet, script);
        qualityBtn.classList.remove('active');
        qualityBtn.textContent = 'High Quality';
        console.log('Quality set to standard');
    } else {
        const script = 'set antialiasDisplay true; set ambient 40; set diffuse 80; set specular 80; set specularPower 40;';
        Jmol.script(window.currentJsmolApplet, script);
        qualityBtn.classList.add('active');
        qualityBtn.textContent = 'High Quality ✓';
        console.log('Quality set to high');
    }
};

window.enableJSmolMeasurement = function(type) {
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready');
        return;
    }

    let script = '';
    const distanceBtn = document.getElementById('distanceBtn');
    const angleBtn = document.getElementById('angleBtn');
    const torsionBtn = document.getElementById('torsionBtn');
    
    // Reset measurement buttons
    distanceBtn.classList.remove('active');
    angleBtn.classList.remove('active');
    torsionBtn.classList.remove('active');
    
    switch(type) {
        case 'distance':
            script = 'set picking distance; set pickCallback "jmolPickCallback";';
            distanceBtn.classList.add('active');
            distanceBtn.textContent = 'Distance ✓';
            angleBtn.textContent = 'Angle';
            torsionBtn.textContent = 'Torsion';
            console.log('Distance measurement enabled. Click two atoms to measure distance.');
            break;
        case 'angle':
            script = 'set picking angle; set pickCallback "jmolPickCallback";';
            angleBtn.classList.add('active');
            angleBtn.textContent = 'Angle ✓';
            distanceBtn.textContent = 'Distance';
            torsionBtn.textContent = 'Torsion';
            console.log('Angle measurement enabled. Click three atoms to measure angle.');
            break;
        case 'torsion':
            script = 'set picking torsion; set pickCallback "jmolPickCallback";';
            torsionBtn.classList.add('active');
            torsionBtn.textContent = 'Torsion ✓';
            distanceBtn.textContent = 'Distance';
            angleBtn.textContent = 'Angle';
            console.log('Torsion measurement enabled. Click four atoms to measure dihedral angle.');
            break;
    }
    
    Jmol.script(window.currentJsmolApplet, script);
};

window.toggleJSmolCharges = function() {
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready');
        return;
    }

    const chargeBtn = document.getElementById('chargeBtn');
    const isActive = chargeBtn.classList.contains('active');
    
    if (isActive) {
        // Hide charges
        const script = 'label off; color atoms cpk;';
        Jmol.script(window.currentJsmolApplet, script);
        chargeBtn.classList.remove('active');
        chargeBtn.textContent = 'Show Charges';
        console.log('Charges hidden');
    } else {
        // Show charges - using calculated partial charges
        const script = `
            label off;
            calculate partialCharge;
            label on;
            set labelOffset 0 0;
            label %[partialCharge];
            font label 12;
            color label black;
            background label translucent yellow;
        `;
        Jmol.script(window.currentJsmolApplet, script);
        chargeBtn.classList.add('active');
        chargeBtn.textContent = 'Hide Charges';
        console.log('Partial charges displayed');
    }
};

window.clearJSmolMeasurements = function() {
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready');
        return;
    }

    try {
        // Clear measurements, labels, surfaces, and dipoles - minimal commands to avoid breaking state
        Jmol.script(window.currentJsmolApplet, 'measure delete;');
        Jmol.script(window.currentJsmolApplet, 'label off;');
        Jmol.script(window.currentJsmolApplet, 'set picking off;');
        Jmol.script(window.currentJsmolApplet, 'isosurface delete;');
        Jmol.script(window.currentJsmolApplet, 'dipole delete;');
        Jmol.script(window.currentJsmolApplet, 'vectors off;');
        
        // Reset measurement button states
        const distanceBtn = document.getElementById('distanceBtn');
        const angleBtn = document.getElementById('angleBtn');
        const torsionBtn = document.getElementById('torsionBtn');
        const chargeBtn = document.getElementById('chargeBtn');
        
        if (distanceBtn) {
            distanceBtn.classList.remove('active');
            distanceBtn.textContent = 'Distance';
        }
        if (angleBtn) {
            angleBtn.classList.remove('active');
            angleBtn.textContent = 'Angle';
        }
        if (torsionBtn) {
            torsionBtn.classList.remove('active');
            torsionBtn.textContent = 'Torsion';
        }
        if (chargeBtn) {
            chargeBtn.classList.remove('active');
            chargeBtn.textContent = 'Show Charges';
        }
        
        // Reset MEP surface and dipole button states
        document.querySelectorAll('#mepLucentBtn, #mepOpaqueBtn, #mepOffBtn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Reset dipole button states
        const bondDipolesBtn = document.getElementById('bondDipolesBtn');
        const overallDipoleBtn = document.getElementById('overallDipoleBtn');
        
        if (bondDipolesBtn) {
            bondDipolesBtn.classList.remove('active');
            bondDipolesBtn.textContent = 'Bond Dipoles';
        }
        if (overallDipoleBtn) {
            overallDipoleBtn.classList.remove('active');
            overallDipoleBtn.textContent = 'Overall Dipole';
        }
        
        // Clear stored molecule data to force fresh retrieval
        if (typeof window.clearMoleculeData === 'function') {
            window.clearMoleculeData();
        }
        
        console.log('Measurements and labels cleared');
    } catch (error) {
        console.error('Error in clearJSmolMeasurements:', error);
    }
};

window.resetJSmolView = function() {
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready');
        return;
    }

    try {
        // Reset view position only - separate commands to avoid conflicts
        Jmol.script(window.currentJsmolApplet, 'zoom 120;');
        Jmol.script(window.currentJsmolApplet, 'rotate best;');
        Jmol.script(window.currentJsmolApplet, 'center;');
        
        // Clear measurements, picking, surfaces, and dipoles separately
        Jmol.script(window.currentJsmolApplet, 'measure delete;');
        Jmol.script(window.currentJsmolApplet, 'label off;');
        Jmol.script(window.currentJsmolApplet, 'set picking off;');
        Jmol.script(window.currentJsmolApplet, 'isosurface delete;');
        Jmol.script(window.currentJsmolApplet, 'dipole delete;');
        Jmol.script(window.currentJsmolApplet, 'vectors off;');
        
        // Reset measurement button states
        const distanceBtn = document.getElementById('distanceBtn');
        const angleBtn = document.getElementById('angleBtn');
        const torsionBtn = document.getElementById('torsionBtn');
        const chargeBtn = document.getElementById('chargeBtn');
        
        if (distanceBtn) {
            distanceBtn.classList.remove('active');
            distanceBtn.textContent = 'Distance';
        }
        if (angleBtn) {
            angleBtn.classList.remove('active');
            angleBtn.textContent = 'Angle';
        }
        if (torsionBtn) {
            torsionBtn.classList.remove('active');
            torsionBtn.textContent = 'Torsion';
        }
        if (chargeBtn) {
            chargeBtn.classList.remove('active');
            chargeBtn.textContent = 'Show Charges';
        }
        
        // Reset MEP surface and dipole button states
        document.querySelectorAll('#mepLucentBtn, #mepOpaqueBtn, #mepOffBtn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Reset dipole button states
        const bondDipolesBtn = document.getElementById('bondDipolesBtn');
        const overallDipoleBtn = document.getElementById('overallDipoleBtn');
        
        if (bondDipolesBtn) {
            bondDipolesBtn.classList.remove('active');
            bondDipolesBtn.textContent = 'Bond Dipoles';
        }
        if (overallDipoleBtn) {
            overallDipoleBtn.classList.remove('active');
            overallDipoleBtn.textContent = 'Overall Dipole';
        }
        
        // Clear stored molecule data to force fresh retrieval
        if (typeof window.clearMoleculeData === 'function') {
            window.clearMoleculeData();
        }
        
        console.log('JSmol view reset');
    } catch (error) {
        console.error('Error in resetJSmolView:', error);
    }
};

window.exportJSmolImage = function() {
    console.log('exportJSmolImage called');
    
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready - applet:', !!window.currentJsmolApplet, 'Jmol:', typeof Jmol !== 'undefined');
        return;
    }

    try {
        console.log('Attempting to export JSmol image...');
        
        // Method 1: Try to get image as base64 data URL directly
        const imageData = Jmol.evaluateVar(window.currentJsmolApplet, 'write("IMAGE")');
        console.log('JSmol image data type:', typeof imageData);
        
        if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image')) {
            console.log('Got valid image data, creating download...');
            const link = document.createElement('a');
            link.download = 'molecule_' + new Date().getTime() + '.png';
            link.href = imageData;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Image exported successfully via evaluateVar');
            return;
        }
        
        // Method 2: Try canvas-based export
        console.log('Trying canvas-based export...');
        const canvas = document.querySelector('#jsmolContainer canvas');
        if (canvas) {
            console.log('Canvas found, converting to data URL...');
            const dataURL = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.download = 'molecule_' + new Date().getTime() + '.png';
            link.href = dataURL;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Image exported successfully via canvas');
            return;
        }
        
        // Method 3: Use JSmol's popup write dialog as fallback
        console.log('Using JSmol popup dialog fallback...');
        Jmol.script(window.currentJsmolApplet, 'write IMAGE PNG "molecule.png"');
        console.log('JSmol write dialog should appear');
        
    } catch (error) {
        console.error('Error in exportJSmolImage:', error);
        
        // Final fallback - show user instruction
        alert('Image export encountered an issue. You can:\n\n' +
              '1. Right-click on the molecule and select "Save Image As..."\n' +
              '2. Or use the JSmol menu (right-click) → File → Export Image\n' +
              '3. Or take a screenshot of the molecule area');
    }
};

// MEP Surface Functions
window.setJSmolMEP = function(mode) {
    console.log('setJSmolMEP called with mode:', mode);
    
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready - applet:', !!window.currentJsmolApplet, 'Jmol:', typeof Jmol !== 'undefined');
        return;
    }

    try {
        // Remove active class from all MEP buttons
        document.querySelectorAll('#mepLucentBtn, #mepOpaqueBtn, #mepOffBtn').forEach(btn => {
            btn.classList.remove('active');
        });

        let script = '';
        switch(mode) {
            case 'lucent':
                // Delete any existing surface first, then create MEP surface (translucent)
                script = `
                    isosurface delete;
                    set isosurfacePropertySmoothing false;
                    isosurface resolution 6 molecular map mep;
                    color isosurface range -0.1 0.1;
                    isosurface translucent 0.7;
                `;
                document.getElementById('mepLucentBtn').classList.add('active');
                console.log('MEP Lucent surface applied');
                break;
                
            case 'opaque':
                // Delete any existing surface first, then create MEP surface (opaque)
                script = `
                    isosurface delete;
                    set isosurfacePropertySmoothing false;
                    isosurface resolution 6 molecular map mep;
                    color isosurface range -0.1 0.1;
                `;
                document.getElementById('mepOpaqueBtn').classList.add('active');
                console.log('MEP Opaque surface applied');
                break;
                
            case 'off':
                // Remove all isosurfaces
                script = 'isosurface delete;';
                document.getElementById('mepOffBtn').classList.add('active');
                console.log('MEP surface hidden');
                break;
        }
        
        console.log('Executing MEP script:', script.trim());
        Jmol.script(window.currentJsmolApplet, script);
        
    } catch (error) {
        console.error('Error in setJSmolMEP:', error);
        alert('Error displaying MEP surface. This feature requires a molecule with calculated electrostatic potential data.');
    }
};

// Dipole Functions
window.toggleJSmolBondDipoles = function() {
    console.log('toggleJSmolBondDipoles called');
    
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready - applet:', !!window.currentJsmolApplet, 'Jmol:', typeof Jmol !== 'undefined');
        return;
    }

    try {
        const bondDipolesBtn = document.getElementById('bondDipolesBtn');
        const isActive = bondDipolesBtn.classList.contains('active');
        
        if (isActive) {
            // Hide bond dipoles
            const script = 'dipole delete; vectors off;';
            Jmol.script(window.currentJsmolApplet, script);
            bondDipolesBtn.classList.remove('active');
            bondDipolesBtn.textContent = 'Bond Dipoles';
            console.log('Bond dipoles hidden');
        } else {
            // Show bond dipoles
            const script = `
                calculate partialCharge;
                dipole bonds on;
                vector scale 2.0;
                vector diameter 0.05;
                color vectors yellow;
            `;
            Jmol.script(window.currentJsmolApplet, script);
            bondDipolesBtn.classList.add('active');
            bondDipolesBtn.textContent = 'Bond Dipoles ✓';
            console.log('Bond dipoles displayed');
        }
    } catch (error) {
        console.error('Error in toggleJSmolBondDipoles:', error);
        alert('Error displaying bond dipoles. This feature may require charge calculations.');
    }
};

window.toggleJSmolOverallDipole = function() {
    console.log('toggleJSmolOverallDipole called');
    
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready - applet:', !!window.currentJsmolApplet, 'Jmol:', typeof Jmol !== 'undefined');
        return;
    }

    try {
        const overallDipoleBtn = document.getElementById('overallDipoleBtn');
        const isActive = overallDipoleBtn.classList.contains('active');
        
        if (isActive) {
            // Hide overall dipole
            const script = 'dipole molecular delete;';
            Jmol.script(window.currentJsmolApplet, script);
            overallDipoleBtn.classList.remove('active');
            overallDipoleBtn.textContent = 'Overall Dipole';
            console.log('Overall dipole hidden');
        } else {
            // Show overall dipole
            const script = `
                calculate partialCharge;
                dipole molecular on;
                vector scale 3.0;
                vector diameter 0.1;
                color vectors red;
            `;
            Jmol.script(window.currentJsmolApplet, script);
            overallDipoleBtn.classList.add('active');
            overallDipoleBtn.textContent = 'Overall Dipole ✓';
            console.log('Overall dipole displayed');
        }
    } catch (error) {
        console.error('Error in toggleJSmolOverallDipole:', error);
        alert('Error displaying overall dipole. This feature may require charge calculations.');
    }
};

window.minimizeJSmolEnergy = function() {
    console.log('minimizeJSmolEnergy called');
    
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        console.warn('JSmol not ready - applet:', !!window.currentJsmolApplet, 'Jmol:', typeof Jmol !== 'undefined');
        return;
    }

    try {
        const minimizeBtn = document.getElementById('minimizeBtn');
        
        // Check if already running
        if (minimizeBtn.disabled) {
            console.log('Energy minimization already in progress');
            return;
        }
        
        // Disable button during calculation
        minimizeBtn.disabled = true;
        minimizeBtn.textContent = 'Minimizing...';
        
        // Get initial energy for comparison
        const initialEnergyScript = 'print {*}.energy';
        
        // Energy minimization script with more detailed feedback
        const script = `
            print "Starting energy minimization...";
            minimize steps 100 criterion 0.001;
            print "Energy minimization step completed";
            print "Final energy: " + {*}.energy;
        `;
        
        console.log('Starting energy minimization...');
        Jmol.script(window.currentJsmolApplet, script);
        
        // Re-enable button after a shorter delay and provide feedback
        setTimeout(() => {
            minimizeBtn.disabled = false;
            minimizeBtn.textContent = 'Energy Minimization';
            
            // Check if minimization had an effect
            const energyCheck = Jmol.evaluateVar(window.currentJsmolApplet, '{*}.energy');
            console.log('Energy minimization completed. Current energy:', energyCheck);
            
            // Visual feedback that it completed
            minimizeBtn.style.backgroundColor = '#4CAF50';
            minimizeBtn.textContent = 'Minimized ✓';
            
            setTimeout(() => {
                minimizeBtn.style.backgroundColor = '';
                minimizeBtn.textContent = 'Energy Minimization';
            }, 2000);
            
        }, 2000); // Reduced from 3000 to 2000ms
        
    } catch (error) {
        console.error('Error in minimizeJSmolEnergy:', error);
        const minimizeBtn = document.getElementById('minimizeBtn');
        minimizeBtn.disabled = false;
        minimizeBtn.textContent = 'Energy Minimization';
        minimizeBtn.style.backgroundColor = '';
        alert('Error during energy minimization. This feature may not be available for all molecule types.');
    }
};

// Helper function to calculate atom count from molecular formula
function calculateAtomCountFromFormula(formula) {
    if (!formula || formula === 'C?H?' || formula === 'Unknown') {
        return '0';
    }
    
    try {
        // Remove any charges, dots, or special characters, keep only elements and numbers
        const cleanFormula = formula.replace(/[+\-\.\s]/g, '');
        
        // Regex to match element symbol followed by optional number
        const elementPattern = /([A-Z][a-z]?)(\d*)/g;
        let totalAtoms = 0;
        let match;
        
        while ((match = elementPattern.exec(cleanFormula)) !== null) {
            const element = match[1];
            const count = match[2] === '' ? 1 : parseInt(match[2]);
            totalAtoms += count;
        }
        
        return totalAtoms.toString();
    } catch (error) {
        console.warn('Error parsing formula:', formula, error);
        return '0';
    }
}

// Molecule Info Functions
window.updateMoleculeInfo = function() {
    if (!window.currentJsmolApplet || typeof Jmol === 'undefined') {
        return;
    }

    try {
        let name = 'Unknown Molecule';
        let formula = 'C?H?';
        let weight = 'N/A';
        let atomCount = '0';
        
        // Prioritize data from API calls stored globally (PubChem/CIR)
        if (window.currentMoleculeData) {
            const data = window.currentMoleculeData;
            name = data.name || 'Unknown Molecule';
            formula = data.formula !== 'Unknown' ? data.formula : 'C?H?';
            atomCount = data.atomCount !== 'N/A' ? data.atomCount : '0';
            
            if (data.weight && data.weight !== 'N/A' && !isNaN(parseFloat(data.weight))) {
                weight = parseFloat(data.weight).toFixed(2) + ' Da';
            }
            
            console.log('Using API data for molecule info:', data);
        }
        
        // Fallback to JSmol data if API data is not complete
        if (name === 'Unknown Molecule') {
            const jsmolTitle = Jmol.evaluateVar(window.currentJsmolApplet, '{*}.title');
            if (jsmolTitle && jsmolTitle !== 'null') {
                name = String(jsmolTitle).replace(/"/g, '');
            }
        }
        
        if (formula === 'C?H?') {
            const jsmolFormula = Jmol.evaluateVar(window.currentJsmolApplet, '{*}.formula');
            if (jsmolFormula && jsmolFormula !== 'null') {
                formula = String(jsmolFormula).replace(/"/g, '');
            }
        }
        
        if (atomCount === '0') {
            // Try multiple approaches to get accurate atom count
            try {
                // Method 1: Try to get count directly from JSmol after ensuring hydrogens are added
                Jmol.script(window.currentJsmolApplet, 'calculate hydrogens');
                let jsmolAtomCount = Jmol.evaluateVar(window.currentJsmolApplet, '{all}.size');
                
                if (!jsmolAtomCount || jsmolAtomCount === 'null') {
                    // Method 2: Try different JSmol selection syntax
                    jsmolAtomCount = Jmol.evaluateVar(window.currentJsmolApplet, '{*}.count');
                }
                
                if (!jsmolAtomCount || jsmolAtomCount === 'null') {
                    // Method 3: Calculate from molecular formula if available
                    if (formula && formula !== 'C?H?' && formula !== 'Unknown') {
                        atomCount = calculateAtomCountFromFormula(formula);
                    }
                } else {
                    atomCount = String(jsmolAtomCount).replace(/"/g, '');
                }
                
            } catch (error) {
                console.warn('Error counting atoms:', error);
                // Final fallback: Calculate from formula or use basic count
                if (formula && formula !== 'C?H?' && formula !== 'Unknown') {
                    atomCount = calculateAtomCountFromFormula(formula);
                } else {
                    const jsmolAtomCount = Jmol.evaluateVar(window.currentJsmolApplet, '{*}.size');
                    if (jsmolAtomCount && jsmolAtomCount !== 'null') {
                        atomCount = String(jsmolAtomCount).replace(/"/g, '');
                    }
                }
            }
        }
        
        if (weight === 'N/A') {
            const jsmolWeight = Jmol.evaluateVar(window.currentJsmolApplet, '{*}.mass');
            if (jsmolWeight && jsmolWeight > 0) {
                weight = parseFloat(jsmolWeight).toFixed(2) + ' Da';
            }
        }

        // Update UI elements
        document.getElementById('moleculeName').textContent = name;
        document.getElementById('moleculeFormula').textContent = formula;
        document.getElementById('atomCount').textContent = atomCount;
        document.getElementById('molecularWeight').textContent = weight;

        console.log('Molecule info updated:', { name, formula, atomCount, weight });
    } catch (error) {
        console.error('Error updating molecule info:', error);
        // Set fallback values
        document.getElementById('moleculeName').textContent = 'Unknown Molecule';
                 document.getElementById('moleculeFormula').textContent = 'C?H?';
         document.getElementById('atomCount').textContent = '0';
         document.getElementById('molecularWeight').textContent = 'N/A';
    }
};

// Update molecule info when molecule loads or changes
window.refreshMoleculeData = function() {
    setTimeout(() => {
        updateMoleculeInfo();
    }, 1000); // Delay to ensure molecule is fully loaded
};

// Clear stored molecule data (called when loading new molecules)
window.clearMoleculeData = function() {
    window.currentMoleculeData = null;
    console.log('Molecule data cleared');
};

// Callback function for JSmol picking
window.jmolPickCallback = function(applet, atomInfo, clickCount) {
    console.log(`Atom ${clickCount} selected:`, atomInfo);
};





