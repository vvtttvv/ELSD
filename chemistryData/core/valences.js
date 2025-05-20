/**
 * Element valences: 
 * Positive numbers represent the loss of electrons (oxidation).
 * Negative numbers represent the gain of electrons (reduction).
 * 
 * Format: elementSymbol: [array of possible valences, from most to least common]
 */

export const elementValences = {
    // Group 1 - Alkali Metals (typically +1)
    H: [1, -1],        // Hydrogen (also -1 in metal hydrides)
    Li: [1],           // Lithium
    Na: [1],           // Sodium
    K: [1],            // Potassium
    Rb: [1],           // Rubidium
    Cs: [1],           // Cesium
    Fr: [1],           // Francium
    
    // Group 2 - Alkaline Earth Metals (typically +2)
    Be: [2],           // Beryllium
    Mg: [2],           // Magnesium
    Ca: [2],           // Calcium
    Sr: [2],           // Strontium
    Ba: [2],           // Barium
    Ra: [2],           // Radium
    
    // Group 3-12 - Transition Metals (variable valences)
    Sc: [3],           // Scandium
    Ti: [4, 3, 2],     // Titanium
    V: [5, 4, 3, 2],   // Vanadium
    Cr: [6, 3, 2],     // Chromium
    Mn: [7, 6, 4, 3, 2], // Manganese
    Fe: [3, 2],        // Iron
    Co: [3, 2],        // Cobalt
    Ni: [2, 3],        // Nickel
    Cu: [2, 1],        // Copper
    Zn: [2],           // Zinc
    Y: [3],            // Yttrium
    Zr: [4],           // Zirconium
    Nb: [5, 3],        // Niobium
    Mo: [6, 4, 3, 2],  // Molybdenum
    Tc: [7, 4],        // Technetium
    Ru: [3, 4, 6, 8],  // Ruthenium
    Rh: [3],           // Rhodium
    Pd: [2, 4],        // Palladium
    Ag: [1],           // Silver
    Cd: [2],           // Cadmium
    Hf: [4],           // Hafnium
    Ta: [5],           // Tantalum
    W: [6, 4, 2],      // Tungsten
    Re: [7, 4],        // Rhenium
    Os: [4, 3, 8],     // Osmium
    Ir: [3, 4, 6],     // Iridium
    Pt: [2, 4],        // Platinum
    Au: [3, 1],        // Gold
    Hg: [2, 1],        // Mercury
    
    // Group 13 - Boron Group
    B: [3],            // Boron
    Al: [3],           // Aluminum
    Ga: [3, 1],        // Gallium
    In: [3, 1],        // Indium
    Tl: [1, 3],        // Thallium
    
    // Group 14 - Carbon Group
    C: [4, 2, -4],     // Carbon
    Si: [4, -4],       // Silicon
    Ge: [4, 2],        // Germanium
    Sn: [4, 2],        // Tin
    Pb: [4, 2],        // Lead
    
    // Group 15 - Nitrogen Group
    N: [5, 4, 3, 2, -3], // Nitrogen
    P: [5, 3, -3],     // Phosphorus
    As: [5, 3, -3],    // Arsenic
    Sb: [5, 3, -3],    // Antimony
    Bi: [5, 3],        // Bismuth
    
    // Group 16 - Chalcogens
    O: [-2],           // Oxygen
    S: [6, 4, 2, -2],  // Sulfur
    Se: [6, 4, -2],    // Selenium
    Te: [6, 4, -2],    // Tellurium
    Po: [4, 2],        // Polonium
    
    // Group 17 - Halogens
    F: [-1],           // Fluorine
    Cl: [-1, 1, 3, 5, 7], // Chlorine
    Br: [-1, 1, 3, 5], // Bromine
    I: [-1, 1, 3, 5, 7], // Iodine
    At: [-1, 1, 3, 5, 7], // Astatine
    
    // Group 18 - Noble Gases
    He: [0],           // Helium
    Ne: [0],           // Neon
    Ar: [0],           // Argon
    Kr: [0, 2],        // Krypton (can form some compounds)
    Xe: [0, 2, 4, 6, 8], // Xenon (can form some compounds)
    Rn: [0, 2],        // Radon
    
    // Lanthanides (typically +3, some +2 or +4)
    La: [3],           // Lanthanum
    Ce: [3, 4],        // Cerium
    Pr: [3, 4],        // Praseodymium
    Nd: [3],           // Neodymium
    Pm: [3],           // Promethium
    Sm: [3, 2],        // Samarium
    Eu: [3, 2],        // Europium
    Gd: [3],           // Gadolinium
    Tb: [3, 4],        // Terbium
    Dy: [3],           // Dysprosium
    Ho: [3],           // Holmium
    Er: [3],           // Erbium
    Tm: [3, 2],        // Thulium
    Yb: [3, 2],        // Ytterbium
    Lu: [3],           // Lutetium
    
    // Actinides (variable valences)
    Ac: [3],           // Actinium
    Th: [4],           // Thorium
    Pa: [5, 4],        // Protactinium
    U: [6, 4, 3],      // Uranium
    Np: [5, 4, 3],     // Neptunium
    Pu: [4, 3, 5, 6],  // Plutonium
    Am: [3, 4, 5, 6],  // Americium
  };
  
  export const polyatomicIons = {
    // Positive ions
    "NH4": 1,          // Ammonium
    "H3O": 1,          // Hydronium
    
    // Negative ions
    "OH": -1,          // Hydroxide
    "CN": -1,          // Cyanide
    "NO2": -1,         // Nitrite
    "NO3": -1,         // Nitrate
    "ClO": -1,         // Hypochlorite
    "ClO2": -1,        // Chlorite
    "ClO3": -1,        // Chlorate
    "ClO4": -1,        // Perchlorate
    "CH3COO": -1,      // Acetate
    "HCO3": -1,        // Bicarbonate/Hydrogen carbonate
    "HSO4": -1,        // Bisulfate/Hydrogen sulfate
    "HSO3": -1,        // Bisulfite/Hydrogen sulfite
    "H2PO4": -1,       // Dihydrogen phosphate
    "MnO4": -1,        // Permanganate
    
    "CO3": -2,         // Carbonate
    "SO4": -2,         // Sulfate
    "SO3": -2,         // Sulfite
    "S2O3": -2,        // Thiosulfate
    "HPO4": -2,        // Hydrogen phosphate
    "CrO4": -2,        // Chromate
    "Cr2O7": -2,       // Dichromate
    "SiO3": -2,        // Silicate
    "O2": -2,          // Peroxide
    
    "PO4": -3,         // Phosphate
    "AsO4": -3,        // Arsenate
    
    "Fe(CN)6": -4,     // Ferrocyanide
  };
  
  // Helper function to get the most common valence of an element
  export function getMostCommonValence(element) {
    if (elementValences[element] && elementValences[element].length > 0) {
      return elementValences[element][0];
    }
    return null;
  }
  
  // Helper function to check if an element can have a specific valence
  export function hasValence(element, valence) {
    return elementValences[element] && elementValences[element].includes(valence);
  }

