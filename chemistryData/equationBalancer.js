export function parseFormula(formula) {
    const regex = /([A-Z][a-z]*)(\d*)/g;
    const components = [];
    let match;
    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      const count = match[2] === "" ? 1 : parseInt(match[2]);
      components.push([element, count]);
    }
    return components;
  }
  
  export function balanceEquation(reactionString) {
    const [lhs, rhs] = reactionString.split("->");
    if (!lhs || !rhs) throw new Error("Invalid reaction format. Must contain '->'");
  
    const reactants = lhs.split("+").map(r => r.trim());
    const products = rhs.split("+").map(p => p.trim());
    const allCompounds = [...reactants, ...products];
  
    const elementSet = new Set();
    const compoundElements = allCompounds.map(compound => {
      const parsed = parseFormula(compound);
      parsed.forEach(([el]) => elementSet.add(el));
      return parsed;
    });
  
    const elements = Array.from(elementSet);
    const matrix = elements.map(el => {
      return compoundElements.map((compound, i) => {
        const found = compound.find(([e]) => e === el);
        const count = found ? found[1] : 0;
        return i < reactants.length ? -count : count;
      });
    });
  
    const vector = nullSpaceVector(matrix);
    const left = reactants.map((r, i) => `${vector[i]} ${r}`).join(" + ");
    const right = products.map((p, i) => `${vector[i + reactants.length]} ${p}`).join(" + ");
    return `${left} → ${right}`;
  }
  
  function nullSpaceVector(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
  
    const mat = matrix.map(row => row.map(val => ({ num: val, den: 1 })));
    let lead = 0;
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
  
    const denoms = solution.map(x => x.den);
    const lcmVal = denoms.reduce((a, b) => lcm(a, b), 1);
    const scaled = solution.map(x => (x.num * lcmVal) / x.den);
    const gcdVal = scaled.reduce((a, b) => gcd(a, b));
    return scaled.map(x => x / gcdVal);
  }
  
  function gcd(a, b) {
    return b === 0 ? Math.abs(a) : gcd(b, a % b);
  }
  function lcm(a, b) {
    return (!a || !b) ? 1 : Math.abs(a * b) / gcd(a, b);
  }
  function addFrac(a, b) {
    const num = a.num * b.den + b.num * a.den;
    const den = a.den * b.den;
    const g = gcd(num, den);
    return { num: num / g, den: den / g };
  }
  function subtractFrac(a, b) {
    return addFrac(a, negateFrac(b));
  }
  function multiplyFrac(a, b) {
    const num = a.num * b.num;
    const den = a.den * b.den;
    const g = gcd(num, den);
    return { num: num / g, den: den / g };
  }
  function divideFrac(a, b) {
    return multiplyFrac(a, { num: b.den, den: b.num });
  }
  function negateFrac(f) {
    return { num: -f.num, den: f.den };
  }  