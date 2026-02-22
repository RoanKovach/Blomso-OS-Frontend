/**
 * Soil Test Data Validation and Shaping Utility
 * Ensures frontend data matches backend schema before API calls
 */

// Backend schema requirements based on SoilTest entity
const SOIL_TEST_SCHEMA = {
  required: ['field_name', 'test_date'],
  fields: {
    field_name: { type: 'string', minLength: 1, maxLength: 100 },
    zone_name: { type: 'string', minLength: 1, maxLength: 100 },
    test_date: { type: 'string', format: 'date' },
    field_size_acres: { type: 'number', min: 0.01, max: 10000 },
    crop_type: { type: 'string', maxLength: 50 },
    farming_method: { type: 'string', maxLength: 50 },
    soil_type: { type: 'string', maxLength: 100 },
    irrigation_type: { type: 'string', maxLength: 50 },
    location: {
      type: 'object',
      properties: {
        latitude: { type: 'number', min: -90, max: 90 },
        longitude: { type: 'number', min: -180, max: 180 },
        address: { type: 'string', maxLength: 200 }
      }
    },
    soil_data: {
      type: 'object',
      properties: {
        ph: { type: 'number', min: 3.0, max: 12.0 },
        organic_matter: { type: 'number', min: 0, max: 100 },
        nitrogen: { type: 'number', min: 0, max: 10000 },
        phosphorus: { type: 'number', min: 0, max: 10000 },
        potassium: { type: 'number', min: 0, max: 10000 },
        calcium: { type: 'number', min: 0, max: 10000 },
        magnesium: { type: 'number', min: 0, max: 10000 },
        sulfur: { type: 'number', min: 0, max: 10000 },
        cec: { type: 'number', min: 0, max: 100 },
        base_saturation: { type: 'number', min: 0, max: 100 },
        iron: { type: 'number', min: 0, max: 1000 },
        zinc: { type: 'number', min: 0, max: 1000 },
        manganese: { type: 'number', min: 0, max: 1000 },
        copper: { type: 'number', min: 0, max: 1000 },
        boron: { type: 'number', min: 0, max: 100 }
      }
    }
  }
};

/**
 * Validates a single field value against schema requirements
 */
export const validateField = (fieldName, value, schema = SOIL_TEST_SCHEMA) => {
  const errors = [];
  
  // Handle nested field paths like 'soil_data.ph'
  const fieldPath = fieldName.split('.');
  let fieldSchema = schema.fields;
  
  for (const pathPart of fieldPath) {
    if (fieldSchema[pathPart]) {
      fieldSchema = fieldSchema[pathPart];
    } else if (fieldSchema.properties && fieldSchema.properties[pathPart]) {
      fieldSchema = fieldSchema.properties[pathPart];
    } else {
      // Field not found in schema - this is okay for optional fields
      return [];
    }
  }
  
  // Required field check
  if (schema.required.includes(fieldPath[0]) && (value === null || value === undefined || value === '')) {
    errors.push(`${fieldName} is required`);
    return errors;
  }
  
  // Skip validation for null/undefined optional fields
  if (value === null || value === undefined || value === '') {
    return errors;
  }
  
  // Type validation
  if (fieldSchema.type === 'string' && typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
  } else if (fieldSchema.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
    errors.push(`${fieldName} must be a valid number`);
  }
  
  // String length validation
  if (fieldSchema.type === 'string' && typeof value === 'string') {
    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
      errors.push(`${fieldName} must be at least ${fieldSchema.minLength} characters`);
    }
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors.push(`${fieldName} must not exceed ${fieldSchema.maxLength} characters`);
    }
  }
  
  // Number range validation
  if (fieldSchema.type === 'number' && typeof value === 'number') {
    if (fieldSchema.min !== undefined && value < fieldSchema.min) {
      errors.push(`${fieldName} must be at least ${fieldSchema.min}`);
    }
    if (fieldSchema.max !== undefined && value > fieldSchema.max) {
      errors.push(`${fieldName} must not exceed ${fieldSchema.max}`);
    }
  }
  
  // Date format validation
  if (fieldSchema.format === 'date' && typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      errors.push(`${fieldName} must be in YYYY-MM-DD format`);
    } else {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push(`${fieldName} must be a valid date`);
      }
    }
  }
  
  return errors;
};

/**
 * Validates an entire soil test object
 */
