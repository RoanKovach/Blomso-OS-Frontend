import { z } from 'zod';

/**
 * Zod schema for soil data measurements
 */
const SoilDataSchema = z.object({
  ph: z.number().min(3.0).max(12.0).optional(),
  organic_matter: z.number().min(0).max(100).optional(),
  nitrogen: z.number().min(0).max(10000).optional(),
  phosphorus: z.number().min(0).max(10000).optional(),
  potassium: z.number().min(0).max(10000).optional(),
  calcium: z.number().min(0).max(10000).optional(),
  magnesium: z.number().min(0).max(10000).optional(),
  sulfur: z.number().min(0).max(10000).optional(),
  cec: z.number().min(0).max(100).optional(),
  base_saturation: z.number().min(0).max(100).optional(),
  iron: z.number().min(0).max(1000).optional(),
  zinc: z.number().min(0).max(1000).optional(),
  manganese: z.number().min(0).max(1000).optional(),
  copper: z.number().min(0).max(1000).optional(),
  boron: z.number().min(0).max(100).optional()
});

/**
 * Zod schema for management practices
 */
const ManagementPracticesSchema = z.object({
  limestone_recommendation: z.string().optional(),
  limestone_rate_lbs_per_acre: z.number().min(0).optional(),
  nitrogen_rate_lbs_per_acre: z.number().min(0).optional(),
  phosphate_rate_lbs_per_acre: z.number().min(0).optional(),
  potash_rate_lbs_per_acre: z.number().min(0).optional(),
  starter_fertilizer_recommendation: z.string().optional(),
  application_timing: z.string().optional(),
  special_notes: z.string().optional()
});

/**
 * Zod schema for product recommendations
 */
const ProductRecommendationSchema = z.object({
  product_name: z.string(),
  rate_per_acre: z.number().min(0),
  unit: z.string(),
  timing: z.string().optional(),
  cost_per_acre: z.number().min(0).optional(),
  purpose: z.string().optional(),
  method: z.string().optional()
});

/**
 * Zod schema for yield impact analysis
 */
const YieldImpactSchema = z.object({
  current_potential: z.number().min(0).optional(),
  optimized_potential: z.number().min(0).optional(),
  limiting_factors: z.array(z.string()).optional()
});

/**
 * Zod schema for geographic location
 */
const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(200).optional()
});

/**
 * Main SoilTest schema
 */
export const SoilTestSchema = z.object({
  id: z.string().optional(),
  field_id: z.string().optional(),
  field_name: z.string().min(1, 'Field name is required').max(100),
  zone_name: z.string().max(100).optional(),
  test_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Test date must be in YYYY-MM-DD format'),
  analysis_status: z.enum(['pending', 'complete']).default('pending'),
  geometry: z.object({
    type: z.string(),
    coordinates: z.array(z.any())
  }).optional(),
  location: LocationSchema.optional(),
  soil_data: SoilDataSchema.optional(),
  management_practices: ManagementPracticesSchema.optional(),
  soil_health_index: z.number().min(0).max(100).optional(),
  biological_score: z.number().min(0).max(100).optional(),
  crop_type: z.string().max(50).optional(),
  previous_crop_history: z.string().optional(),
  field_size_acres: z.number().min(0.01).max(10000).optional(),
  farming_method: z.string().max(50).optional(),
  soil_type: z.string().max(100).optional(),
  irrigation_type: z.string().max(50).optional(),
  raw_file_url: z.string().url().optional(),
  nutrient_status: z.record(z.string()).optional(),
  product_recommendations: z.array(ProductRecommendationSchema).optional(),
  yield_impact: YieldImpactSchema.optional(),
  summary: z.string().optional(),
  cash_indicators: z.record(z.any()).optional(),
  recommendation_pathways: z.record(z.any()).optional(),
  is_demo_data: z.boolean().default(false),
  expires_at: z.string().datetime().optional(),
  created_date: z.string().datetime().optional(),
  updated_date: z.string().datetime().optional(),
  created_by: z.string().email().optional()
});

/**
 * Schema for creating a new soil test
 */
export const CreateSoilTestSchema = SoilTestSchema.omit({
  id: true,
  created_date: true,
  updated_date: true,
  created_by: true
});

/**
 * Schema for updating a soil test
 */
