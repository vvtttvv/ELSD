//Classification of chemical elements by their properties

// Elements classified as metals
export const metals = [
    // Group 1 - Alkali Metals
    'Li', 'Na', 'K', 'Rb', 'Cs', 'Fr',
    // Group 2 - Alkaline Earth Metals
    'Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra',
    // Group 13 metals (Boron group)
    'Al', 'Ga', 'In', 'Tl',
    // Group 14 metals (Carbon group)
    'Sn', 'Pb',
    // Group 15 metal (Nitrogen group)
    'Bi'
  ];
  
  // Transition metals (d-block elements)
  export const transitionMetals = [
    // First row (Period 4)
    'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
    // Second row (Period 5)
    'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd',
    // Third row (Period 6)
    'La', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg'
  ];
  
  // Inner transition metals (f-block elements)
  export const innerTransitionMetals = [
    // Lanthanides
    'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
    // Actinides
    'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr'
  ];
  
  // Metalloids (elements with properties of both metals and non-metals)
  export const metalloids = [
    'B', 'Si', 'Ge', 'As', 'Sb', 'Te', 'Po', 'At'
  ];
  
  // Non-metals
  export const nonMetals = [
    // Hydrogen is sometimes classified differently
    'H',
    // Carbon group non-metals
    'C',
    // Nitrogen group non-metals
    'N', 'P',
    // Chalcogens (Oxygen group)
    'O', 'S', 'Se',
    // Halogens
    'F', 'Cl', 'Br', 'I'
  ];
  
  // Noble gases
  export const nobleGases = [
    'He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'
  ];
  
  // Elements that form amphoteric oxides
  export const amphotericOxideFormers = [
    'Al', 'Zn', 'Sn', 'Pb', 'Cr', 'Be', 'Ga'
  ];
  
  // Elements that can form indifferent oxides
  export const indifferentOxideFormers = [
    'C', 'N'
  ];
  
  //Categorizes an element
 
  export function categorizeElement(element) {
    if (metals.includes(element) || transitionMetals.includes(element) || innerTransitionMetals.includes(element)) {
      return 'metal';
    }
    
    if (metalloids.includes(element)) {
      return 'metalloid';
    }
    
    if (nonMetals.includes(element)) {
      return 'non-metal';
    }
    
    if (nobleGases.includes(element)) {
      return 'noble-gas';
    }
    
    return 'unknown';
  }
  
  //Checks if an element is a metal
  export function isMetal(element) {
    return metals.includes(element) || 
           transitionMetals.includes(element) || 
           innerTransitionMetals.includes(element);
  }
  
  //Checks if an element is a non-metal
  export function isNonMetal(element) {
    return nonMetals.includes(element) || nobleGases.includes(element);
  }
  
  //Checks if an element is a metalloid
  export function isMetalloid(element) {
    return metalloids.includes(element);
  }
  
  // Checks if an element forms amphoteric oxides
  export function formsAmphotericOxides(element) {
    return amphotericOxideFormers.includes(element);
  }
  
  //Checks if an element can form indifferent oxides
  export function formsIndifferentOxides(element) {
    return indifferentOxideFormers.includes(element);
  }