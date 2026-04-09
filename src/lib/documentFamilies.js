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
      heroTitle: "Add data",
      heroSubtitle:
        "Attach yield scale tickets or ton sheets as evidence for the field you select in the next step.",
      step1Title: "Step 1: Upload your yield ticket PDF",
      step1Description:
        "Drag & drop your scanned scale ticket or ton sheet, or click to browse for a PDF file.",
      dropTitle: "Upload your yield ticket",
      dropSubtitle: "Drag & drop your PDF, or click to browse",
      contextCta: "Continue — attach to field",
    };
  }

  // Default: soil_test
  return {
    heroTitle: "Add data",
    heroSubtitle:
      "Upload a soil test PDF, then attach it to a field so evidence stays organized for review and export.",
    step1Title: "Step 1: Upload your soil test PDF",
    step1Description: "Drag & drop your soil test report PDF, or click to browse.",
    dropTitle: "Upload your soil test",
    dropSubtitle: "Drag & drop your PDF, or click to browse",
    contextCta: "Continue — attach to field",
  };
}

export function getStepLabels(documentFamily) {
  if (isYieldTicketDocument(documentFamily)) {
    return ["Upload", "Field & evidence", "Processing", "Review data", "Context"];
  }
  return ["Upload", "Field & evidence", "Processing", "Review data", "Context"];
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

