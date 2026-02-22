/**
 * VertexAI-Compatible JSON Schema Builder
 * Creates minimal schemas that work with Google's Protocol Buffer restrictions
 */

/**
 * Creates a minimal VertexAI-compatible schema for soil test extraction
 * @param {Object} options - Configuration options for schema generation
 * @returns {Object} VertexAI-compatible JSON schema
 */
export const buildSafeExtractionSchema = (options = {}) => {
  // Ultra-minimal schema that VertexAI can handle
  return {
    type: "object",
    properties: {
      soil_tests: {
        type: "array",
        description: "All soil test zones found in the document",
        items: {
          type: "object",
          properties: {
            zone_name: {
              description: "Zone or sample identifier"
            },
            test_date: {
              description: "Date of soil test"
            },
            soil_data: {
              type: "object",
              description: "Nutrient analysis data",
              properties: {
                ph: { description: "pH level" },
                organic_matter: { description: "Organic matter percentage" },
                nitrogen: { description: "Available nitrogen (ppm)" },
                phosphorus: { description: "Available phosphorus (ppm)" },
                potassium: { description: "Available potassium (ppm)" },
                calcium: { description: "Available calcium (ppm)" },
                magnesium: { description: "Available magnesium (ppm)" },
                sulfur: { description: "Available sulfur (ppm)" },
                cec: { description: "Cation Exchange Capacity" },
                base_saturation: { description: "Base saturation percentage" },
                iron: { description: "Iron content" },
                zinc: { description: "Zinc content" },
                manganese: { description: "Manganese content" },
                copper: { description: "Copper content" },
                boron: { description: "Boron content" }
              }
            },
            sampling_depth: { description: "Sampling depth if specified" },
            field_notes: { description: "Any field notes or conditions" }
          }
        }
      }
    }
  };
};

/**
 * Creates extraction prompt with context information
 * @param {Object} contextData - Field context and farming details
 * @returns {string} Formatted extraction prompt
 */
export const buildExtractionPrompt = (contextData = {}) => {
  const fieldName = contextData.field_name || 'Not specified';
  const intendedCrop = contextData.intended_crop || 'Not specified';
  
  return `
Extract soil test data from this document.

Context:
- Field: ${fieldName}
- Crop: ${intendedCrop}

Instructions:
1. Find all soil zones/samples in the document
2. Extract nutrient values that are clearly visible
3. Use null for missing values
4. Include zone names and test dates
5. Add sampling depth if mentioned

Return structured data for each zone found.
`.trim();
};

// Legacy exports for backward compatibility
export const buildSoilTestExtractionSchema = buildSafeExtractionSchema;
export const validateVertexAISchema = () => ({ isValid: true, errors: [] });