import { z } from 'zod';

/**
 * Zod schema for GeoJSON geometry validation
 */
const GeometrySchema = z.object({
  type: z.enum(['Polygon', 'MultiPolygon'], {
    errorMap: () => ({ message: 'Geometry must be a Polygon or MultiPolygon' })
  }),
  coordinates: z.array(z.any()).min(1, 'Coordinates array cannot be empty')
});

/**
 * Zod schema for geographic location
 */
const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
}).optional();

/**
 * Zod schema for Field entity validation
 */
export const FieldSchema = z.object({
  id: z.string().optional(),
  field_name: z.string()
    .min(1, 'Field name is required')
    .max(100, 'Field name must be less than 100 characters')
    .trim(),
  farm_name: z.string()
    .max(100, 'Farm name must be less than 100 characters')
    .optional(),
  geometry: GeometrySchema,
  center_point: LocationSchema,
  acres: z.number()
    .min(0.01, 'Field area must be greater than 0.01 acres')
    .max(100000, 'Field area seems unreasonably large')
    .optional(),
  data_source: z.enum(['user_drawn', 'user_uploaded', 'clu_claimed', 'parcel_claimed'])
    .default('user_drawn'),
  external_ids: z.object({
    clu_id: z.string().optional(),
    parcel_id: z.string().optional(),
    fsa_id: z.string().optional()
  }).optional(),
  current_crop: z.string().max(50).optional(),
  last_data_update: z.string().datetime().optional(),
  auto_update_enabled: z.boolean().default(true),
  current_metrics: z.object({
    health_score: z.number().min(0).max(100).optional(),
    ndvi_mean: z.number().min(0).max(1).optional(),
    ndvi_date: z.string().date().optional(),
    et_total_season: z.number().min(0).optional(),
    et_last_30_days: z.number().min(0).optional(),
    soil_ph_avg: z.number().min(3).max(12).optional(),
    moisture_status: z.string().optional(),
    growth_stage: z.string().optional()
  }).optional(),
  alerts: z.array(z.object({
    type: z.string(),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    date: z.string().date()
  })).optional(),
  created_date: z.string().datetime().optional(),
  updated_date: z.string().datetime().optional(),
  created_by: z.string().email().optional()
});

/**
 * Schema for creating a new field (excludes auto-generated fields)
 */
export const CreateFieldSchema = FieldSchema.omit({
  id: true,
  created_date: true,
  updated_date: true,
  created_by: true,
  acres: true // Will be calculated
});

/**
 * Schema for updating a field (all fields optional except geometry validation)
 */
export const UpdateFieldSchema = FieldSchema.partial().refine(
  (data) => {
    // If geometry is provided, it must be valid
    if (data.geometry) {
      return GeometrySchema.safeParse(data.geometry).success;
    }
    return true;
  },
  {
    message: 'Invalid geometry provided for update',
    path: ['geometry']
  }
);

/**
 * Inferred TypeScript types from schemas
 * These can be imported and used throughout the application
 */
// Note: In a TypeScript environment, you would use z.infer<typeof FieldSchema>
// For now, we'll provide JSDoc types that approximate the TypeScript experience

/**
 * @typedef {Object} Field
 * @property {string} [id] - Unique field identifier
 * @property {string} field_name - Name of the field
 * @property {string} [farm_name] - Name of the farm
 * @property {Object} geometry - GeoJSON geometry object
 * @property {Object} [center_point] - Center coordinates
 * @property {number} [acres] - Field area in acres
 * @property {string} [data_source] - How the field was created
 * @property {Object} [external_ids] - External system references
 * @property {string} [current_crop] - Current crop being grown
 * @property {string} [last_data_update] - Last data refresh timestamp
 * @property {boolean} [auto_update_enabled] - Auto-update setting
 * @property {Object} [current_metrics] - Latest field metrics
 * @property {Array} [alerts] - Active field alerts
 * @property {string} [created_date] - Creation timestamp
 * @property {string} [updated_date] - Last update timestamp
 * @property {string} [created_by] - Creator email
 */

/**
 * @typedef {Object} CreateFieldInput
 * @property {string} field_name - Name of the field
 * @property {string} [farm_name] - Name of the farm
 * @property {Object} geometry - GeoJSON geometry object
 * @property {Object} [center_point] - Center coordinates
 * @property {string} [data_source] - How the field was created
 * @property {Object} [external_ids] - External system references
 * @property {string} [current_crop] - Current crop being grown
 * @property {boolean} [auto_update_enabled] - Auto-update setting
 */

/**
 * Validates field data using the appropriate schema
 * @param {Object} data - Field data to validate
 * @param {'create' | 'update' | 'full'} mode - Validation mode
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export const validateField = (data, mode = 'full') => {
  const schema = {
    create: CreateFieldSchema,
    update: UpdateFieldSchema,
    full: FieldSchema
  }[mode];

  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { 
    success: false, 
    error: {
      message: 'Field validation failed',
      details: result.error.issues.reduce((acc, issue) => {
        const path = issue.path.join('.');
        acc[path] = issue.message;
        return acc;
      }, {})
    }
  };
};

/**
 * Type guard to check if an object is a valid field
 * @param {any} obj - Object to check
 * @returns {boolean}
 */
export const isValidField = (obj) => {
  return FieldSchema.safeParse(obj).success;
};