export const validateSoilTest = (soilTest) => {
  const errors = {};
  const allErrors = [];
  
  // Validate required fields first
  for (const requiredField of SOIL_TEST_SCHEMA.required) {
    const fieldErrors = validateField(requiredField, soilTest[requiredField]);
    if (fieldErrors.length > 0) {
      errors[requiredField] = fieldErrors;
      allErrors.push(...fieldErrors);
    }
  }
  
  // Validate all present fields
  const validateObject = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively validate nested objects
        validateObject(value, fieldPath);
      } else {
        const fieldErrors = validateField(fieldPath, value);
        if (fieldErrors.length > 0) {
          errors[fieldPath] = fieldErrors;
          allErrors.push(...fieldErrors);
        }
      }
    }
  };
  
  validateObject(soilTest);
  
  return {
    isValid: allErrors.length === 0,
    errors,
    allErrors
  };
};

/**
 * Shapes soil test data to match backend API expectations
 * Removes undefined fields, converts types, ensures proper structure
 */
export const shapeSoilTestPayload = (rawData) => {
  const shaped = {};
  
  // Required fields
  if (rawData.field_name) shaped.field_name = String(rawData.field_name).trim();
  if (rawData.test_date) shaped.test_date = String(rawData.test_date);
  
  // Optional string fields
  const stringFields = ['zone_name', 'crop_type', 'farming_method', 'soil_type', 'irrigation_type', 'previous_crop_history'];
  stringFields.forEach(field => {
    if (rawData[field] && String(rawData[field]).trim()) {
      shaped[field] = String(rawData[field]).trim();
    }
  });
  
  // Optional numeric fields
  if (rawData.field_size_acres && !isNaN(Number(rawData.field_size_acres))) {
    shaped.field_size_acres = Number(rawData.field_size_acres);
  }
  
  // Location object
  if (rawData.location) {
    const location = {};
    if (rawData.location.address && String(rawData.location.address).trim()) {
      location.address = String(rawData.location.address).trim();
    }
    if (rawData.location.latitude && !isNaN(Number(rawData.location.latitude))) {
      location.latitude = Number(rawData.location.latitude);
    }
    if (rawData.location.longitude && !isNaN(Number(rawData.location.longitude))) {
      location.longitude = Number(rawData.location.longitude);
    }
    if (Object.keys(location).length > 0) {
      shaped.location = location;
    }
  }
  
  // Soil data object
  if (rawData.soil_data) {
    const soilData = {};
    const nutrientFields = ['ph', 'organic_matter', 'nitrogen', 'phosphorus', 'potassium', 
                           'calcium', 'magnesium', 'sulfur', 'cec', 'base_saturation',
                           'iron', 'zinc', 'manganese', 'copper', 'boron'];
    
    nutrientFields.forEach(field => {
      if (rawData.soil_data[field] !== null && rawData.soil_data[field] !== undefined && 
          rawData.soil_data[field] !== '' && !isNaN(Number(rawData.soil_data[field]))) {
        soilData[field] = Number(rawData.soil_data[field]);
      }
    });
    
    if (Object.keys(soilData).length > 0) {
      shaped.soil_data = soilData;
    }
  }
  
  // Additional fields that might be present
  const additionalFields = ['raw_file_url', 'analysis_status', 'is_demo_data', 'expires_at'];
  additionalFields.forEach(field => {
    if (rawData[field] !== undefined) {
      shaped[field] = rawData[field];
    }
  });
  
  return shaped;
};

/**
 * Parses 422 validation errors from backend response
 */
export const parse422Errors = (error) => {
  const fieldErrors = {};
  
  try {
    if (error.response && error.response.data && error.response.data.detail) {
      const details = Array.isArray(error.response.data.detail) 
        ? error.response.data.detail 
        : [error.response.data.detail];
      
      details.forEach(detail => {
        if (detail.loc && detail.msg) {
          const fieldPath = detail.loc.join('.');
          if (!fieldErrors[fieldPath]) {
            fieldErrors[fieldPath] = [];
          }
          fieldErrors[fieldPath].push(detail.msg);
        }
      });
    }
  } catch (parseError) {
    console.error('Error parsing 422 response:', parseError);
  }
  
  return fieldErrors;
};

/**
 * Example of a valid soil test payload
 */
export const EXAMPLE_VALID_PAYLOAD = {
  field_name: "North Field A",
  zone_name: "Zone 1",
  test_date: "2024-01-15",
  field_size_acres: 120.5,
  crop_type: "Corn",
  farming_method: "No-Till",
  soil_type: "Clay Loam",
  location: {
    address: "Farm Road 123, Iowa",
    latitude: 41.8781,
    longitude: -93.0977
  },
  soil_data: {
    ph: 6.8,
    organic_matter: 3.2,
    phosphorus: 45,
    potassium: 280,
    calcium: 1850,
    magnesium: 340
  },
  analysis_status: "complete"
};