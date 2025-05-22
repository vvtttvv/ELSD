export function balanceEquation(reactionString, parseFormula) {
    // Split into left and right side of the reaction
    const [lhs, rhs] = reactionString.split("->");
    if (!lhs || !rhs) throw new Error("Invalid reaction format. Must contain '->'");
  
    // Separate compounds on both sides
    const reactants = lhs.split("+").map(r => r.trim());
    const products = rhs.split("+").map(p => p.trim());
    const allCompounds = [...reactants, ...products];
  
    // Parse each compound and collect unique elements
    const elementSet = new Set();
    const compoundElements = allCompounds.map(compound => {
      const parsed = parseFormula(compound);
      if (!parsed) {
        throw new Error(`Failed to parse formula: ${compound}`);
      }
      parsed.forEach(([el]) => elementSet.add(el));
      return parsed;
    });

  
    // Build matrix rows (one per element), columns (compounds)
    const elements = Array.from(elementSet);
    const matrix = elements.map(el => {
      return compoundElements.map((compound, i) => {
        console.log("Compound Elements: ", compound, "Element: ", i);
        const found = compound.find(([e]) => e === el);
        const count = found ? found[1] : 0;
        return i < reactants.length ? -count : count; // Negative for LHS
      });
    });
    let vector;
    // Solve Ax = 0 for smallest integer solution
    try {
   vector = nullSpaceVector(matrix);
  if (!vector) {
    throw new Error("Nullspace computation returned null (unexpected).");
  }
  // форматирование результата
} catch (err) {
  console.error("Balancing failed:", err.message);
  throw new Error(`Unable to balance reaction "${reactionString}": ${err.message}`);
}

  
    // Format balanced equation using solution vector
    if (!vector || vector.length !== reactants.length + products.length) {
      throw new Error(`Unable to balance reaction "${reactionString}". Check formula syntax or ensure it's chemically valid.`);
    }

    const left = reactants.map((r, i) => `${vector[i]} ${r}`).join(" + ");
    const right = products.map((p, i) => `${vector[i + reactants.length]} ${p}`).join(" + ");
    return `${left} -> ${right}`;
  }
  
  // Solves a homogeneous system Ax = 0 using rational Gaussian elimination
  function nullSpaceVector(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  if (cols === 0) throw new Error("Matrix has no columns.");
  if (rows === 0) throw new Error("Matrix has no rows.");

  // Convert to rational form
  const mat = matrix.map(row => row.map(val => ({ num: val, den: 1 })));
  let lead = 0;

  const pivotCols = [];

  // Gaussian elimination to Row Echelon Form
  for (let r = 0; r < rows; r++) {
    if (lead >= cols) break;
    let i = r;
    while (i < rows && mat[i][lead].num === 0) i++;

    if (i === rows) {
      lead++;
      r--; // Retry same row with next lead
      continue;
    }

    [mat[i], mat[r]] = [mat[r], mat[i]]; // Swap
    const lv = mat[r][lead];
    mat[r] = mat[r].map(x => divideFrac(x, lv));

    for (let j = 0; j < rows; j++) {
      if (j !== r) {
        const lv2 = mat[j][lead];
        const scaled = mat[r].map(x => multiplyFrac(x, lv2));
        mat[j] = mat[j].map((x, k) => subtractFrac(x, scaled[k]));
      }
    }

    pivotCols.push(lead);
    lead++;
  }

  // Identify free variables
  const freeVars = [];
  for (let c = 0; c < cols; c++) {
    if (!pivotCols.includes(c)) freeVars.push(c);
  }

  if (freeVars.length === 0) {
    throw new Error("No free variables: the only solution is the zero vector, can't balance.");
  }

  // Generate one solution vector by assigning 1 to first free var
  const solution = new Array(cols).fill({ num: 0, den: 1 });
  const freeIndex = freeVars[0];
  solution[freeIndex] = { num: 1, den: 1 };

  for (let r = pivotCols.length - 1; r >= 0; r--) {
    const pivot = pivotCols[r];
    let sum = { num: 0, den: 1 };

    for (let c = pivot + 1; c < cols; c++) {
      const prod = multiplyFrac(mat[r][c], solution[c]);
      sum = addFrac(sum, prod);
    }

    solution[pivot] = negateFrac(sum);
  }

  // Scale to integer solution
  const denoms = solution.map(f => f.den);
  const lcmVal = denoms.reduce((a, b) => lcm(a, b), 1);
  const scaled = solution.map(f => (f.num * lcmVal) / f.den);
  const gcdVal = scaled.reduce((a, b) => gcd(Math.abs(a), Math.abs(b)));
  const integerSolution = scaled.map(v => v / gcdVal);

  // Final check
  if (integerSolution.every(v => v === 0)) {
    throw new Error("All-zero solution vector: unable to balance.");
  }

  return integerSolution;
}

  
  // Greatest common divisor
  function gcd(a, b) {
    return b === 0 ? Math.abs(a) : gcd(b, a % b);
  }
  
  // Least common multiple
  function lcm(a, b) {
    return (!a || !b) ? 1 : Math.abs(a * b) / gcd(a, b);
  }
  
  // Fraction addition
  function addFrac(a, b) {
    const num = a.num * b.den + b.num * a.den;
    const den = a.den * b.den;
    const g = gcd(num, den);
    return { num: num / g, den: den / g };
  }
  
  // Fraction subtraction
  function subtractFrac(a, b) {
    return addFrac(a, negateFrac(b));
  }
  
  // Fraction multiplication
  function multiplyFrac(a, b) {
    const num = a.num * b.num;
    const den = a.den * b.den;
    const g = gcd(num, den);
    return { num: num / g, den: den / g };
  }
  
  // Fraction division
  function divideFrac(a, b) {
    return multiplyFrac(a, { num: b.den, den: b.num });
  }
  
  // Negates a fraction
  function negateFrac(f) {
    return { num: -f.num, den: f.den };
  }

// Input Example
/*
let rxn = "Fe + O2 -> Fe2O3";
let balanced = resolve(rxn);
show(rxn);
show(balanced);
*/