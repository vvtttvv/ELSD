// Function to extract cation and anion from a compound formula
export function extractIons(formula) {
    // we will need to improve it since this is just a headstart
    // Common cations
    const cations = {
      "H": 1, "Li": 1, "K": 1, "Na": 1, "NH4": 1,
      "Ba": 2, "Ca": 2, "Mg": 2, "Al": 3, "Cr": 3,
      "Fe2": 2, "Fe3": 3, "Ni": 2, "Co": 2, "Mn": 2, 
      "Zn": 2, "Ag": 1, "Hg": 2, "Rb": 1, "Sn": 2, "Cu": 2
    };
    
    // Common anions
    const anions = {
      "OH": -1, "F": -1, "Cl": -1, "Br": -1, "I": -1,
      "S": -2, "SO4": -2, "SO3": -2, "PO4": -3, "CO3": -2,
      "SiO3": -2, "NO3": -1, "CH3COO": -1
    };
    
    let cation = null;
    let anion = null;

    for (const c in cations) {
        if (formula.includes(c)) {
        cation = c;
        break;
        }
    }

    for (const a in anions) {
        if (formula.includes(a)) {
        anion = a;
        break;
        }
    }

    return { cation, anion };
  }