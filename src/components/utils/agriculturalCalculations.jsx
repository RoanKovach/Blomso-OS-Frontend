/**
 * agriculturalCalculations.js
 * 
 * Client-side implementation of Tri-State (IN/MI/OH) fertilizer recommendations
 * Based on 2020 Tri-State Fertilizer Recommendations Bulletin 974
 */

// Tri-State Critical Levels (Table 12-14 from Bulletin 974)
const CRITICAL_LEVELS = {
  corn: {
    P_ppm: [20, 40],
    K_sandy_ppm: [100, 130],
    K_loam_clay_ppm: [120, 170]
  },
  soybean: {
    P_ppm: [20, 40],
    K_sandy_ppm: [100, 130],
    K_loam_clay_ppm: [120, 170]
  },
  wheat: {
    P_ppm: [30, 50],
    K_sandy_ppm: [100, 130],
    K_loam_clay_ppm: [120, 170]
  },
  alfalfa: {
    P_ppm: [30, 50],
    K_sandy_ppm: [100, 130],
    K_loam_clay_ppm: [120, 170]
  }
};

// P2O5 Rate Tables (lbs/acre)
const P2O5_RATES = {
  corn: {
    deficient: { 180: 120, 200: 130, 220: 140 },
    optimal: { 180: 40, 200: 45, 220: 50 },
    sufficient: { 180: 0, 200: 0, 220: 0 }
  },
  soybean: {
    deficient: { 60: 80, 70: 90, 80: 100 },
    optimal: { 60: 30, 70: 35, 80: 40 },
    sufficient: { 60: 0, 70: 0, 80: 0 }
  },
  wheat: {
    deficient: { 70: 90, 80: 100, 90: 110 },
    optimal: { 70: 35, 80: 40, 90: 45 },
    sufficient: { 70: 0, 80: 0, 90: 0 }
  }
};

// K2O Rate Tables (lbs/acre)
const K2O_RATES = {
  corn: {
    deficient: { 180: 140, 200: 150, 220: 160 },
    optimal: { 180: 50, 200: 55, 220: 60 },
    sufficient: { 180: 0, 200: 0, 220: 0 }
  },
  soybean: {
    deficient: { 60: 100, 70: 110, 80: 120 },
    optimal: { 60: 40, 70: 45, 80: 50 },
    sufficient: { 60: 0, 70: 0, 80: 0 }
  },
  wheat: {
    deficient: { 70: 110, 80: 120, 90: 130 },
    optimal: { 70: 45, 80: 50, 90: 55 },
    sufficient: { 70: 0, 80: 0, 90: 0 }
  }
};

export const TriStateCalculations = {
  /**
   * Classifies P and K phases based on soil test values
   */
  classifyPKPhase(soilData, crop, cecClass) {
    const cropLower = crop?.toLowerCase() || 'corn';
    const levels = CRITICAL_LEVELS[cropLower] || CRITICAL_LEVELS.corn;
    
    // Determine K critical levels based on CEC class
    const kCritical = cecClass === '<5' ? levels.K_sandy_ppm : levels.K_loam_clay_ppm;
    
    // Classify phases
    const classifyPhase = (value, range) => {
      if (value < range[0]) return 'deficient';
      if (value <= range[1]) return 'optimal';
      return 'sufficient';
    };
    
    const P_phase = classifyPhase(soilData.phosphorus, levels.P_ppm);
    const K_phase = classifyPhase(soilData.potassium, kCritical);
    
    return {
      P_phase,
      K_phase,
      critP: levels.P_ppm,
      critK: kCritical,
      sources: [
        "Tri-State 2020: Tables 12-14 (Critical level & maintenance framework)",
        `Mehlich-3 extractant`,
        `CEC class: ${cecClass} meq/100g`
      ]
    };
  },

  /**
   * Calculates P2O5 rate based on crop, yield goal, and phase
   */
  calculatePhosphorusRate(crop, yieldGoal, phase) {
    const cropLower = crop?.toLowerCase() || 'corn';
    const rates = P2O5_RATES[cropLower] || P2O5_RATES.corn;
    const phaseRates = rates[phase] || rates.optimal;
    
    // Find closest yield goal in table
    const yieldGoals = Object.keys(phaseRates).map(Number).sort((a, b) => a - b);
    const closestYield = yieldGoals.reduce((prev, curr) => 
      Math.abs(curr - yieldGoal) < Math.abs(prev - yieldGoal) ? curr : prev
    );
    
    const p2o5_lb_ac = phaseRates[closestYield] || 0;
    
    return {
      p2o5_lb_ac,
      phase,
      yieldGoal: closestYield,
      sources: ["Tri-State 2020: P rate tables"]
    };
  },

  /**
   * Calculates K2O rate based on crop, yield goal, phase, and CEC class
   */
  calculatePotassiumRate(crop, yieldGoal, phase, cecClass, state = 'OH') {
    const cropLower = crop?.toLowerCase() || 'corn';
    const rates = K2O_RATES[cropLower] || K2O_RATES.corn;
    const phaseRates = rates[phase] || rates.optimal;
    
    // Find closest yield goal in table
    const yieldGoals = Object.keys(phaseRates).map(Number).sort((a, b) => a - b);
    const closestYield = yieldGoals.reduce((prev, curr) => 
      Math.abs(curr - yieldGoal) < Math.abs(prev - yieldGoal) ? curr : prev
    );
    
    const k2o_lb_ac = phaseRates[closestYield] || 0;
    
    return {
      k2o_lb_ac,
      phase,
      yieldGoal: closestYield,
      cecClass,
      sources: ["Tri-State 2020: K rate tables"]
    };
  },

  /**
   * Simple lime calculation
   */
  calculateLimeRequirement(currentpH, targetpH = 6.5, cec = 15) {
    if (currentpH >= targetpH) return 0;
    const limeRequirement = (targetpH - currentpH) * (cec / 5);
    return parseFloat(limeRequirement.toFixed(1));
  }
};