// export function balanceSaltFormula(cation, anion) {
//   const catVal = Math.abs(getMostCommonValence(cation));
//   const anVal = Math.abs(polyatomicIons[anion] || getMostCommonValence(anion));

//   if (!catVal || !anVal) return null;

//   const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
//   const lcm = (a, b) => (a * b) / gcd(a, b);

//   const LCM = lcm(catVal, anVal);
//   const catCount = LCM / catVal;
//   const anCount = LCM / anVal;

//   // Format component
//   const format = (ion, count) => {
//     if (count === 1) return ion;
//     if (ion.length > 1) return `(${ion})${count}`;
//     return `${ion}${count}`;
//   };

//   const cationPart = format(cation, catCount);
//   const anionPart = format(anion, anCount);

//   return `${cationPart}${anionPart}`;
// }


  export function balanceSaltFormula(cation, anion) {
    const catVal = Math.abs(getMostCommonValence(cation));
    const anVal = Math.abs(polyatomicIons[anion] || getMostCommonValence(anion));

    if (!catVal || !anVal) return null;

    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const lcm = (a, b) => (a * b) / gcd(a, b);

    const LCM = lcm(catVal, anVal);
    const catCount = LCM / catVal;
    const anCount = LCM / anVal;

    const formatIon = (ion, count) => {
      if (count === 1) return ion;
      const needsParens = ion.length > 1 && /[^A-Za-z]/.test(ion);
      return needsParens ? `(${ion})${count}` : `${ion}${count}`;
    };

    return `${formatIon(cation, catCount)}${formatIon(anion, anCount)}`;
  }

