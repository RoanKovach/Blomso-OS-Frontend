import { base44 } from '@/api/base44Client';
import { buildSafeExtractionSchema, buildExtractionPrompt } from '../utils/vertexAISchemaBuilder';
import { format } from 'date-fns';

/**
 * Service for handling file uploads and soil test extraction
 * Uses async generator pattern for progress tracking
 */
export class UploadService {
  /**
   * Process a file and extract soil test data
   * @param {File} file - The PDF file to process
   * @param {Object} contextData - Field context information
   * @param {boolean} isDemoUser - Whether this is a demo/anonymous user
   * @yields {Object} Progress updates with status, progress percentage, and current step
   */
  static async *processFile(file, contextData, isDemoUser = false) {
    try {
      // Step 1: Upload file (10% progress)
      yield {
        status: 'processing',
        progress: 10,
        currentStep: 'Uploading file to server...'
      };

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Step 2: Extract data using AI (30% progress)
      yield {
        status: 'processing',
        progress: 30,
        currentStep: 'AI is analyzing your soil test document...'
      };

      const extractionPrompt = buildExtractionPrompt(contextData);
      const responseSchema = buildSafeExtractionSchema();

      const extractionResponse = await base44.integrations.Core.InvokeLLM({
        prompt: extractionPrompt,
        response_json_schema: responseSchema,
        file_urls: [file_url],
        add_context_from_internet: false
      });

      // Step 3: Parse extraction results (60% progress)
      yield {
        status: 'processing',
        progress: 60,
        currentStep: 'Parsing extracted data...'
      };

      const extractResult = (typeof extractionResponse === 'string')
        ? (() => { try { return JSON.parse(extractionResponse); } catch { return {}; } })()
        : (extractionResponse || {});

      if (!extractResult || !extractResult.soil_tests || extractResult.soil_tests.length === 0) {
        throw new Error("No soil test data could be extracted from this document. Please ensure it's a valid soil test report.");
      }

      // Step 4: Prepare records with metadata (80% progress)
      yield {
        status: 'processing',
        progress: 80,
        currentStep: 'Preparing records for save...'
      };

      const normalizeDate = (dateString) => {
        if (!dateString) return format(new Date(), 'yyyy-MM-dd');
        try {
          return format(new Date(dateString), 'yyyy-MM-dd');
        } catch {
          return format(new Date(), 'yyyy-MM-dd');
        }
      };

      const testsWithMetadata = extractResult.soil_tests.map((test, index) => ({
        ...test,
        soil_data: test.soil_data || {},
        field_name: contextData.field_name,
        field_size_acres: contextData.field_size_acres,
        crop_type: contextData.intended_crop,
        farming_method: contextData.farming_method,
        previous_crop_history: contextData.previous_crop_history,
        soil_type: contextData.soil_type,
        irrigation_type: contextData.irrigation_type,
        location: contextData.location,
        raw_file_url: file_url,
        test_date: normalizeDate(test.test_date),
        zone_name: test.zone_name || `${contextData.field_name} - Zone ${index + 1}`,
        tempId: `${file.name}_${index}`
      }));

      // Step 5: Save directly to entities (90% progress)
      yield {
        status: 'processing',
        progress: 90,
        currentStep: 'Saving records to database...'
      };

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 1);

      const recordsToCreate = testsWithMetadata.map((test) => {
        const now = new Date();
        const timestamp = now.toISOString();
        
        const dataToSave = {
          field_name: test.field_name,
          zone_name: test.zone_name,
          test_date: test.test_date,
          soil_data: test.soil_data,
          field_size_acres: test.field_size_acres,
          crop_type: test.crop_type,
          farming_method: test.farming_method,
          previous_crop_history: test.previous_crop_history,
          soil_type: test.soil_type,
          irrigation_type: test.irrigation_type,
          location: test.location,
          raw_file_url: test.raw_file_url,
          analysis_status: 'complete',
          created_date: timestamp,
          updated_date: timestamp
        };

        // Remove null/undefined/empty values
        Object.keys(dataToSave).forEach(key => {
          if (dataToSave[key] === null || dataToSave[key] === undefined || dataToSave[key] === '') {
            delete dataToSave[key];
          }
        });

        if (isDemoUser) {
          dataToSave.is_demo_data = true;
          dataToSave.expires_at = expirationDate.toISOString();
        }

        return dataToSave;
      });

      // Use bulk create to save all records at once
      const createdRecords = await base44.entities.SoilTest.bulkCreate(recordsToCreate);

      // Step 6: Complete (100% progress)
      yield {
        status: 'complete',
        progress: 100,
        currentStep: 'Processing complete!',
        result: {
          tests: createdRecords,
          count: createdRecords.length,
          file_url
        }
      };

    } catch (error) {
      console.error('Upload service error:', error);
      
      let userFriendlyMessage = error.message || 'An unexpected error occurred';
      
      // Make error messages more user-friendly
      if (error.message?.includes('extraction')) {
        userFriendlyMessage = 'Failed to extract data from the document. Please ensure it\'s a valid soil test report.';
      } else if (error.message?.includes('VertexAI') || error.message?.includes('LLM')) {
        userFriendlyMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
      } else if (error.message?.includes('validation')) {
        userFriendlyMessage = 'The extracted data failed validation. Please check your document format.';
      } else if (error.message?.includes('subscription') || error.message?.includes('blocked')) {
        userFriendlyMessage = 'Service temporarily unavailable. Please try again or contact support.';
      }

      yield {
        status: 'failed',
        progress: 0,
        currentStep: '',
        error: userFriendlyMessage
      };
    }
  }
}

export default UploadService;