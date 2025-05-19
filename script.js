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
      outputElement.textContent = message;
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


// Documentation popup
document.getElementById("doc").onclick = function () {
  const modal = document.getElementById("docModal");
  modal.style.display = "block";

  document.getElementById("docContent").innerHTML = `
  <h3>📘 ChemOrg DSL - Function Reference</h3>
  <ul>
    <li><code>resolve(expression, outputType?)</code> – balances the chemical equation. Optional output: "balanced", "steps", or "raw".</li>
    <li><code>possible(expression)</code> – returns true if the reaction is chemically feasible.</li>
    <li><code>getOxidixngs(expression)</code> – extracts the oxidizing agents from a reaction.</li>
    <li><code>getReducings(expression)</code> – extracts the reducing agents from a reaction.</li>
    <li><code>show(expression)</code> – displays the expression in the output window.</li>
    <li><code>getMolecWeight(expression, includeIsotopes?)</code> – calculates molecular weight. Optional: use isotopes (true/false).</li>
    <li><code>getVolume(expression, "custom"?, temperature?, pressure?)</code> – calculates gas volume under standard or custom conditions.</li>
    <li><code>getV(volume, mass)</code> – calculates specific volume using volume and molecular mass.</li>
    <li><code>isAcid(expression)</code> – returns true if the compound is acidic.</li>
    <li><code>isBase(expression)</code> – returns true if the compound is basic.</li>
    <li><code>visualise(expression)</code> – shows a 2D graphical representation of the molecule or formula.</li>
  </ul>
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
    console.log(molBlock); 
    const kekuleMol = Kekule.IO.loadFormatData(molBlock, 'mol');
    var parentElem = document.getElementById('visualize');
    Kekule.DomUtils.clearChildContent(parentElem);
    var drawBridgeManager = Kekule.Render.DrawBridge2DMananger;
    var drawBridge = drawBridgeManager.getPreferredBridgeInstance();
    var dim = Kekule.HtmlElementUtils.getElemOffsetDimension(parentElem); 
    var context = drawBridge.createContext(parentElem, dim.width, dim.height);  
    var rendererClass = Kekule.Render.get2DRendererClass(kekuleMol);
    var renderer = new rendererClass(kekuleMol, drawBridge);  // create concrete renderer object and bind it with mol and draw bridge
    var configObj = Kekule.Render.Render2DConfigs.getInstance();
    var options = Kekule.Render.RenderOptionUtils.convertConfigsToPlainHash(configObj); 
    renderer.draw(context, {'x': dim.width / 2, 'y': dim.height / 2}, options);

    
    var parentElem3d = document.getElementById('visualize3d');
    Kekule.DomUtils.clearChildContent(parentElem3d);
    var viewer3d = new Kekule.ChemWidget.Viewer(parentElem3d);
    viewer3d.setRenderType(Kekule.Render.RendererType.R3D);  // Use 3D render
    viewer3d.setChemObj(kekuleMol);  // Assign molecule
    viewer3d.setEnableToolbar(true);  // Optional UI toolbar
    viewer3d.setPredefinedSetting('ballStick');  // ballStick, stick, spaceFill etc.

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
