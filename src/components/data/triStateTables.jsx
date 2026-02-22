export const triStateTables = {
  "version": "2020",
  "source": "Tri-State Fertilizer Recommendations for Corn, Soybeans, Wheat, and Alfalfa (Bulletin 974)",
  "scope": ["IN", "MI", "OH"],
  
  "ph_targets": {
    "field_crops": {
      "min": 6.0,
      "max": 6.8,
      "optimal": 6.4
    }
  },
  
  "critical_levels": {
    "mehlich3": {
      "corn": { "P_ppm": [20, 40], "K_sandy_ppm": [100, 130], "K_loam_clay_ppm": [120, 170] },
      "soybean": { "P_ppm": [20, 40], "K_sandy_ppm": [100, 130], "K_loam_clay_ppm": [120, 170] },
      "wheat": { "P_ppm": [30, 50], "K_sandy_ppm": [100, 130], "K_loam_clay_ppm": [120, 170] },
      "alfalfa": { "P_ppm": [30, 50], "K_sandy_ppm": [100, 130], "K_loam_clay_ppm": [120, 170] }
    }
  },
  
  "maintenance_rates": {
    "corn": {
      "150": { "P2O5": 55, "K2O_IN_OH": 50, "K2O_MI": 30 },
      "200": { "P2O5": 70, "K2O_IN_OH": 60, "K2O_MI": 40 },
      "250": { "P2O5": 90, "K2O_IN_OH": 70, "K2O_MI": 50 },
      "300": { "P2O5": 105, "K2O_IN_OH": 80, "K2O_MI": 60 }
    },
    "soybean": {
      "30": { "P2O5": 25, "K2O_IN_OH": 55, "K2O_MI": 35 },
      "50": { "P2O5": 40, "K2O_IN_OH": 80, "K2O_MI": 60 },
      "70": { "P2O5": 55, "K2O_IN_OH": 100, "K2O_MI": 80 },
      "90": { "P2O5": 70, "K2O_IN_OH": 125, "K2O_MI": 105 }
    },
    "wheat": {
      "60": { "P2O5": 30, "K2O_IN_OH": 35, "K2O_MI": 15 },
      "90": { "P2O5": 45, "K2O_IN_OH": 45, "K2O_MI": 25 },
      "120": { "P2O5": 60, "K2O_IN_OH": 50, "K2O_MI": 30 },
      "150": { "P2O5": 75, "K2O_IN_OH": 60, "K2O_MI": 40 }
    }
  },
  
  "wheat_nitrogen": {
    "60": { "total": 90, "fall": 30, "spring": 60 },
    "90": { "total": 120, "fall": 40, "spring": 80 },
    "120": { "total": 150, "fall": 50, "spring": 100 },
    "150": { "total": 180, "fall": 60, "spring": 120 }
  },
  
  "nutrient_removal": {
    "grain": {
      "corn": { "P2O5_per_bu": 0.35, "K2O_per_bu": 0.20 },
      "soybean": { "P2O5_per_bu": 0.80, "K2O_per_bu": 1.15 },
      "wheat": { "P2O5_per_bu": 0.50, "K2O_per_bu": 0.25 }
    },
    "forage": {
      "corn_silage": { "P2O5_per_ton": 3.1, "K2O_per_ton": 7.3 },
      "alfalfa": { "P2O5_per_ton": 12.0, "K2O_per_ton": 49 },
      "wheat_straw": { "P2O5_per_ton": 3.7, "K2O_per_ton": 29 }
    }
  },
  
  "lime_rates": {
    "IN_MI_mineral": {
      "pH_5.5": { "target_6.0": 2.0, "target_6.5": 3.0, "target_6.8": 3.5 },
      "pH_6.0": { "target_6.5": 1.0, "target_6.8": 1.5 },
      "pH_6.5": { "target_6.8": 0.5 }
    },
    "OH_mineral": {
      "pH_5.5": { "target_6.0": 2.5, "target_6.5": 3.5, "target_6.8": 4.0 },
      "pH_6.0": { "target_6.5": 1.5, "target_6.8": 2.0 },
      "pH_6.5": { "target_6.8": 1.0 }
    }
  },
  
  "build_up_rates": {
    "P_buildup_per_ppm": 10,
    "K_buildup_per_ppm": 5
  }
};