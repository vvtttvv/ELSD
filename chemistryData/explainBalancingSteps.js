import { balanceEquation } from "./equationBalancer.js";

export function explainBalancingSteps(reactionString, parseFormula) {
  const steps = [];

  steps.push(`⚖️ <strong>Balancing steps for:</strong> ${reactionString}`);
  steps.push(``); 

  // Step 1: Parse reaction and identify components
  const [lhs, rhs] = reactionString.split("->");
  if (!lhs || !rhs) {
    return "❌ Invalid reaction format. It must contain '->'";
  }

  const reactants = lhs.split("+").map(r => r.trim());
  const products = rhs.split("+").map(p => p.trim());
  const allCompounds = [...reactants, ...products];

  steps.push(`🔹 <strong>Reactants:</strong> ${reactants.join(", ")}`);
  steps.push(`🔹 <strong>Products:</strong> ${products.join(", ")}`);
  steps.push(``); 

  // Step 2: Element analysis
  const elementSet = new Set();
  const compoundElements = allCompounds.map(compound => {
    const parsed = parseFormula(compound);
    parsed.forEach(([el]) => elementSet.add(el));
    return parsed;
  });

  const elements = Array.from(elementSet);
  steps.push(`🔹 <strong>Unique elements involved:</strong> ${elements.join(", ")}`);
  steps.push(``); 

  // Step 3: Matrix construction with explanation
  const matrix = elements.map(el => {
    return compoundElements.map((compound, i) => {
      const found = compound.find(([e]) => e === el);
      const count = found ? found[1] : 0;
      return i < reactants.length ? -count : count; // negative for reactants side
    });
  });

  steps.push(`🔹 <strong>Constructed balance matrix:</strong>`);
  steps.push(`<em>Each row represents an element, each column a compound.</em>`);
  steps.push(`<em>This forms a system of linear equations where each row must sum to zero (atoms in = atoms out).</em>`);
  steps.push(`<em>Negative values = reactants, positive values = products.</em>`);
  
  // Format matrix
  matrix.forEach((row, i) => {
    const formattedRow = row.map(val => {
      if (val >= 0) return ` ${val}`;  // Add space for positive numbers
      return `${val}`;  // Negative numbers already have minus sign
    }).join(", ");
    steps.push(`${elements[i]}: [${formattedRow}]`);
  });
  
  steps.push(``); 
 
  // Step 4: Solve and display result
  let result;
  try {
    result = balanceEquation(reactionString, parseFormula);
    steps.push(`✅ <strong>Final balanced equation:</strong>`);
    steps.push(`<strong style="color: #2c3e50; font-size: 1.1em;">${result}</strong>`);
  } catch (err) {
    steps.push(`❌ <strong>Balancing failed:</strong> ${err.message}`);
  }

  return steps.join("<br>");
}
