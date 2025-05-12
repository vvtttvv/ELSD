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
      const parsed = parseFormula(compound); // Delegated formula parsing
      parsed.forEach(([el]) => elementSet.add(el));
      return parsed;
    });
  
    // Build matrix rows (one per element), columns (compounds)
    const elements = Array.from(elementSet);
    const matrix = elements.map(el => {
      return compoundElements.map((compound, i) => {
        const found = compound.find(([e]) => e === el);
        const count = found ? found[1] : 0;
        return i < reactants.length ? -count : count; // Negative for LHS
      });
    });
  
    // Solve Ax = 0 for smallest integer solution
    const vector = nullSpaceVector(matrix);
  
    // Format balanced equation using solution vector
    const left = reactants.map((r, i) => `${vector[i]} ${r}`).join(" + ");
    const right = products.map((p, i) => `${vector[i + reactants.length]} ${p}`).join(" + ");
    return `${left} -> ${right}`;
  }
  
  // Solves a homogeneous system Ax = 0 using rational Gaussian elimination
  function nullSpaceVector(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
  
    // Convert numbers to rational form {num, den}
    const mat = matrix.map(row => row.map(val => ({ num: val, den: 1 })));
    let lead = 0;
  
    // Forward elimination to row echelon form
    for (let r = 0; r < rows; r++) {
      if (cols <= lead) break;
      let i = r;
      while (mat[i][lead].num === 0) {
        i++;
        if (i === rows) {
          i = r;
          lead++;
          if (cols === lead) return null;
        }
      }
      [mat[i], mat[r]] = [mat[r], mat[i]];
      const lv = mat[r][lead];
      mat[r] = mat[r].map(x => divideFrac(x, lv));
      for (let i = 0; i < rows; i++) {
        if (i !== r) {
          const lv2 = mat[i][lead];
          const scaled = mat[r].map(x => multiplyFrac(x, lv2));
          mat[i] = mat[i].map((x, j) => subtractFrac(x, scaled[j]));
        }
      }
      lead++;
    }
  
    // Back substitution assuming last variable is free and = 1
    const solution = new Array(cols).fill({ num: 0, den: 1 });
    solution[cols - 1] = { num: 1, den: 1 };
  
    for (let r = rows - 1; r >= 0; r--) {
      let pivot = -1;
      for (let c = 0; c < cols; c++) {
        if (Math.abs(mat[r][c].num) > 1e-8) {
          pivot = c;
          break;
        }
      }
      if (pivot === -1 || pivot === cols - 1) continue;
      let sum = { num: 0, den: 1 };
      for (let j = pivot + 1; j < cols; j++) {
        const prod = multiplyFrac(mat[r][j], solution[j]);
        sum = addFrac(sum, prod);
      }
      solution[pivot] = negateFrac(sum);
    }
  
    // Convert fractional solution to smallest integer values
    const denoms = solution.map(x => x.den);
    const lcmVal = denoms.reduce((a, b) => lcm(a, b), 1);
    const scaled = solution.map(x => (x.num * lcmVal) / x.den);
    const gcdVal = scaled.reduce((a, b) => gcd(a, b));
    return scaled.map(x => x / gcdVal);
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