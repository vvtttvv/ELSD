export function extractIons(formula) {
  const knownCations = [
    "NH4", "Li", "Na", "K", "Rb", "Cs",
    "Be", "Mg", "Ca", "Sr", "Ba",
    "Al", "Fe", "Fe2", "Fe3", "Zn", "Cu", "Ag", "Pb", "Sn", "Hg"
  ];

  const knownAnions = [
    "OH", "NO3", "Cl", "Br", "I", "F",
    "SO4", "SO3", "CO3", "HCO3", "PO4", "HPO4", "SiO3",
    "CH3COO", "ClO", "ClO2", "ClO3", "ClO4", "MnO4", "CrO4", "Cr2O7"
  ];

  let cation = null;
  let anion = null;

  // Try to find the longest matching cation in the formula
  for (const cat of knownCations.sort((a, b) => b.length - a.length)) {
    if (formula.includes(cat)) {
      cation = cat;
      break;
    }
  }

  // Try to find the longest matching anion in the formula (excluding the cation match)
  const tail = formula.replace(cation, '');
  for (const an of knownAnions.sort((a, b) => b.length - a.length)) {
    if (tail.includes(an)) {
      anion = an;
      break;
    }
  }

  return { cation, anion };
}
