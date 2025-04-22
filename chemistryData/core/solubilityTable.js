/** 
 * Solubility table - maps anion + cation pairs to solubility status
 * P = soluble, 
 * H = insoluble, 
 * M = less soluble, 
 * "-" = does not exist or dissolves in water
*/
export const solubilityTable = {
    // Format: "anion_cation": "solubility"
    
    // Hydroxide (OH-) solubility
    "OH_H": "P", "OH_Li": "P", "OH_K": "P", "OH_Na": "P", "OH_NH4": "P",
    "OH_Ba": "P", "OH_Ca": "M", "OH_Mg": "H", "OH_Al": "H", "OH_Cr": "H",
    "OH_Fe2": "H", "OH_Fe3": "H", "OH_Ni": "H", "OH_Co": "H", "OH_Mn": "H",
    "OH_Zn": "H", "OH_Ag": "-", "OH_Hg": "-", "OH_Rb": "H", "OH_Sn": "H", "OH_Cu": "H",
    
    // Fluoride (F-) solubility
    "F_H": "P", "F_Li": "H", "F_K": "P", "F_Na": "P", "F_NH4": "P",
    "F_Ba": "M", "F_Ca": "H", "F_Mg": "H", "F_Al": "P", "F_Cr": "P",
    "F_Fe2": "M", "F_Fe3": "H", "F_Ni": "H", "F_Co": "M", "F_Mn": "M",
    "F_Zn": "M", "F_Ag": "P", "F_Hg": "H", "F_Rb": "H", "F_Sn": "P", "F_Cu": "H",
    
    // Chloride (Cl-) solubility
    "Cl_H": "P", "Cl_Li": "P", "Cl_K": "P", "Cl_Na": "P", "Cl_NH4": "P",
    "Cl_Ba": "P", "Cl_Ca": "P", "Cl_Mg": "P", "Cl_Al": "P", "Cl_Cr": "P",
    "Cl_Fe2": "P", "Cl_Fe3": "P", "Cl_Ni": "P", "Cl_Co": "P", "Cl_Mn": "P",
    "Cl_Zn": "P", "Cl_Ag": "H", "Cl_Hg": "P", "Cl_Rb": "M", "Cl_Sn": "P", "Cl_Cu": "P",
    
    // Bromide (Br-) solubility
    "Br_H": "P", "Br_Li": "P", "Br_K": "P", "Br_Na": "P", "Br_NH4": "P",
    "Br_Ba": "P", "Br_Ca": "P", "Br_Mg": "P", "Br_Al": "P", "Br_Cr": "P",
    "Br_Fe2": "P", "Br_Fe3": "P", "Br_Ni": "P", "Br_Co": "P", "Br_Mn": "P",
    "Br_Zn": "P", "Br_Ag": "H", "Br_Hg": "M", "Br_Rb": "M", "Br_Sn": "P", "Br_Cu": "P",
    
    // Iodide (I-) solubility
    "I_H": "P", "I_Li": "P", "I_K": "P", "I_Na": "P", "I_NH4": "P",
    "I_Ba": "P", "I_Ca": "P", "I_Mg": "P", "I_Al": "P", "I_Cr": "P",
    "I_Fe2": "P", "I_Fe3": "-", "I_Ni": "P", "I_Co": "P", "I_Mn": "P",
    "I_Zn": "P", "I_Ag": "H", "I_Hg": "H", "I_Rb": "H", "I_Sn": "M", "I_Cu": "-",
    
    // Sulfide (S2-) solubility
    "S_H": "P", "S_Li": "P", "S_K": "P", "S_Na": "P", "S_NH4": "P",
    "S_Ba": "P", "S_Ca": "P", "S_Mg": "P", "S_Al": "-", "S_Cr": "-",
    "S_Fe2": "H", "S_Fe3": "-", "S_Ni": "H", "S_Co": "H", "S_Mn": "H",
    "S_Zn": "H", "S_Ag": "H", "S_Hg": "H", "S_Rb": "H", "S_Sn": "H", "S_Cu": "H",
    
    // Sulfate (SO4 2-) solubility
    "SO4_H": "P", "SO4_Li": "P", "SO4_K": "P", "SO4_Na": "P", "SO4_NH4": "P",
    "SO4_Ba": "H", "SO4_Ca": "H", "SO4_Mg": "H", "SO4_Al": "-", "SO4_Cr": "-",
    "SO4_Fe2": "H", "SO4_Fe3": "-", "SO4_Ni": "H", "SO4_Co": "H", "SO4_Mn": "H",
    "SO4_Zn": "H", "SO4_Ag": "H", "SO4_Hg": "-", "SO4_Rb": "H", "SO4_Sn": "-", "SO4_Cu": "-",
    
    // Sulfite (SO3 2-) solubility
    "SO3_H": "P", "SO3_Li": "P", "SO3_K": "P", "SO3_Na": "P", "SO3_NH4": "P",
    "SO3_Ba": "H", "SO3_Ca": "M", "SO3_Mg": "P", "SO3_Al": "P", "SO3_Cr": "P",
    "SO3_Fe2": "P", "SO3_Fe3": "P", "SO3_Ni": "P", "SO3_Co": "P", "SO3_Mn": "P",
    "SO3_Zn": "P", "SO3_Ag": "M", "SO3_Hg": "P", "SO3_Rb": "H", "SO3_Sn": "P", "SO3_Cu": "P",
    
    // Phosphate (PO4 3-) solubility
    "PO4_H": "P", "PO4_Li": "H", "PO4_K": "P", "PO4_Na": "P", "PO4_NH4": "P",
    "PO4_Ba": "H", "PO4_Ca": "H", "PO4_Mg": "H", "PO4_Al": "H", "PO4_Cr": "H",
    "PO4_Fe2": "H", "PO4_Fe3": "H", "PO4_Ni": "H", "PO4_Co": "H", "PO4_Mn": "H",
    "PO4_Zn": "H", "PO4_Ag": "H", "PO4_Hg": "H", "PO4_Rb": "H", "PO4_Sn": "H", "PO4_Cu": "H",
    
    // Carbonate (CO3 2-) solubility
    "CO3_H": "P", "CO3_Li": "P", "CO3_K": "P", "CO3_Na": "P", "CO3_NH4": "P",
    "CO3_Ba": "H", "CO3_Ca": "H", "CO3_Mg": "H", "CO3_Al": "-", "CO3_Cr": "-",
    "CO3_Fe2": "H", "CO3_Fe3": "-", "CO3_Ni": "H", "CO3_Co": "H", "CO3_Mn": "H",
    "CO3_Zn": "H", "CO3_Ag": "H", "CO3_Hg": "-", "CO3_Rb": "H", "CO3_Sn": "H", "CO3_Cu": "H",
    
    // Silicate (SiO3 2-) solubility
    "SiO3_H": "H", "SiO3_Li": "P", "SiO3_K": "P", "SiO3_Na": "P", "SiO3_NH4": "-",
    "SiO3_Ba": "H", "SiO3_Ca": "H", "SiO3_Mg": "H", "SiO3_Al": "H", "SiO3_Cr": "-",
    "SiO3_Fe2": "H", "SiO3_Fe3": "H", "SiO3_Ni": "-", "SiO3_Co": "-", "SiO3_Mn": "H",
    "SiO3_Zn": "H", "SiO3_Ag": "-", "SiO3_Hg": "-", "SiO3_Rb": "H", "SiO3_Sn": "-", "SiO3_Cu": "H",
    
    // Nitrate (NO3-) solubility
    "NO3_H": "P", "NO3_Li": "P", "NO3_K": "P", "NO3_Na": "P", "NO3_NH4": "P",
    "NO3_Ba": "P", "NO3_Ca": "P", "NO3_Mg": "P", "NO3_Al": "P", "NO3_Cr": "P",
    "NO3_Fe2": "P", "NO3_Fe3": "P", "NO3_Ni": "P", "NO3_Co": "P", "NO3_Mn": "P",
    "NO3_Zn": "P", "NO3_Ag": "P", "NO3_Hg": "P", "NO3_Rb": "P", "NO3_Sn": "-", "NO3_Cu": "P",
    
    // Acetate (CH3COO-) solubility
    "CH3COO_H": "P", "CH3COO_Li": "P", "CH3COO_K": "P", "CH3COO_Na": "P", "CH3COO_NH4": "P",
    "CH3COO_Ba": "P", "CH3COO_Ca": "P", "CH3COO_Mg": "P", "CH3COO_Al": "M", "CH3COO_Cr": "P",
    "CH3COO_Fe2": "P", "CH3COO_Fe3": "P", "CH3COO_Ni": "P", "CH3COO_Co": "P", "CH3COO_Mn": "P",
    "CH3COO_Zn": "P", "CH3COO_Ag": "P", "CH3COO_Hg": "P", "CH3COO_Rb": "P", "CH3COO_Sn": "P", "CH3COO_Cu": "P"
  };