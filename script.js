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
