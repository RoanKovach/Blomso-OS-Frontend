import { UploadFile, InvokeLLM } from "@/api/integrations";
import { processAndSaveSoilTests } from "@/api/functions";
import { buildSafeExtractionSchema, buildExtractionPrompt } from "../utils/vertexAISchemaBuilder";
import { normalizeDate } from "../utils/dateUtils";
import { handleApiError } from '../utils/apiErrorUtils';
import { 
  validateApiResponse, 
  createApiError,
  UploadResponseSchema,
  ExtractionResponseSchema,
  ProcessingResponseSchema
} from '../schemas/api';
import { validateSoilTest, cleanExtractedSoilTest } from '../schemas/soilTest';

/**
 * Enhanced service for handling file uploads with comprehensive validation
 */
export class ValidatedUploadService {
  /**
   * Uploads a file with response validation
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Validated upload response
   */
  static async startUpload(file) {
    try {
      const rawResponse = await UploadFile({ file });
      
      // Validate the API response
      const validation = validateApiResponse(rawResponse, 'upload');
      
      if (!validation.success) {
        console.warn('Upload response validation failed:', validation.error);
        // Continue with raw response but log the validation issue
      }

      const response = validation.success ? validation.data : rawResponse;
      
      // Add computed fields
      return {
        ...response,
        job_id: response.job_id || `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file_name: response.file_name || file.name,
        file_size: response.file_size || file.size,
        upload_date: response.upload_date || new Date().toISOString()
      };
    } catch (error) {
      const apiError = createApiError({
        error: `Failed to upload file: ${error.message}`,
        type: 'upload_error',
        details: { fileName: file.name, fileSize: file.size }
      });
      throw new Error(handleApiError(apiError));
    }
  }

  /**
   * Extracts soil test data with validation
   * @param {string} file_url - URL of the uploaded file
   * @param {Object} contextData - Field context data
   * @returns {Promise<Object>} Validated extraction result
   */
  static async extractSoilData(file_url, contextData) {
    try {
      const extractionPrompt = buildExtractionPrompt(contextData);
      const responseSchema = buildSafeExtractionSchema();

      const rawResult = await InvokeLLM({
        prompt: extractionPrompt,
        file_urls: [file_url],
        response_json_schema: responseSchema
      });

      // Validate the extraction response structure
      const validation = validateApiResponse(rawResult, 'extraction');
      
      if (!validation.success) {
        console.warn('Extraction response validation failed:', validation.error);
      }

      const extractResult = validation.success ? validation.data : rawResult;

      if (!extractResult || !extractResult.soil_tests || extractResult.soil_tests.length === 0) {
        throw new Error("No soil test zones could be extracted from the document. Please ensure the file contains clear soil test data.");
      }

      // Validate and clean each extracted soil test
      extractResult.soil_tests = extractResult.soil_tests.map(test => {
        return cleanExtractedSoilTest(test);
      });

      return extractResult;
    } catch (error) {
      const apiError = createApiError({
        error: error.message.includes('VertexAI') || error.message.includes('Schema') 
          ? 'AI extraction failed. Please ensure your document is a clear, readable soil test report and try again.'
          : `Extraction failed: ${error.message}`,
        type: 'extraction_error',
        details: { file_url, contextData: contextData.field_name }
      });
      throw new Error(handleApiError(apiError));
    }
  }

  /**
   * Processes and validates extracted soil test data
   * @param {Object} extractResult - Raw extraction result
   * @param {string} file_url - Original file URL
   * @param {Object} contextData - Field context data
   * @returns {Array} Validated test records
   */
  static processExtractedData(extractResult, file_url, contextData) {
    const processedTests = extractResult.soil_tests.map((test, index) => {
      // Create the processed test object
      const processedTest = {
        ...test,
        soil_data: test.soil_data || {},
        tempId: index,
        raw_file_url: file_url,
        // Add context data
        field_name: contextData.field_name,
        field_size_acres: contextData.field_size_acres,
        crop_type: contextData.intended_crop,
        farming_method: contextData.farming_method,
        previous_crop_history: contextData.previous_crop_history,
        soil_type: contextData.soil_type,
        irrigation_type: contextData.irrigation_type,
        location: contextData.location,
        lab_info: extractResult.lab_info,
        // Normalize required fields
        test_date: normalizeDate(test.test_date),
        zone_name: test.zone_name || `Zone ${index + 1}`
      };

      // Validate the processed test
      const validation = validateSoilTest(processedTest, 'create');
      
      if (!validation.success) {
        console.warn(`Soil test validation failed for index ${index}:`, validation.error);
        // Continue with the data but log validation issues
      }

      return validation.success ? validation.data : processedTest;
    });

    return processedTests;
  }

  /**
   * Saves processed soil tests with response validation
   * @param {Array} tests - Processed test records
   * @param {boolean} isDemoUser - Whether user is in demo mode
   * @returns {Promise<Object>} Validated save result
   */
  static async saveProcessedTests(tests, isDemoUser = false) {
    try {
      // Validate each test before sending to API
      const validatedTests = tests.map(test => {
        const validation = validateSoilTest(test, 'create');
        if (!validation.success) {
          console.warn('Test validation failed before save:', validation.error);
        }
        return validation.success ? validation.data : test;
      });

      const rawResponse = await processAndSaveSoilTests({
        tests: validatedTests,
        isDemoUser
      });

      // Validate the processing response
      const validation = validateApiResponse(rawResponse.data, 'processing');
      
      if (!validation.success) {
        console.warn('Processing response validation failed:', validation.error);
      }

      const response = validation.success ? validation.data : rawResponse.data;

      if (!response.success) {
        throw new Error(response.error || 'Failed to save soil test data');
      }

      return response;
    } catch (error) {
      const apiError = createApiError({
        error: `Failed to save soil tests: ${error.message}`,
        type: 'save_error',
        details: { testCount: tests.length, isDemoUser }
      });
      throw new Error(handleApiError(apiError));
    }
  }

  /**
   * Complete upload and processing flow with validation at each step
   * @param {File} file - File to process
   * @param {Object} contextData - Field context
   * @param {boolean} isDemoUser - Demo mode flag
   * @returns {AsyncGenerator} Progress updates with validation
   */
  static async* processFile(file, contextData, isDemoUser = false) {
    try {
      // Step 1: Upload file
      yield { progress: 10, currentStep: 'Uploading file...', status: 'processing' };
      
      const uploadResult = await this.startUpload(file);
      
      yield { progress: 30, currentStep: 'File uploaded successfully', status: 'processing' };

      // Step 2: Extract data
      yield { progress: 40, currentStep: 'Extracting soil test data...', status: 'processing' };
      
      const extractResult = await this.extractSoilData(uploadResult.file_url, contextData);
      
      yield { progress: 70, currentStep: 'Data extraction complete', status: 'processing' };

      // Step 3: Process data
      yield { progress: 80, currentStep: 'Processing extracted data...', status: 'processing' };
      
      const processedTests = this.processExtractedData(extractResult, uploadResult.file_url, contextData);
      
      yield { progress: 90, currentStep: 'Saving soil test records...', status: 'processing' };

      // Step 4: Save to database
      const saveResult = await this.saveProcessedTests(processedTests, isDemoUser);

      // Complete
      yield {
        progress: 100,
        currentStep: 'Processing complete!',
        status: 'complete',
        result: {
          tests: processedTests,
          saved: saveResult.data || [],
          count: saveResult.inserted || processedTests.length
        }
      };

    } catch (error) {
      yield {
        progress: 0,
        currentStep: 'Processing failed',
        status: 'failed',
        error: error.message
      };
    }
  }
}

// Export the original UploadService for backward compatibility
export { ValidatedUploadService as UploadService };