import { createPageUrl } from '@/utils';

/**
 * Creates a deep-link URL to the Field Visualization page for a specific field
 * @param {string} fieldId - The UUID of the field to link to
 * @returns {string} - The complete URL with field parameter
 */
export const createFieldDeepLink = (fieldId) => {
  if (!fieldId) {
    console.warn('createFieldDeepLink: fieldId is required');
    return createPageUrl('FieldVisualization');
  }
  
  return createPageUrl(`FieldVisualization?fieldId=${fieldId}`);
};

/**
 * Alternative function that accepts field object
 * @param {Object} field - Field object with id property
 * @returns {string} - The complete URL with field parameter
 */
export const createFieldDeepLinkFromObject = (field) => {
  if (!field || !field.id) {
    console.warn('createFieldDeepLinkFromObject: field with id is required');
    return createPageUrl('FieldVisualization');
  }
  
  return createFieldDeepLink(field.id);
};

export default createFieldDeepLink;