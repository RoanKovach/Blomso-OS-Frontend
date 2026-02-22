import { z } from 'zod';

/**
 * Schema for file upload response
 */
export const UploadResponseSchema = z.object({
  file_url: z.string().url('Must be a valid URL'),
  job_id: z.string().optional(),
  file_name: z.string().optional(),
  file_size: z.number().min(0).optional(),
  upload_date: z.string().datetime().optional()
});

/**
 * Schema for LLM extraction response
 */
export const ExtractionResponseSchema = z.object({
  status: z.enum(['success', 'failed']),
  soil_tests: z.array(z.object({
    zone_name: z.string().optional(),
    test_date: z.string().optional(),
    soil_data: z.record(z.union([z.number(), z.null()])).optional(),
    lab_info: z.object({
      lab_name: z.string().optional(),
      sample_id: z.string().optional()
    }).optional()
  })).optional(),
  lab_info: z.object({
    lab_name: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional()
  }).optional(),
  error: z.string().optional(),
  processing_time: z.number().optional()
});

/**
 * Schema for soil test processing response
 */
export const ProcessingResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()).optional(),
  inserted: z.number().min(0).optional(),
  message: z.string().optional(),
  isDemo: z.boolean().optional(),
  error: z.string().optional(),
  details: z.record(z.any()).optional(),
  type: z.enum(['validation_error', 'database_error', 'internal_error']).optional()
});

/**
 * Schema for field management response
 */
export const FieldResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

/**
 * Schema for generic API error response
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.record(z.any()).optional(),
  type: z.string().optional(),
  code: z.number().optional(),
  timestamp: z.string().datetime().optional()
});

/**
 * Schema for progress updates
 */
export const ProgressUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'complete', 'failed']),
  progress: z.number().min(0).max(100),
  currentStep: z.string().optional(),
  result: z.any().optional(),
  error: z.string().optional()
});

/**
 * Generic success response schema
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  message: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

/**
 * JSDoc type definitions
 */

/**
 * @typedef {Object} UploadResponse
 * @property {string} file_url - URL of the uploaded file
 * @property {string} [job_id] - Job identifier for tracking
 * @property {string} [file_name] - Original file name
 * @property {number} [file_size] - File size in bytes
 * @property {string} [upload_date] - Upload timestamp
 */

/**
 * @typedef {Object} ExtractionResponse
 * @property {string} status - Extraction status
 * @property {Array} [soil_tests] - Extracted soil test data
 * @property {Object} [lab_info] - Laboratory information
 * @property {string} [error] - Error message if failed
 * @property {number} [processing_time] - Processing duration
 */

/**
 * @typedef {Object} ProcessingResponse
 * @property {boolean} success - Success flag
 * @property {Array} [data] - Processed data
 * @property {number} [inserted] - Number of records created
 * @property {string} [message] - Response message
 * @property {boolean} [isDemo] - Demo mode flag
 * @property {string} [error] - Error message
 * @property {Object} [details] - Additional error details
 * @property {string} [type] - Error type
 */

/**
 * Validates API response data
 * @param {any} data - Response data to validate
 * @param {string} schemaType - Type of schema to use for validation
 * @returns {{success: boolean, data?: any, error?: Object}}
 */
export const validateApiResponse = (data, schemaType) => {
  const schemas = {
    upload: UploadResponseSchema,
    extraction: ExtractionResponseSchema,
    processing: ProcessingResponseSchema,
    field: FieldResponseSchema,
    error: ApiErrorSchema,
    progress: ProgressUpdateSchema,
    success: SuccessResponseSchema
  };

  const schema = schemas[schemaType];
  if (!schema) {
    return {
      success: false,
      error: {
        message: `Unknown schema type: ${schemaType}`,
        details: { schemaType }
      }
    };
  }

  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    error: {
      message: `API response validation failed for ${schemaType}`,
      details: result.error.issues.reduce((acc, issue) => {
        const path = issue.path.join('.');
        acc[path] = issue.message;
        return acc;
      }, {})
    }
  };
};

/**
 * Creates a validated API error from any error input
 * @param {any} error - Error to validate and normalize
 * @returns {Object} Validated error object
 */
export const createApiError = (error) => {
  const errorData = {
    error: typeof error === 'string' ? error : error?.message || 'Unknown error',
    details: error?.details || {},
    type: error?.type || 'unknown',
    timestamp: new Date().toISOString()
  };

  const validation = validateApiResponse(errorData, 'error');
  return validation.success ? validation.data : errorData;
};