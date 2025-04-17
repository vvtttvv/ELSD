/**
 * Classification of oxides:
 * 
 * This file contains the classification of common oxides into different types:
 * - Basic oxides: form bases when reacting with water
 * - Acidic oxides: form acids when reacting with water
 * - Amphoteric oxides: can act as both acid and base
 * - Neutral/indifferent oxides: do not readily react with water
 */

export const oxideTypes = {
    // Basic oxides (metal oxides from Group 1 and 2)
    "Li2O": "basic",     // Lithium oxide
    "Na2O": "basic",     // Sodium oxide
    "K2O": "basic",      // Potassium oxide
    "Rb2O": "basic",     // Rubidium oxide
    "Cs2O": "basic",     // Cesium oxide
    "BeO": "basic",      // Beryllium oxide
    "MgO": "basic",      // Magnesium oxide
    "CaO": "basic",      // Calcium oxide
    "SrO": "basic",      // Strontium oxide
    "BaO": "basic",      // Barium oxide
    "FeO": "basic",      // Iron(II) oxide
    "Fe2O3": "basic",    // Iron(III) oxide
    "CuO": "basic",      // Copper(II) oxide
    "Cu2O": "basic",     // Copper(I) oxide
    "NiO": "basic",      // Nickel(II) oxide
    "CoO": "basic",      // Cobalt(II) oxide
    "MnO": "basic",      // Manganese(II) oxide
    "Mn2O3": "basic",    // Manganese(III) oxide
    "Ag2O": "basic",     // Silver oxide
    "HgO": "basic",      // Mercury(II) oxide
    
    // Amphoteric oxides (can act as both acid and base)
    "Al2O3": "amphoteric",  // Aluminum oxide
    "ZnO": "amphoteric",    // Zinc oxide
    "PbO": "amphoteric",    // Lead(II) oxide
    "PbO2": "amphoteric",   // Lead(IV) oxide
    "SnO": "amphoteric",    // Tin(II) oxide
    "SnO2": "amphoteric",   // Tin(IV) oxide
    "Cr2O3": "amphoteric",  // Chromium(III) oxide
    "BeO": "amphoteric",    // Beryllium oxide can also be considered amphoteric
    "Sb2O3": "amphoteric",  // Antimony(III) oxide
    "Sb2O5": "amphoteric",  // Antimony(V) oxide
    
    // Acidic oxides (non-metal oxides and high oxidation state metal oxides)
    "CO2": "acidic",     // Carbon dioxide
    "SO2": "acidic",     // Sulfur dioxide
    "SO3": "acidic",     // Sulfur trioxide
    "N2O3": "acidic",    // Dinitrogen trioxide
    "N2O5": "acidic",    // Dinitrogen pentoxide
    "P2O3": "acidic",    // Phosphorus trioxide
    "P2O5": "acidic",    // Phosphorus pentoxide
    "SiO2": "acidic",    // Silicon dioxide
    "B2O3": "acidic",    // Boron trioxide
    "Cl2O": "acidic",    // Dichlorine monoxide
    "Cl2O7": "acidic",   // Dichlorine heptoxide
    "CrO3": "acidic",    // Chromium(VI) oxide
    "Mn2O7": "acidic",   // Manganese(VII) oxide
    "MnO2": "acidic",    // Manganese(IV) oxide
    "MnO3": "acidic",    // Manganese(VI) oxide
    "V2O5": "acidic",    // Vanadium(V) oxide
    "WO3": "acidic",     // Tungsten(VI) oxide
    "MoO3": "acidic",    // Molybdenum(VI) oxide
    
    // Neutral/indifferent oxides (do not readily react with water)
    "CO": "neutral",     // Carbon monoxide
    "NO": "neutral",     // Nitrogen monoxide
    "N2O": "neutral",    // Dinitrogen monoxide (laughing gas)
    "H2O": "neutral",    // Water (technically an oxide of hydrogen)
    "H2O2": "neutral",   // Hydrogen peroxide
  };
  
  /**
   * Helper function to determine the oxide type classification
   * For oxides not explicitly listed in the oxideTypes object
   * 
   * @param {string} formula - The chemical formula of the oxide
   * @returns {string|null} - The classification of the oxide or null if undetermined
   */
  export function classifyOxide(formula) {
    // Check if the oxide is directly listed in our database
    if (oxideTypes[formula]) {
      return oxideTypes[formula];
    }
    
    // Try to determine the oxide type based on the chemical formula
    // Extract the metal/non-metal part from the oxide formula
    const match = formula.match(/^([A-Z][a-z]*)(\d*)O(\d*)$/);
    if (match) {
      const element = match[1];
      
      // Basic rule of thumb: 
      // - Oxides of metals with low oxidation states (+1, +2) are typically basic
      // - Oxides of metals with high oxidation states (+5, +6, +7) are typically acidic
      // - Oxides of metalloids and amphoteric metals can be amphoteric
      // - Oxides of non-metals are typically acidic
      
      // Groups that typically form basic oxides
      const basicMetals = ["Li", "Na", "K", "Rb", "Cs", "Fr", "Be", "Mg", "Ca", "Sr", "Ba", "Ra"];
      
      // Elements that can form amphoteric oxides
      const amphotericElements = ["Al", "Zn", "Pb", "Sn", "Cr", "Be", "Sb", "Bi", "Ga", "In", "Tl"];
      
      // Groups that typically form acidic oxides
      const acidicElements = ["C", "N", "P", "S", "Se", "Cl", "Br", "I", "B", "Si", "As", "Te"];
      
      // Transition metals that form acidic oxides in high oxidation states
      const acidicMetalsHighValence = ["Cr", "Mn", "Mo", "W", "V", "Tc", "Re"];
      
      if (basicMetals.includes(element)) {
        return "basic";
      } else if (amphotericElements.includes(element)) {
        return "amphoteric";
      } else if (acidicElements.includes(element)) {
        return "acidic";
      } else if (acidicMetalsHighValence.includes(element)) {
        // This would require further analysis of the oxidation state
        // For a comprehensive implementation, we would need to calculate the oxidation state
        return null;
      }
    }
    
    return null; // Unable to classify
  }
  
  /**
   * Get the corresponding acid formed when an acidic oxide reacts with water
   * 
   * @param {string} oxide - The chemical formula of the acidic oxide
   * @returns {string|null} - The formula of the corresponding acid or null if not applicable
   */
  export function getCorrespondingAcid(oxide) {
    const oxideToAcid = {
      "CO2": "H2CO3",     // Carbon dioxide -> Carbonic acid
      "SO2": "H2SO3",     // Sulfur dioxide -> Sulfurous acid
      "SO3": "H2SO4",     // Sulfur trioxide -> Sulfuric acid
      "N2O3": "HNO2",     // Dinitrogen trioxide -> Nitrous acid
      "N2O5": "HNO3",     // Dinitrogen pentoxide -> Nitric acid
      "P2O3": "H3PO3",    // Phosphorus trioxide -> Phosphorous acid
      "P2O5": "H3PO4",    // Phosphorus pentoxide -> Phosphoric acid
      "SiO2": "H2SiO3",   // Silicon dioxide -> Silicic acid
      "B2O3": "H3BO3",    // Boron trioxide -> Boric acid
      "Cl2O": "HClO",     // Dichlorine monoxide -> Hypochlorous acid
      "Cl2O7": "HClO4",   // Dichlorine heptoxide -> Perchloric acid
      "CrO3": "H2CrO4",   // Chromium(VI) oxide -> Chromic acid
      "Mn2O7": "HMnO4",   // Manganese(VII) oxide -> Permanganic acid
    };
    
    return oxideToAcid[oxide] || null;
  }
  
  /**
   * Get the corresponding base formed when a basic oxide reacts with water
   * 
   * @param {string} oxide - The chemical formula of the basic oxide
   * @returns {string|null} - The formula of the corresponding base or null if not applicable
   */
  export function getCorrespondingBase(oxide) {
    const oxideToBase = {
      "Li2O": "LiOH",     // Lithium oxide -> Lithium hydroxide
      "Na2O": "NaOH",     // Sodium oxide -> Sodium hydroxide
      "K2O": "KOH",       // Potassium oxide -> Potassium hydroxide
      "Rb2O": "RbOH",     // Rubidium oxide -> Rubidium hydroxide
      "Cs2O": "CsOH",     // Cesium oxide -> Cesium hydroxide
      "MgO": "Mg(OH)2",   // Magnesium oxide -> Magnesium hydroxide
      "CaO": "Ca(OH)2",   // Calcium oxide -> Calcium hydroxide
      "SrO": "Sr(OH)2",   // Strontium oxide -> Strontium hydroxide
      "BaO": "Ba(OH)2",   // Barium oxide -> Barium hydroxide
    };
    
    return oxideToBase[oxide] || null;
  }