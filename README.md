# Introduction
ChemOrg is a domain-specific language (DSL) interpreter designed to evaluate, analyse, and simulate chemical expressions and reactions in a structured, programmable environment. It was made by a small team from the Technical University of Moldova, FCIM faculty, software engineering program. The goal is to assist high school and university students in solving chemistry problems.

## ✨ Key Features
- 🧪 **Chemical Reaction Analysis** - Comprehensive reaction feasibility, balancing, and step-by-step explanations
- ⚖️ **Advanced Equation Balancing** - Matrix-based balancing with detailed mathematical insights
- 🔬 **3D Molecular Visualization** - Interactive JSmol integration with customizable parameters
- 📊 **Quantitative Chemistry** - Molecular weight, volume calculations, and thermodynamic properties
- 🎓 **Educational Focus** - Step-by-step explanations and visual learning aids

# Contents

- [How to run the DSL](#how-to-run-the-dsl)
- [How to use the DSL](#how-to-use-the-dsl)
- [Syntax](#syntax)
- [Chemistry Functionalities](#chemistry-functionalities)
  - [Reaction possibility](#reaction-possibility)
  - [Balance reaction](#balance-reaction)
  - [Oxidizing agents](#oxidizing-agents)
  - [Reducing agents](#reducing-agents)
  - [Molecular weight](#molecular-weight)
  - [Volume calculations](#volume-calculations)
  - [Acid/Base testing](#acidbase-testing)
  - [Advanced visualization](#visualize-formula)

# How to run the DSL
Modern web browsers enforce strict security policies that prevent ES module-based JavaScript projects from being launched directly via `index.html` using the `file://` protocol. As a result, attempting to run a modular project locally without a server may result in import errors.
There are two approaches to run the project:
### 1. Use a Local Development Server
A more robust and maintainable solution is to run the project through a local server environment. If you're using **Visual Studio Code**, you can install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
Once installed:
- Right-click on `index.html`
- Select **"Open with Live Server"**
This will launch the project in your default browser via a local HTTP server, enabling full support for ES module imports.
### 2. Bundle All JavaScript Files into a Single Script
This method involves manually or programmatically merging all JavaScript files into a single `script.js` file. All `import` and `export` statements must be removed, and module logic should be adapted accordingly. This approach consolidates the entire project into one file, allowing it to be executed directly without a module loader.

# How to use the DSL
Upon opening `index.html`, you will be presented with an interface consisting of two main panels. You can enter expressions or code in the left panel. To execute the code, click the **"Run"** button. The output will be displayed follows in the right panel. A detailed parse tree will be printed to the browser's developer console. To view the console output, open the developer tools by pressing **Ctrl + Shift + J** .

# Syntax

### **Variable declaration (`let`)** - Declares and assigns a variable.  
`let x = "C6H6"`

### **Variable reassignment (`=`)** - Updates the value of an existing variable.  
`x = "H2O"`

### **Output display (`show`)** - Prints a value in the output panel.

Input:`show("Result")`

Output:`Result`

### **Conditional execution (`if`, `elif`, `else`)** -Executes blocks of code based on truth ondition.

Input:
```
if (possible("NaOH + HCl -> NaCl + H2O")) {
show("Valid reaction");
} else {
show("Invalid reaction");
}
```

Output:`Valid reaction`

### **String concatenation (`+`)** - Joins two strings into one.
  
Input:
```
let var = "C6H6";
show(var + " + O2 -> CO2 + H2O");
```

Output: `C6H6 + O2 -> CO2 + H2O`


# Chemistry Functionalities

## 🧪 Chemical Analysis Functions
- [Reaction possibility](#reaction-possibility) - Comprehensive reaction feasibility analysis
- [Balance reaction](#balance-reaction) - Multi-mode equation balancing with step-by-step explanations
- [Oxidizing agents](#oxidizing-agents) - Identify electron acceptors in reactions
- [Reducing agents](#reducing-agents) - Identify electron donors in reactions

## 📊 Quantitative Chemistry
- [Molecular weight](#molecular-weight) - Calculate molecular mass with isotope support
- [Volume calculations](#volume-calculations) - Mass-density, gas law, and specific volume calculations
- [Acid/Base testing](#acidbase-testing) - Identify acidic and basic compounds

## 🔬 Advanced Visualization
- [Visualize formula](#visualize-formula) - Interactive 3D molecular visualization with customizable parameters

## Reaction possibility
Checks whether a given chemical reaction is feasible based on known compound interactions and rules.  
**Input:** `show(possible("NaOH + HCl -> NaCl + H2O"));`  
**Output:**  
`The reaction "NaOH + HCl -> NaCl + H2O" is chemically possible.`

- **✓ Conditions:** room temperature, aqueous  
- **🧪 Reactant information:**  
  • HCl: Strong Non-oxygenated Acid (monoprotic)  
  • NaOH: Strong Base (Soluble)

`true`

## Balance reaction
Resolves and processes chemical equations with different analysis modes.

### 📊 Balanced Mode (default)
Balances a chemical equation with stoichiometric coefficients.  
**Input:** `show(resolve("Na3PO4 + CaCl2 -> Ca3(PO4)2 + NaCl"));`  
**Output:** `"2 Na3PO4 + 3 CaCl2 -> 1 Ca3(PO4)2 + 6 NaCl"`

### 🔍 Raw Mode
Extracts and displays raw reactants and products without balancing.  
**Input:** `show(resolve("H2 + O2 -> H2O", "raw"));`  
**Output:** `Reactants: H2, O2 | Products: H2O`

### 📝 Steps Mode
Provides detailed step-by-step balancing process with matrix analysis.  
**Input:** `show(resolve("Ca + H2O -> Ca(OH)2 + H2", "steps"));`  
**Output:**  
```
⚖️ Balancing steps for: Ca + H2O -> Ca(OH)2 + H2

🔹 Reactants: Ca, H2O
🔹 Products: Ca(OH)2, H2
🔹 Unique elements involved: Ca, H, O

🔹 Constructed balance matrix:
Each row represents an element, each column a compound.
This forms a system of linear equations where each row must sum to zero (atoms in = atoms out).
Negative values = reactants, positive values = products.
Ca: [-1,  0,  1,  0]
H: [ 0, -2,  2,  2]
O: [ 0, -1,  2,  0]

✅ Final balanced equation:
1 Ca + 2 H2O -> 1 Ca(OH)2 + 1 H2
```

## Oxidizing agents
Returns known oxidizing agents found in the reaction.  
**Input:** `show(getOxidixngs("H2 + Cl2 -> HCl"));`  
**Output:** `Oxidizing Agent: Cl2`

## Reducing agents
Returns known reducing agents found in the reaction.  
**Input:** `show(getReducings("Fe + CuSO4 -> FeSO4 + Cu"));`  
**Output:** `Reducing Agent: Fe`

## Molecular weight
Calculates molecular weight of a compound. 
**Input:** `show(getMolecWeight("H2O"));`  
**Output:** `18.015`

## Volume calculations
Multiple volume calculation methods for different chemical scenarios.

### Volume from mass and density
Computes volume using mass and density.  
**Input:** `show(getVolume(10, 2));`  
**Output:** `5`

### Gas volume (Ideal Gas Law)
Calculates volume of a gas using the Ideal Gas Law. Requires `"custom"` as the second argument, followed by temperature (K) and pressure (kPa).  
**Input:** `show(getVolume(1, "custom", 273.15, 101.325));`  
**Output:** `0.221...`  

**Input:** `show(getVolume(2, "custom", 300, 100));`  
**Output:** `0.4926...`

_Note: The function returns values in liters._

### Specific volume
Computes specific volume from total volume and mass.  
**Input:** `show(getV(22.4, 1));`  
**Output:** `22.4`

## Acid/Base testing
Identify the nature of chemical compounds.

### Acid check
Returns `true` if the compound is acidic.  
**Input:** `show(isAcid("HCl"));`  
**Output:** `true`

### Base check
Returns `true` if the compound is basic.  
**Input:** `show(isBase("NaOH"));`  
**Output:** `true`

## Visualize formula
Displays a 2D and 3D graphical representation of a chemical formula or molecule with extensive customization options.
**It's preferable to use the name of the formula e.g. "benzene" for better accuracy and faster results**.

### 💡 Basic Usage
**Input:** `visualize("C6H6");` | `visualize("benzene");`  
**Output:** Interactive 2D and 3D molecular visualization

### ⚙️ Advanced Parameters
**String Format:**  
`visualize("H2O", "mode:jsmol, style:ballstick, background:black, dipoles:bond");`

**JSON Format:**  
`visualize("CH4", '{"mode":"jsmol", "style":"spacefill", "charges":"show", "minimize":true}');`

### 🔧 Available Parameters
- **mode:** `"jsmol"` (forces 3D visualization)
- **style:** `"ballstick"`, `"stick"`, `"spacefill"`, `"wireframe"`
- **background:** `"white"`, `"black"`, `"gray"`
- **dipoles:** `"hide"`, `"bond"`, `"overall"`, `"show"`
- **charges:** `"hide"`, `"show"` (displays partial charges)
- **minimize:** `true`/`false` (energy minimization)
- **mep:** `"off"`, `"lucent"`, `"opaque"` (electron density surface)
- **tools:** `["distance", "angle", "torsion"]` (measurement tools)
- **quality:** `"high"`, `"standard"`
- **export:** `"save"` (auto-export image)

### 🧪 Examples
```javascript
// Advanced research visualization
visualize("lysergide", '{"mode":"jsmol", "style":"ballstick", "background":"black", "dipoles":"overall", "charges":"show", "quality":"high"}');

// Educational water molecule analysis
visualize("H2O", "mode:jsmol, style:ballstick, dipoles:bond, charges:show, background:white, quality:high");
```

**Output:**

### 2D Visualization (Kekule.js)
![Kekule 2D Visualization](/images/kekule.png)

### 3D Visualization (JSmol)
![JSmol 3D Visualization](/images/jsmol.png) 
