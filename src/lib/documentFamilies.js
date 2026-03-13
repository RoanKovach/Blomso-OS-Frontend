// Document family helpers for upload/review flows.
// Backend is currently soil-test-first; yield_scale_ticket is frontend-only for now.

export const DOCUMENT_FAMILY_SOIL_TEST = 'soil_test';
export const DOCUMENT_FAMILY_YIELD_TICKET = 'yield_scale_ticket';

export function isSoilDocument(documentFamily) {
  return (documentFamily || DOCUMENT_FAMILY_SOIL_TEST) === DOCUMENT_FAMILY_SOIL_TEST;
}

export function isYieldTicketDocument(documentFamily) {
  return documentFamily === DOCUMENT_FAMILY_YIELD_TICKET;
}

export function getUploadCopy(documentFamily) {
  if (isYieldTicketDocument(documentFamily)) {
    return {
      heroTitle: 'Upload Document',
      heroSubtitle:
        'Upload yield scale tickets or ton sheets as agricultural evidence.',
      step1Title: 'Step 1: Upload Your Yield Scale Ticket',
      step1Description:
        'Drag & drop your scanned scale ticket or ton sheet, or click to browse for a PDF file.',
      dropTitle: 'Upload Your Yield Scale Ticket',
      dropSubtitle:
        'Drag & drop your scanned scale ticket or ton sheet, or click to browse',
      contextCta: 'Continue to Harvest Context',
    };
  }

  // Default: soil_test
  return {
    heroTitle: 'Upload Document',
    heroSubtitle:
      'Upload soil test reports as PDFs for AI-assisted analysis and recommendations.',
    step1Title: 'Step 1: Upload Your Soil Test Report',
    step1Description:
      'Drag & drop your soil test report PDF, or click to browse.',
    dropTitle: 'Upload Your Soil Test',
    dropSubtitle:
      'Drag & drop your soil test report, or click to browse',
    contextCta: 'Continue to Field Context',
  };
}

export function getStepLabels(documentFamily) {
  if (isYieldTicketDocument(documentFamily)) {
    return ['Upload File', 'Harvest Context', 'AI Processing', 'Review Ticket Data'];
  }
  // Default soil_test labels (preserve existing semantics)
  return ['Upload File', 'Field Context', 'AI Processing', 'Review Extracted Data'];
}

export function getReviewTitle(documentFamily) {
  if (isYieldTicketDocument(documentFamily)) {
    return 'Review Yield Ticket Data';
  }
  if (isSoilDocument(documentFamily)) {
    return 'Review Soil Test Data';
  }
  return 'Review Extracted Data';
}

