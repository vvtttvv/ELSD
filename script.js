import Lexer from "./lexer.js";

//To clear input
document.getElementById("clear").onclick = function() {
    document.getElementById("input").value = "";
};

//To handle input
document.getElementById("run").onclick = function() {
    document.getElementById("output").innerHTML = "";
    const input = document.getElementById("input").value;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();

    //Temporary solution to display
    tokens.forEach(token => {
        const outputElement = document.createElement("div");
        outputElement.innerHTML = JSON.stringify(token);
        document.getElementById("output").appendChild(outputElement);
    });
};