export const UpdateSoilTestSchema = SoilTestSchema.partial().refine(
  (data) => {
    // At least one field must be provided for update
    return Object.keys(data).length > 0;
  },
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Schema for soil test extraction from LLM
 */
export const ExtractedSoilTestSchema = z.object({
  zone_name: z.string().optional(),
  test_date: z.string().optional(),
  soil_data: SoilDataSchema.optional(),
  lab_info: z.object({
    lab_name: z.string().optional(),
    sample_id: z.string().optional()
  }).optional()
});

/**
 * JSDoc type definitions for JavaScript usage
 */

/**
 * @typedef {Object} SoilTest
 * @property {string} [id] - Unique test identifier
 * @property {string} [field_id] - Associated field ID
 * @property {string} field_name - Name of the tested field
 * @property {string} [zone_name] - Zone or sample identifier
 * @property {string} test_date - Test date in YYYY-MM-DD format
 * @property {string} [analysis_status] - Analysis completion status
 * @property {Object} [geometry] - GeoJSON geometry
 * @property {Object} [location] - Geographic location
 * @property {Object} [soil_data] - Soil nutrient measurements
 * @property {Object} [management_practices] - Management recommendations
 * @property {number} [soil_health_index] - Overall health score
 * @property {number} [biological_score] - Biological activity score
 * @property {string} [crop_type] - Intended crop
 * @property {string} [previous_crop_history] - Previous crops
 * @property {number} [field_size_acres] - Field size in acres
 * @property {string} [farming_method] - Farming approach
 * @property {string} [soil_type] - Soil classification
 * @property {string} [irrigation_type] - Irrigation method
 * @property {string} [raw_file_url] - Original file URL
 * @property {Object} [nutrient_status] - Nutrient adequacy status
 * @property {Array} [product_recommendations] - Recommended products
 * @property {Object} [yield_impact] - Yield potential analysis
 * @property {string} [summary] - AI-generated summary
 * @property {Object} [cash_indicators] - CASH framework scores
 * @property {Object} [recommendation_pathways] - Alternative strategies
 * @property {boolean} [is_demo_data] - Demo data flag
 * @property {string} [expires_at] - Expiration timestamp
 * @property {string} [created_date] - Creation timestamp
 * @property {string} [updated_date] - Last update timestamp
 * @property {string} [created_by] - Creator email
 */

/**
 * Validates soil test data using the appropriate schema
 * @param {Object} data - Soil test data to validate
 * @param {'create' | 'update' | 'extracted' | 'full'} mode - Validation mode
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export const validateSoilTest = (data, mode = 'full') => {
  const schema = {
    create: CreateSoilTestSchema,
    update: UpdateSoilTestSchema,
    extracted: ExtractedSoilTestSchema,
    full: SoilTestSchema
  }[mode];

  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { 
    success: false, 
    error: {
      message: 'Soil test validation failed',
      details: result.error.issues.reduce((acc, issue) => {
        const path = issue.path.join('.');
        acc[path] = issue.message;
        return acc;
      }, {})
    }
  };
};

/**
 * Type guard to check if an object is a valid soil test
 * @param {any} obj - Object to check
 * @returns {boolean}
 */
export const isValidSoilTest = (obj) => {
  return SoilTestSchema.safeParse(obj).success;
};

/**
 * Validates extracted soil test data and cleans up invalid values
 * @param {Object} extractedData - Raw extracted data from LLM
 * @returns {Object} Cleaned and validated data
 */
export const cleanExtractedSoilTest = (extractedData) => {
  const validation = validateSoilTest(extractedData, 'extracted');
  
  if (!validation.success) {
    console.warn('Extracted soil test data validation failed:', validation.error);
    // Return cleaned data even if validation fails, but log the issues
  }
  
  // Clean up the soil_data by removing invalid values
  if (extractedData.soil_data) {
    const cleanedSoilData = {};
    Object.entries(extractedData.soil_data).forEach(([key, value]) => {
      // Remove -1 values, null, undefined, and invalid numbers
      if (value !== -1 && value !== null && value !== undefined && 
          typeof value === 'number' && !isNaN(value) && value >= 0) {
        cleanedSoilData[key] = value;
      }
    });
    extractedData.soil_data = cleanedSoilData;
  }
  
  return validation.success ? validation.data : extractedData;
};