export const MRTNCalculator = {
  /**
   * Simplified MRTN calculator for client-side use
   */
  calculateNitrogenRate(soilNitrate_ppm = 20, yieldGoal_bu_per_acre = 180, cornPrice_per_bu = 4.50, nitrogenPrice_per_lb = 0.50) {
    const priceRatio = nitrogenPrice_per_lb / cornPrice_per_bu;
    
    let baseRate;
    if (priceRatio < 0.05) baseRate = 180;
    else if (priceRatio < 0.10) baseRate = 165;
    else if (priceRatio < 0.15) baseRate = 150;
    else if (priceRatio < 0.20) baseRate = 135;
    else baseRate = 120;

    const nitrateCredit = soilNitrate_ppm * 8;
    const finalRate = baseRate - nitrateCredit;

    return Math.max(0, Math.round(finalRate));
  }
};

export const SoilTestConverter = {
  convertPhosphorus(value, fromMethod, toMethod) {
    if (fromMethod === 'bray1' && toMethod === 'mehlich3') {
      return parseFloat((value * 1.35).toFixed(1));
    }
    if (fromMethod === 'mehlich3' && toMethod === 'bray1') {
      return parseFloat((value / 1.35).toFixed(1));
    }
    return value;
  }
};

// Enhanced function for Tilly integration
export const performTriStateCalculations = async (soilData, managementData) => {
  const results = {};
  
  try {
    // Determine CEC class from CEC value
    const cecClass = (soilData.cec && soilData.cec < 5) ? '<5' : '>=5';
    const crop = managementData.crop || 'corn';
    const yieldGoal = managementData.yieldGoal || 180;
    const state = managementData.state || 'OH';
    
    // Step 1: Classify P&K phases
    if (soilData.phosphorus !== undefined && soilData.potassium !== undefined) {
      const phaseResult = TriStateCalculations.classifyPKPhase(soilData, crop, cecClass);
      results.phase_classification = phaseResult;
      
      // Step 2: Calculate P rate
      const pRateResult = TriStateCalculations.calculatePhosphorusRate(crop, yieldGoal, phaseResult.P_phase);
      results.phosphorus_recommendation = pRateResult;
      
      // Step 3: Calculate K rate  
      const kRateResult = TriStateCalculations.calculatePotassiumRate(crop, yieldGoal, phaseResult.K_phase, cecClass, state);
      results.potassium_recommendation = kRateResult;
    }
    
    // Step 4: Add lime calculation if pH data available
    if (soilData.ph !== undefined) {
      const limeRate = TriStateCalculations.calculateLimeRequirement(soilData.ph, 6.5, soilData.cec || 15);
      results.lime_recommendation = {
        tons_per_acre: limeRate,
        reason: soilData.ph < 6.0 ? 'pH below optimal range' : 'pH in acceptable range',
        sources: ["Tri-State 2020: Lime recommendations"]
      };
    }
    
    return results;
    
  } catch (error) {
    console.error('Error in Tri-State calculations:', error);
    return {
      error: error.message,
      message: 'Unable to complete all calculations. Please verify input data.'
    };
  }
};