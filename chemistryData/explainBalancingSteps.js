import { balanceEquation } from "./equationBalancer.js";

export function explainBalancingSteps(reactionString, parseFormula) {
  const steps = [];

  // Step 1: Разделение на левую и правую части
  const [lhs, rhs] = reactionString.split("->");
  if (!lhs || !rhs) {
    return "❌ Invalid reaction format. It must contain '->'";
  }

  const reactants = lhs.split("+").map(r => r.trim());
  const products = rhs.split("+").map(p => p.trim());
  const allCompounds = [...reactants, ...products];

  steps.push(`🔹 Reactants: ${reactants.join(", ")}`);
  steps.push(`🔹 Products: ${products.join(", ")}`);

  // Step 2: Парсинг и сбор всех элементов
  const elementSet = new Set();
  const compoundElements = allCompounds.map(compound => {
    const parsed = parseFormula(compound);
    parsed.forEach(([el]) => elementSet.add(el));
    return parsed;
  });

  const elements = Array.from(elementSet);
  steps.push(`🔹 Unique elements involved: ${elements.join(", ")}`);

  // Step 3: Создание матрицы
  const matrix = elements.map(el => {
    return compoundElements.map((compound, i) => {
      const found = compound.find(([e]) => e === el);
      const count = found ? found[1] : 0;
      return i < reactants.length ? -count : count; // отрицательно для левой части
    });
  });

  steps.push(`🔹 Constructed balance matrix:`);
  matrix.forEach((row, i) => {
    steps.push(`${elements[i]}: [${row.join(", ")}]`);
  });
 
  let result;
  try {
    result = balanceEquation(reactionString, parseFormula);
    steps.push(`🔹 Final balanced equation:`);
    steps.push(`<b>${result}</b>`);
  } catch (err) {
    steps.push(`❌ Balancing failed: ${err.message}`);
  }

  return steps.join("<br>");
}
